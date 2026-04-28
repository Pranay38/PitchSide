import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, sanitizeString } from "../server/utils/security";
import { connectToDatabase } from "./_db";

const COLLECTION = "hot_take_votes";

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
            const postId = sanitizeString(req.query.postId as string);
            const takeId = sanitizeString(req.query.takeId as string);
            const deviceId = sanitizeString(req.query.deviceId as string) || req.cookies?.deviceId;

            if (!postId || !takeId) {
                return res.status(400).json({ error: "Missing postId or takeId" });
            }

            // Aggregate votes for this take
            const doc = await collection.findOne({ postId, takeId });

            const votes = doc?.votes || { agree: 0, disagree: 0 };
            const userVote = deviceId && doc?.userVotes?.[deviceId] ? doc.userVotes[deviceId] : null;

            return res.status(200).json({ votes, userVote });
        }

        if (req.method === "POST") {
            const postId = sanitizeString(req.body?.postId);
            const takeId = sanitizeString(req.body?.takeId);
            const vote = sanitizeString(req.body?.vote);
            const deviceId = sanitizeString(req.body?.deviceId) || req.cookies?.deviceId;

            if (!postId || !takeId || !vote) {
                return res.status(400).json({ error: "Missing postId, takeId, or vote" });
            }

            if (vote !== "agree" && vote !== "disagree") {
                return res.status(400).json({ error: "Invalid vote — must be 'agree' or 'disagree'" });
            }

            if (!deviceId) {
                return res.status(400).json({ error: "Missing deviceId" });
            }

            // Check if user already voted
            const existing = await collection.findOne({
                postId,
                takeId,
                [`userVotes.${deviceId}`]: { $exists: true },
            });

            if (existing) {
                return res.status(409).json({
                    error: "Already voted",
                    votes: existing.votes,
                    userVote: existing.userVotes[deviceId],
                });
            }

            // Upsert: increment vote count and record user vote
            const result = await collection.findOneAndUpdate(
                { postId, takeId },
                {
                    $inc: { [`votes.${vote}`]: 1 },
                    $set: { [`userVotes.${deviceId}`]: vote },
                    $setOnInsert: { createdAt: new Date() },
                },
                { upsert: true, returnDocument: "after" }
            );

            return res.status(200).json({
                success: true,
                votes: result?.votes || { agree: 0, disagree: 0 },
                userVote: vote,
            });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Hot Takes API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
