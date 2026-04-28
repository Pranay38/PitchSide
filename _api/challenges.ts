import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, sanitizeString, rejectHoneypot } from "../server/utils/security";
import { connectToDatabase } from "./_db";

const COLLECTION = "take_challenges";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        if (req.method === "POST") {
            // Bot protection
            if (!rejectHoneypot(req, res)) return;

            const text = sanitizeString(req.body?.text);
            const postId = sanitizeString(req.body?.postId);
            const deviceId = sanitizeString(req.body?.deviceId) || req.cookies?.deviceId;

            if (!text || text.length === 0) {
                return res.status(400).json({ error: "Challenge text is required" });
            }

            if (text.length > 280) {
                return res.status(400).json({ error: "Challenge text exceeds 280 character limit" });
            }

            // Rate limit: max 3 challenges per device per day
            if (deviceId) {
                const dayStart = new Date();
                dayStart.setHours(0, 0, 0, 0);

                const todayCount = await collection.countDocuments({
                    deviceId,
                    createdAt: { $gte: dayStart },
                });

                if (todayCount >= 3) {
                    return res.status(429).json({ error: "Daily challenge limit reached (3/day)" });
                }
            }

            await collection.insertOne({
                text,
                postId: postId || null,
                deviceId: deviceId || null,
                createdAt: new Date(),
                featured: false,
                reviewed: false,
            });

            return res.status(201).json({ success: true });
        }

        // Admin GET: list challenges for moderation
        if (req.method === "GET") {
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
            const skip = parseInt(req.query.skip as string) || 0;
            const featured = req.query.featured === "true";

            const filter: Record<string, unknown> = {};
            if (featured) filter.featured = true;

            const challenges = await collection
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            const total = await collection.countDocuments(filter);

            return res.status(200).json({ challenges, total });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Challenges API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
