import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../server/utils/security.js";
import { connectToDatabase } from "./_db.js";

const COLLECTION = "user_preferences";

/**
 * Sync saved posts, followed clubs, and followed players for authenticated users.
 *
 * GET  /api/user-prefs?userId=xxx  → returns the user's stored preferences
 * POST /api/user-prefs              → upserts the user's preferences
 *   body: { userId: string, savedPosts?: string[], followedClubs?: string[], followedPlayers?: string[] }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    const { db } = await connectToDatabase();
    const col = db.collection(COLLECTION);

    if (req.method === "GET") {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const doc = await col.findOne({ userId });
        return res.status(200).json(doc || { userId, savedPosts: [], followedClubs: [], followedPlayers: [] });
    }

    if (req.method === "POST") {
        const { userId, savedPosts, followedClubs, followedPlayers } = req.body || {};
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const update: Record<string, unknown> = { userId, updatedAt: new Date().toISOString() };
        if (Array.isArray(savedPosts)) update.savedPosts = savedPosts;
        if (Array.isArray(followedClubs)) update.followedClubs = followedClubs;
        if (Array.isArray(followedPlayers)) update.followedPlayers = followedPlayers;

        await col.updateOne(
            { userId },
            { $set: update },
            { upsert: true }
        );

        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
