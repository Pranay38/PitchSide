import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../server/_db";
import { sendEmail, isMailerConfigured } from "../server/_mailer";

const SITE_URL = "https://pitchside-orcin.vercel.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET requests for the Cron job
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Security Check: Ensure this is called by Vercel Cron or an authorized admin
    // Vercel sends an authorization header for cron jobs. If you run it manually for testing, 
    // you need to pass a secret token.
    const authHeader = req.headers.authorization;
    if (
        authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
        req.query.secret !== process.env.CRON_SECRET
    ) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isMailerConfigured()) {
        return res.status(500).json({ error: "Mailer is not configured (missing env vars)" });
    }

    try {
        const { db } = await connectToDatabase();

        // 1. Fetch active subscribers
        const subscribers = await db.collection("subscribers")
            .find({ status: { $ne: "unsubscribed" } })
            .toArray();

        if (subscribers.length === 0) {
            return res.status(200).json({ message: "No active subscribers found. Skipping." });
        }

        const bccList = subscribers.map(s => s.email).join(",");

        // 2. Fetch posts from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentPosts = await db.collection("posts")
            .find({ 
                date: { $gte: sevenDaysAgo.toISOString() },
                status: { $ne: "draft" }
            })
            .sort({ "reactions.fire": -1, "reactions.mindblown": -1, date: -1 }) // Sort by popularity then date
            .limit(5)
            .toArray();

        if (recentPosts.length === 0) {
            return res.status(200).json({ message: "No new posts in the last 7 days. Skipping." });
        }

        // 3. Build the Email HTML
        const postsHtml = recentPosts.map(post => `
            <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
                ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;" />` : ''}
                <div style="font-size: 11px; font-weight: bold; color: #16A34A; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">
                    ${post.club || "Football"} • ${post.readTime || "5 min read"}
                </div>
                <h3 style="margin: 0 0 10px 0; font-size: 20px; color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
                    <a href="${SITE_URL}/post/${post.id}" style="color: #0f172a; text-decoration: none;">${post.title}</a>
                </h3>
                <p style="margin: 0 0 15px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    ${post.excerpt}
                </p>
                <a href="${SITE_URL}/post/${post.id}" style="display: inline-block; padding: 8px 16px; background-color: #16A34A; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">
                    Read Article →
                </a>
            </div>
        `).join('');

        const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                <div style="text-align: center; padding-bottom: 20px; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9;">
                    <h1 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">The Touchline Dribble</h1>
                    <p style="margin: 5px 0 0 0; color: #16A34A; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Weekly Digest</p>
                </div>
                
                <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
                    Here is a roundup of our top football analysis and stories from the past week.
                </p>

                ${postsHtml}

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p>You received this email because you subscribed to The Touchline Dribble.</p>
                    <p><a href="${SITE_URL}" style="color: #16A34A; text-decoration: none;">Visit the Website</a></p>
                </div>
            </div>
        `;

        // 4. Send the Email
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        await sendEmail({
            to: process.env.GMAIL_USER as string, // Send to self
            bcc: bccList, // Hidden recipients
            subject: `The Touchline Dribble: Weekly Digest (${dateStr})`,
            html: emailHtml
        });

        return res.status(200).json({ 
            message: "Weekly digest sent successfully", 
            emailsSent: subscribers.length,
            postsIncluded: recentPosts.length
        });

    } catch (error) {
        console.error("Cron Digest Error:", error);
        return res.status(500).json({ error: "Failed to send digest" });
    }
}
