import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../../api/_db";

/**
 * POST /api/error-log
 * Receives client-side error reports from ErrorBoundary via navigator.sendBeacon.
 * Stores them in MongoDB for monitoring.
 * Rate limiting is handled globally by Upstash in sys.ts (strict: 10 req/min/IP).
 */
export default async function errorLogHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { message, stack, componentStack, url, userAgent, timestamp } = body;

    if (!message) {
      return res.status(400).json({ error: "Missing error message" });
    }

    const { db } = await connectToDatabase();
    await db.collection("error_logs").insertOne({
      message: String(message).slice(0, 500),
      stack: String(stack || "").slice(0, 2000),
      componentStack: String(componentStack || "").slice(0, 1000),
      url: String(url || "").slice(0, 500),
      userAgent: String(userAgent || "").slice(0, 300),
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date(),
    });

    // Auto-cleanup: keep only last 500 error logs
    const count = await db.collection("error_logs").countDocuments();
    if (count > 500) {
      const oldest = await db.collection("error_logs")
        .find()
        .sort({ createdAt: 1 })
        .limit(count - 500)
        .toArray();
      if (oldest.length > 0) {
        const idsToDelete = oldest.map((doc: any) => doc._id);
        await db.collection("error_logs").deleteMany({ _id: { $in: idsToDelete } });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error log ingestion failed:", err);
    return res.status(500).json({ error: "Failed to log error" });
  }
}
