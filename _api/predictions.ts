import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, sanitizeString } from "../server/utils/security";
import { connectToDatabase } from "./_db";

const COLLECTION = "prediction_votes";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        if (req.method === "GET") {
            const matchId = sanitizeString(req.query.matchId as string);
            const deviceId = sanitizeString(req.query.deviceId as string) || req.cookies?.deviceId;

            if (!matchId) {
                return res.status(400).json({ error: "Missing matchId" });
            }

            const doc = await collection.findOne({ matchId });

            const distribution = doc?.distribution || {};
            const totalVotes = doc?.totalVotes || 0;
            const userPrediction = deviceId && doc?.userPredictions?.[deviceId]
                ? doc.userPredictions[deviceId]
                : null;

            // Calculate percentages
            const percentages: Record<string, number> = {};
            if (totalVotes > 0) {
                for (const [option, count] of Object.entries(distribution)) {
                    percentages[option] = Math.round(((count as number) / totalVotes) * 100);
                }
            }

            return res.status(200).json({ distribution, percentages, totalVotes, userPrediction });
        }

        if (req.method === "POST") {
            const matchId = sanitizeString(req.body?.matchId);
            const prediction = sanitizeString(req.body?.prediction);
            const deviceId = sanitizeString(req.body?.deviceId) || req.cookies?.deviceId;

            if (!matchId || !prediction) {
                return res.status(400).json({ error: "Missing matchId or prediction" });
            }

            if (!deviceId) {
                return res.status(400).json({ error: "Missing deviceId" });
            }

            // Check if already predicted
            const existing = await collection.findOne({
                matchId,
                [`userPredictions.${deviceId}`]: { $exists: true },
            });

            if (existing) {
                // Return existing data instead of error — better UX
                const totalVotes = existing.totalVotes || 0;
                const percentages: Record<string, number> = {};
                if (totalVotes > 0) {
                    for (const [option, count] of Object.entries(existing.distribution || {})) {
                        percentages[option] = Math.round(((count as number) / totalVotes) * 100);
                    }
                }
                return res.status(200).json({
                    success: true,
                    alreadyVoted: true,
                    distribution: existing.distribution,
                    percentages,
                    totalVotes,
                    userPrediction: existing.userPredictions[deviceId],
                });
            }

            // Upsert: increment prediction count
            const result = await collection.findOneAndUpdate(
                { matchId },
                {
                    $inc: {
                        [`distribution.${prediction}`]: 1,
                        totalVotes: 1,
                    },
                    $set: { [`userPredictions.${deviceId}`]: prediction },
                    $setOnInsert: { createdAt: new Date() },
                },
                { upsert: true, returnDocument: "after" }
            );

            const totalVotes = result?.totalVotes || 0;
            const percentages: Record<string, number> = {};
            if (totalVotes > 0) {
                for (const [option, count] of Object.entries(result?.distribution || {})) {
                    percentages[option] = Math.round(((count as number) / totalVotes) * 100);
                }
            }

            return res.status(200).json({
                success: true,
                distribution: result?.distribution,
                percentages,
                totalVotes,
                userPrediction: prediction,
            });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Predictions API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
