import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../../api/_db";

/**
 * GET /api/ensure-indexes
 * Creates MongoDB indexes for optimal query performance.
 * Should be called once during setup or periodically.
 */
export default async function ensureIndexesHandler(req: VercelRequest, res: VercelResponse) {
  // Only allow with admin auth
  const auth = req.headers.authorization?.replace("Bearer ", "");
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { db } = await connectToDatabase();

    // Posts indexes
    await db.collection("posts").createIndex({ date: -1 }, { background: true });
    await db.collection("posts").createIndex({ club: 1, date: -1 }, { background: true });
    await db.collection("posts").createIndex({ isDraft: 1, date: -1 }, { background: true });
    await db.collection("posts").createIndex({ tags: 1 }, { background: true });
    await db.collection("posts").createIndex({ id: 1 }, { unique: true, background: true });

    // User preferences index
    await db.collection("user_preferences").createIndex({ userId: 1 }, { unique: true, background: true });

    // Error logs index (auto-cleanup uses createdAt)
    await db.collection("error_logs").createIndex({ createdAt: -1 }, { background: true });

    // Subscribers index
    await db.collection("subscribers").createIndex({ email: 1 }, { unique: true, background: true });

    // Transfer tracker
    await db.collection("transfers").createIndex({ createdAt: -1 }, { background: true });

    // Article views for recommendations
    await db.collection("article_views").createIndex({ articleId: 1, sessionId: 1 }, { background: true });
    await db.collection("article_views").createIndex({ userId: 1 }, { background: true });

    // Polls
    await db.collection("polls").createIndex({ createdAt: -1 }, { background: true });

    // Debates
    await db.collection("debates").createIndex({ createdAt: -1 }, { background: true });

    return res.json({
      ok: true,
      message: "All indexes created successfully",
      collections: ["posts", "user_preferences", "error_logs", "subscribers", "transfers", "article_views", "polls", "debates"],
    });
  } catch (err) {
    console.error("Index creation error:", err);
    return res.status(500).json({ error: "Failed to create indexes" });
  }
}
