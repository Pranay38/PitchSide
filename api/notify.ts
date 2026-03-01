import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "./_db.js";
import { sendEmail, isMailerConfigured } from "./_mailer.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        if (!isMailerConfigured()) {
            return res.status(500).json({ error: "Email sending is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to environment variables." });
        }

        const { title, excerpt, postId } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Post title is required." });
        }

        // Get all subscriber emails
        const { db } = await connectToDatabase();
        const subscribers = await db.collection("subscribers").find({}).toArray();

        if (subscribers.length === 0) {
            return res.status(200).json({ message: "No subscribers yet.", sent: 0 });
        }

        const emails = subscribers.map((s) => s.email);
        const postUrl = postId ? `https://pitchside-orcin.vercel.app/post/${postId}` : "https://pitchside-orcin.vercel.app";

        // Send email to all subscribers (BCC for privacy)
        await sendEmail({
            to: emails,
            subject: `New Post: ${title} ⚽`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #fff; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #16A34A, #15803d); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; color: white;">⚽ The Touchline Dribble</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">New Article Published!</p>
                    </div>
                    <div style="padding: 32px;">
                        <h2 style="color: #fff; margin: 0 0 12px; font-size: 22px;">${title}</h2>
                        ${excerpt ? `<p style="color: #94A3B8; line-height: 1.6; margin: 0 0 24px;">${excerpt}</p>` : ""}
                        <a href="${postUrl}" style="display: inline-block; padding: 12px 28px; background: #16A34A; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Read Now →</a>
                    </div>
                    <div style="padding: 16px 32px; border-top: 1px solid #1E293B; text-align: center;">
                        <p style="color: #64748B; font-size: 12px; margin: 0;">© 2026 The Touchline Dribble. All rights reserved.</p>
                    </div>
                </div>
            `,
        });

        return res.status(200).json({ message: `Notification sent to ${emails.length} subscriber(s)!`, sent: emails.length });
    } catch (error: any) {
        console.error("Notify API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to send notifications." });
    }
}
