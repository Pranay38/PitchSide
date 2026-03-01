import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "./_db.js";
import { sendEmail, isMailerConfigured } from "./_mailer.js";

const COLLECTION = "subscribers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── POST: Subscribe a new email ───
        if (req.method === "POST") {
            const { email } = req.body;

            if (!email || !email.includes("@") || !email.includes(".")) {
                return res.status(400).json({ error: "Please enter a valid email address." });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Check for duplicates
            const existing = await collection.findOne({ email: normalizedEmail });
            if (existing) {
                return res.status(200).json({ message: "You're already subscribed! 🎉", alreadySubscribed: true });
            }

            // Save subscriber
            await collection.insertOne({
                email: normalizedEmail,
                subscribedAt: new Date().toISOString(),
            });

            // Send welcome email (non-blocking, don't fail the request if email fails)
            if (isMailerConfigured()) {
                try {
                    await sendEmail({
                        to: normalizedEmail,
                        subject: "Welcome to The Touchline Dribble! ⚽",
                        html: `
                            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #fff; border-radius: 16px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #16A34A, #15803d); padding: 32px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px; color: white;">⚽ The Touchline Dribble</h1>
                                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Football Analysis & Opinion</p>
                                </div>
                                <div style="padding: 32px;">
                                    <h2 style="color: #4ade80; margin: 0 0 16px;">You're in! 🎉</h2>
                                    <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px;">
                                        Thanks for subscribing to <strong style="color: #fff;">The Touchline Dribble</strong>. 
                                        You'll receive email notifications whenever we publish new articles — 
                                        sharp analysis, tactical breakdowns, and bold opinions delivered straight to your inbox.
                                    </p>
                                    <p style="color: #94A3B8; line-height: 1.6; margin: 0;">
                                        Stay tuned for the next post! ⚽🔥
                                    </p>
                                </div>
                                <div style="padding: 16px 32px; border-top: 1px solid #1E293B; text-align: center;">
                                    <p style="color: #64748B; font-size: 12px; margin: 0;">© 2026 The Touchline Dribble. All rights reserved.</p>
                                </div>
                            </div>
                        `,
                    });
                } catch (emailError) {
                    console.error("Failed to send welcome email:", emailError);
                    // Don't fail the subscription if email sending fails
                }
            }

            return res.status(201).json({ message: "Subscribed successfully! Check your inbox for a welcome email ⚽" });
        }

        // ─── GET: List all subscribers (for admin) ───
        if (req.method === "GET") {
            const subscribers = await collection.find({}).sort({ subscribedAt: -1 }).toArray();
            return res.status(200).json({
                count: subscribers.length,
                subscribers: subscribers.map((s) => ({
                    email: s.email,
                    subscribedAt: s.subscribedAt,
                })),
            });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Subscribers API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
