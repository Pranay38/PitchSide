import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { sendBatchEmails, isMailerConfigured } from "../_mailer";
import { requireAuth } from "../utils/security";
import { buildDigestEmail } from "../utils/digestEmail";
import { newsletterReading } from "../../src/app/lib/newsletterReading";
import type { BlogPost } from "../../src/app/data/posts";


export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Authentication Check
    // We allow GET (from Cron) or POST (from Admin dashboard)
    const authHeader = req.headers.authorization;
    const isCron = req.method === 'GET' && !!process.env.CRON_SECRET && (
        authHeader === `Bearer ${process.env.CRON_SECRET}` || 
        req.query.secret === process.env.CRON_SECRET
    );

    const isAdmin = req.method === 'POST' && await requireAuth(req, res);

    if (!isCron && !isAdmin) {
        // requireAuth already sends 401/403 if it fails and returns false
        if (req.method !== 'POST' && req.method !== 'GET') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
        if (!isCron && req.method === 'GET') {
            return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
        }
        return; // requireAuth handled the response
    }

    if (!isMailerConfigured()) {
        return res.status(500).json({ error: "Mailer is not configured (missing env vars)" });
    }

    try {
        const { db } = await connectToDatabase();

        // 1. Fetch active subscribers
        const subscribers = await db.collection("subscribers")
            .find({ status: { $ne: "unsubscribed" }, "preferences.digest": { $ne: false } })
            .toArray();

        if (subscribers.length === 0) {
            return res.status(200).json({ message: "No active subscribers found. Skipping." });
        }


        // Fetch recent posts, retaining older editorial picks for the companion lesson.
        const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

        const candidatePosts = await db.collection("posts")
            .find({ 
                isDraft: { $ne: true },
                status: { $ne: "draft" }
            })
            .sort({ _id: -1 })
            .limit(20)
            .toArray();

        // Filter manually in JS to avoid MongoDB string-to-ISO date comparison bugs for old string-formatted dates
        const recentPostsResult = candidatePosts.filter(p => {
            const timeMs = p.publishAt ? new Date(p.publishAt).getTime() : new Date(p.date).getTime();
            return timeMs >= sevenDaysAgoMs && timeMs <= Date.now();
        });

        if (recentPostsResult.length === 0) {
            return res.status(200).json({ message: "No new posts in the last 7 days. Skipping." });
        }

        const reading = newsletterReading(candidatePosts.map(post => ({ ...post, id: post.id || String(post._id), tags: post.tags || [] })) as unknown as BlogPost[]);
        if (!reading.opinion && !reading.explainer) {
            return res.status(200).json({ message: "No opinion or explainer available. Skipping." });
        }
        const dateStr = new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
        const subject = `The Weekly Whistle — ${dateStr}`;
        const batchList = subscribers.map(sub => buildDigestEmail(sub.email, reading, subject));

        await sendBatchEmails(batchList);

        await db.collection("cron_logs").updateOne(
            { jobName: "digest" },
            { $set: { 
                lastRunAt: new Date().toISOString(), 
                status: "success", 
                emailsSent: subscribers.length,
                postsIncluded: Number(!!reading.opinion) + Number(!!reading.explainer)
            } },
            { upsert: true }
        );

        return res.status(200).json({ 
            message: "Weekly digest sent successfully", 
            emailsSent: subscribers.length,
            postsIncluded: Number(!!reading.opinion) + Number(!!reading.explainer)
        });

    } catch (error) {
        console.error("Cron Digest Error:", error);
        try {
            const { db } = await connectToDatabase();
            await db.collection("cron_logs").updateOne(
                { jobName: "digest" },
                { $set: { lastRunAt: new Date().toISOString(), status: "failed", error: String(error) } },
                { upsert: true }
            );
        } catch (e) {}
        return res.status(500).json({ error: "Failed to send digest" });
    }
}
