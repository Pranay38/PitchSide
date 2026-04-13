import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security";
import { connectToDatabase } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;
    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Only admins can view analytics
    if (!(await requireAuth(req, res))) return;

    try {
        const { db } = await connectToDatabase();

        // 1. High-Level KPIs
        const totalSubscribers = await db.collection("subscribers").countDocuments();
        
        // Count published posts (not drafts)
        const totalPosts = await db.collection("posts").countDocuments({ isDraft: { $ne: true } });
        
        // Count total comments
        const totalComments = await db.collection("comments").countDocuments();
        
        // Count total debates
        const totalDebates = await db.collection("debates").countDocuments();

        // 2. Top Performing Posts (by views, descending)
        // Taking the top 5 published posts
        const topPosts = await db.collection("posts")
            .find({ isDraft: { $ne: true } })
            .sort({ views: -1 })
            .limit(5)
            .project({ title: 1, views: 1, likes: 1 })
            .toArray();

        // 3. Newsletter History
        // Taking the last 5 sent newsletters
        const recentNewsletters = await db.collection("newsletter_log")
            .find({})
            .sort({ sentAt: -1 })
            .limit(5)
            .toArray();

        // 4. Other Engagement Metrics
        const totalPollVotesResult = await db.collection("polls")
            .aggregate([
                { $unwind: { path: "$options" } },
                { $group: { _id: null, totalVotes: { $sum: "$options.votes" } } }
            ]).toArray();
        const totalPollVotes = totalPollVotesResult.length > 0 ? totalPollVotesResult[0].totalVotes : 0;

        const analyticsData = {
            kpis: {
                totalSubscribers,
                totalPosts,
                totalComments,
                totalDebates,
                totalPollVotes
            },
            topPosts: topPosts.map(p => ({
                title: p.title || "Untitled",
                views: p.views || 0,
                likes: p.likes?.length || 0 // Assuming likes is an array of user IDs
            })),
            newsletters: recentNewsletters.map(n => ({
                subject: n.subject,
                sentAt: n.sentAt,
                sent: n.sent || 0,
                failed: n.failed || 0
            }))
        };

        return res.status(200).json(analyticsData);
    } catch (error: any) {
        console.error("Analytics API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
