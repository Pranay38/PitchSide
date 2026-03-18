import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security.js";
import { connectToDatabase } from "../_db.js";
import { sendEmail, isMailerConfigured } from "../_mailer.js";

/**
 * Newsletter endpoint — admin-only.
 * POST with action "send": compile and dispatch a newsletter to all subscribers.
 * POST with action "preview": return the newsletter HTML for admin preview.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;
    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireAuth(req, res)) return;

    try {
        const { db } = await connectToDatabase();
        const { action, subject, intro, articles } = req.body;

        // articles = [{ title, excerpt, url }]
        if (!articles || !Array.isArray(articles) || articles.length === 0) {
            return res.status(400).json({ error: "At least one article is required" });
        }

        const emailSubject = (subject || "⚽ This Week on The Touchline Dribble").trim();
        const introText = (intro || "Here are the top articles from this week.").trim();

        // Build the newsletter HTML
        const articlesHtml = articles
            .map(
                (a: any, i: number) => `
                <tr>
                    <td style="padding: 20px 0; ${i > 0 ? "border-top: 1px solid #1E293B;" : ""}">
                        <h3 style="margin: 0 0 8px; font-size: 18px; color: #ffffff;">
                            <a href="${a.url}" style="color: #4ade80; text-decoration: none;">${a.title}</a>
                        </h3>
                        <p style="margin: 0; color: #94A3B8; font-size: 14px; line-height: 1.6;">${a.excerpt || ""}</p>
                        <a href="${a.url}" style="display: inline-block; margin-top: 10px; color: #16A34A; font-size: 13px; font-weight: 600; text-decoration: none;">
                            Read more →
                        </a>
                    </td>
                </tr>`
            )
            .join("");

        const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #fff; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #16A34A, #15803d); padding: 32px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: white;">⚽ The Touchline Dribble</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Weekly Newsletter</p>
            </div>
            <div style="padding: 32px;">
                <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${introText}</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    ${articlesHtml}
                </table>
            </div>
            <div style="padding: 20px 32px; background: #0b1120; text-align: center;">
                <p style="color: #64748B; font-size: 12px; margin: 0;">
                    You received this because you subscribed to The Touchline Dribble.
                </p>
            </div>
        </div>`;

        // Preview mode — just return the HTML
        if (action === "preview") {
            return res.status(200).json({ html, subject: emailSubject });
        }

        // Send mode
        if (!isMailerConfigured()) {
            return res.status(500).json({
                error: "Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel env vars.",
            });
        }

        const subscribers = await db.collection("subscribers").find({}).toArray();
        if (subscribers.length === 0) {
            return res.status(400).json({ error: "No subscribers found" });
        }

        const emails = subscribers.map((s: any) => s.email);
        let sent = 0;
        let failed = 0;

        // Send in batches of 10 to avoid rate limits
        const BATCH_SIZE = 10;
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = emails.slice(i, i + BATCH_SIZE);
            try {
                await sendEmail({
                    to: batch,
                    subject: emailSubject,
                    html,
                });
                sent += batch.length;
            } catch (err) {
                console.error("Newsletter batch send failed:", err);
                failed += batch.length;
            }
        }

        // Log the dispatch
        await db.collection("newsletter_log").insertOne({
            subject: emailSubject,
            articleCount: articles.length,
            recipientCount: emails.length,
            sent,
            failed,
            sentAt: new Date().toISOString(),
        });

        return res.status(200).json({ sent, failed, total: emails.length });
    } catch (error: any) {
        console.error("Newsletter API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
