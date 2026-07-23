import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../../_api/_db";

/**
 * GET /api/armchair-ratings?postId=xxx&deviceId=yyy
 *   Returns community vote aggregates for a post's armchair ratings,
 *   plus whether this device has already voted.
 *
 * POST /api/armchair-ratings-vote
 *   Body: { postId, deviceId, ratings: { "Player Name": 8, ... } }
 *   Stores the fan's votes and returns updated aggregates.
 */

const COLLECTION = "armchairRatingsVotes";

// GET: fetch aggregated fan votes + check if device already voted
export async function getArmchairRatings(req: VercelRequest, res: VercelResponse) {
    try {
        const { postId, deviceId } = req.query as { postId: string; deviceId: string };

        if (!postId) {
            return res.status(400).json({ error: "Missing postId" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // Find all votes for this post
        const votes = await collection.find({ postId }).toArray();

        // Build aggregated fan votes: { "Player Name": { totalScore, voteCount } }
        const fanVotes: Record<string, { totalScore: number; voteCount: number }> = {};
        let userRatings: Record<string, number> | null = null;
        const voterDeviceIds = new Set<string>();

        for (const vote of votes) {
            voterDeviceIds.add(vote.deviceId);

            if (vote.deviceId === deviceId) {
                userRatings = vote.ratings || {};
            }

            if (vote.ratings && typeof vote.ratings === "object") {
                for (const [player, score] of Object.entries(vote.ratings)) {
                    if (!fanVotes[player]) {
                        fanVotes[player] = { totalScore: 0, voteCount: 0 };
                    }
                    fanVotes[player].totalScore += Number(score) || 0;
                    fanVotes[player].voteCount += 1;
                }
            }
        }

        return res.status(200).json({
            fanVotes,
            userRatings,
            totalVoters: voterDeviceIds.size,
        });
    } catch (error) {
        console.error("Failed to fetch armchair ratings:", error);
        return res.status(500).json({ error: "Failed to fetch armchair ratings" });
    }
}

// POST: submit fan ratings for a post
export async function voteArmchairRatings(req: VercelRequest, res: VercelResponse) {
    try {
        const { postId, deviceId, ratings } = req.body;

        if (!postId || !deviceId || !ratings || typeof ratings !== "object") {
            return res.status(400).json({ error: "Missing postId, deviceId, or ratings" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // Check for duplicate vote
        const existing = await collection.findOne({ postId, deviceId });
        if (existing) {
            return res.status(409).json({ error: "Already voted", fanVotes: null });
        }

        // Sanitize ratings (must be 1-10)
        const sanitized: Record<string, number> = {};
        for (const [player, score] of Object.entries(ratings)) {
            const num = Number(score);
            if (num >= 1 && num <= 10) {
                sanitized[player] = num;
            }
        }

        if (Object.keys(sanitized).length === 0) {
            return res.status(400).json({ error: "No valid ratings provided" });
        }

        // Insert vote
        await collection.insertOne({
            postId,
            deviceId,
            ratings: sanitized,
            createdAt: new Date().toISOString(),
        });

        // Return updated aggregates
        const allVotes = await collection.find({ postId }).toArray();
        const fanVotes: Record<string, { totalScore: number; voteCount: number }> = {};
        const voterDeviceIds = new Set<string>();

        for (const vote of allVotes) {
            voterDeviceIds.add(vote.deviceId);
            if (vote.ratings && typeof vote.ratings === "object") {
                for (const [player, score] of Object.entries(vote.ratings)) {
                    if (!fanVotes[player]) {
                        fanVotes[player] = { totalScore: 0, voteCount: 0 };
                    }
                    fanVotes[player].totalScore += Number(score) || 0;
                    fanVotes[player].voteCount += 1;
                }
            }
        }

        return res.status(200).json({
            fanVotes,
            totalVoters: voterDeviceIds.size,
        });
    } catch (error) {
        console.error("Failed to vote armchair ratings:", error);
        return res.status(500).json({ error: "Failed to vote armchair ratings" });
    }
}
