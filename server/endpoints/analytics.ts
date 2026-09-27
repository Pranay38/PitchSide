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

        // 5. Subscriber Growth Trend (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Use aggregation instead of fetching all subscribers into memory
        const dailyCounts = await db.collection("subscribers").aggregate([
            { $match: { subscribedAt: { $gte: thirtyDaysAgo } } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$subscribedAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]).toArray();

        const dailyCountMap: Record<string, number> = {};
        for (const entry of dailyCounts) {
            dailyCountMap[entry._id] = entry.count;
        }

        // Build the 30-day growth array with proper typing
        const growthMap: Record<string, number> = {};
        for (let d = 0; d < 30; d++) {
            const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
            const key = date.toISOString().split("T")[0];
            growthMap[key] = dailyCountMap[key] || 0;
        }

        const sortedEntries = Object.entries(growthMap)
            .sort(([a], [b]) => a.localeCompare(b));

        // Count subscribers before the 30-day window for cumulative baseline
        const totalBefore30d = await db.collection("subscribers").countDocuments({
            subscribedAt: { $lt: thirtyDaysAgo }
        });

        let running = totalBefore30d;
        const subscriberGrowth = sortedEntries.map(([date, count]) => {
            running += count;
            return { date, newSubscribers: count, cumulativeTotal: running };
        });

        // 6. Cron Health
        const cronJobs = await db.collection("cron_logs")
            .find({})
            .sort({ lastRunAt: -1 })
            .limit(20)
            .toArray();

        // 7. Recent Errors
        const recentErrors = await db.collection("error_logs")
            .find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        // 8. End-of-article CTA funnel (last 30 days)
        const ctaEventCounts = await db.collection("growth_events").aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: "$event", count: { $sum: 1 } } },
        ]).toArray();
        const ctaCounts = Object.fromEntries(ctaEventCounts.map((entry) => [entry._id, entry.count]));
        const ctaViews = ctaCounts.cta_view || 0;
        const ctaSubscriptions = ctaCounts.cta_subscribe || 0;
        const ctaSupportClicks = ctaCounts.cta_support_click || 0;

        const ctaByArticle = await db.collection("growth_events").aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $group: {
                _id: "$postId",
                views: { $sum: { $cond: [{ $eq: ["$event", "cta_view"] }, 1, 0] } },
                subscriptions: { $sum: { $cond: [{ $eq: ["$event", "cta_subscribe"] }, 1, 0] } },
                supportClicks: { $sum: { $cond: [{ $eq: ["$event", "cta_support_click"] }, 1, 0] } },
            } },
            { $sort: { subscriptions: -1, supportClicks: -1, views: -1 } },
            { $limit: 10 },
        ]).toArray();

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
            })),
            subscriberGrowth,
            ctaFunnel: {
                views: ctaViews,
                subscriptions: ctaSubscriptions,
                supportClicks: ctaSupportClicks,
                conversionRate: ctaViews > 0 ? Number(((ctaSubscriptions / ctaViews) * 100).toFixed(1)) : 0,
                byArticle: ctaByArticle.map((entry) => ({
                    postId: entry._id,
                    views: entry.views,
                    subscriptions: entry.subscriptions,
                    supportClicks: entry.supportClicks,
                })),
            },
            cronHealth: cronJobs.map(j => ({
                jobName: j.jobName,
                lastRunAt: j.lastRunAt,
                status: j.status,
                error: j.error || null,
                ...(j.emailsSent !== undefined ? { emailsSent: j.emailsSent } : {}),
                ...(j.day1Sent !== undefined ? { day1Sent: j.day1Sent, day3Sent: j.day3Sent } : {}),
            })),
            recentErrors: recentErrors.map(e => ({
                type: e.type,
                email: e.email ? e.email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : null,
                error: e.error,
                timestamp: e.timestamp,
            }))
        };

        return res.status(200).json(analyticsData);
    } catch (error: any) {
        console.error("Analytics API Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
