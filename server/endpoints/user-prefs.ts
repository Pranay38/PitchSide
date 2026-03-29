import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../utils/security.js";
import { connectToDatabase } from "../_db.js";

const COLLECTION = "user_preferences";

/**
 * Sync saved posts, followed clubs, and followed players for authenticated users.
 *
 * GET  /api/sys?route=user-prefs&userId=xxx  → returns the user's stored preferences
 * POST /api/sys?route=user-prefs              → upserts the user's preferences
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

        res.setHeader("Cache-Control", "no-store, max-age=0");
        const doc = await col.findOne({ userId });
        return res.status(200).json(doc || { userId, savedPosts: [], followedClubs: [], followedPlayers: [], followedTags: [], fanClub: null, newsletterOptIn: false, readingHistory: [] });
    }

    if (req.method === "POST") {
        const { userId, savedPosts, followedClubs, followedPlayers, followedTags, fanClub, newsletterOptIn, readingHistory } = req.body || {};
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const update: Record<string, unknown> = { userId, updatedAt: new Date().toISOString() };
        if (Array.isArray(savedPosts)) update.savedPosts = savedPosts;
        if (Array.isArray(followedClubs)) update.followedClubs = followedClubs;
        if (Array.isArray(followedPlayers)) update.followedPlayers = followedPlayers;
        if (Array.isArray(followedTags)) update.followedTags = followedTags;
        if (fanClub !== undefined) update.fanClub = fanClub;
        if (newsletterOptIn !== undefined) update.newsletterOptIn = newsletterOptIn;
        if (Array.isArray(readingHistory)) update.readingHistory = readingHistory;

        await col.updateOne(
            { userId },
            { $set: update },
            { upsert: true }
        );

        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
}
