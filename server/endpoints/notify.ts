import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security";
import { connectToDatabase } from "../_db";
import { notifySubscribersAboutPost } from "../lib/postNotifications";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        if (!requireAuth(req, res)) return;

        const { title, excerpt, postId } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Post title is required." });
        }

        // Get all subscriber emails
        const { db } = await connectToDatabase();
        const result = await notifySubscribersAboutPost(db, { id: postId, title, excerpt });
        if (result.sent === 0) {
            if (result.skippedReason === "mailer-not-configured") {
                return res.status(500).json({ error: "Email sending is not configured. Add RESEND_API_KEY to environment variables." });
            }
            return res.status(200).json({ message: "No subscribers yet.", sent: 0 });
        }

        return res.status(200).json({ message: `Notification sent to ${result.sent} subscriber(s)!`, sent: result.sent });
    } catch (error: any) {
        console.error("Notify API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to send notifications." });
    }
}
