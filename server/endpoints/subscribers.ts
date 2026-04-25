import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth, checkOrigin, rejectHoneypot, sanitizeString } from "../utils/security";
import { connectToDatabase } from "../_db";
import { sendEmail, sendBatchEmails, isMailerConfigured } from "../_mailer";
import { createHash, randomBytes } from "crypto";

const COLLECTION = "subscribers";
const SUBSCRIBER_COOKIE_NAME = "ttd_newsletter";
const SUBSCRIBER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function isValidEmail(email: string): boolean {
    return email.includes("@") && email.includes(".");
}

function parseCookie(req: VercelRequest, name: string): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const pairs = cookieHeader.split(";").map((part) => part.trim());
    for (const pair of pairs) {
        if (!pair.startsWith(`${name}=`)) continue;
        const [, rawValue = ""] = pair.split("=");
        try {
            return decodeURIComponent(rawValue);
        } catch {
            return rawValue;
        }
    }

    return null;
}

function hashSubscriberToken(token: string): string {
    const secret = process.env.JWT_SECRET || "fallback_dev_secret_do_not_use_in_prod";
    return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

function getSubscriberTokenHashes(subscriber: any): string[] {
    const hashes = Array.isArray(subscriber?.bannerTokenHashes)
        ? subscriber.bannerTokenHashes.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
        : [];

    if (typeof subscriber?.bannerTokenHash === "string" && subscriber.bannerTokenHash.length > 0) {
        hashes.push(subscriber.bannerTokenHash);
    }

    return Array.from(new Set(hashes));
}

function buildSubscriberCookie(req: VercelRequest, token: string): string {
    const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
    const host = req.headers.host || "";
    const secure = forwardedProto === "https" || !host.includes("localhost");
    return [
        `${SUBSCRIBER_COOKIE_NAME}=${encodeURIComponent(token)}`,
        `Max-Age=${SUBSCRIBER_COOKIE_MAX_AGE}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        secure ? "Secure" : "",
    ]
        .filter(Boolean)
        .join("; ");
}

async function issueSubscriberCookie(
    req: VercelRequest,
    res: VercelResponse,
    collection: any,
    subscriber: any,
): Promise<void> {
    const rawToken = randomBytes(24).toString("hex");
    const hashedToken = hashSubscriberToken(rawToken);
    const nextTokenHashes = [...getSubscriberTokenHashes(subscriber), hashedToken].slice(-5);

    await collection.updateOne(
        { _id: subscriber._id },
        {
            $set: {
                bannerTokenHashes: nextTokenHashes,
                updatedAt: new Date().toISOString(),
            },
            $unset: { bannerTokenHash: "" },
        },
    );

    res.setHeader("Set-Cookie", buildSubscriberCookie(req, rawToken));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Public subscribe status ───
        if (req.method === "GET" && req.query.action === "status") {
            res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
            const email = sanitizeString(req.query.email);
            const normalizedEmail = email && isValidEmail(email) ? email.trim().toLowerCase() : null;
            const cookieToken = parseCookie(req, SUBSCRIBER_COOKIE_NAME);
            const cookieHash = cookieToken ? hashSubscriberToken(cookieToken) : null;

            let subscriber =
                normalizedEmail
                    ? await collection.findOne({ email: normalizedEmail })
                    : null;

            if (!subscriber && cookieHash) {
                subscriber = await collection.findOne({
                    $or: [
                        { bannerTokenHashes: cookieHash },
                        { bannerTokenHash: cookieHash },
                    ],
                });
            }

            if (!subscriber) {
                return res.status(200).json({ subscribed: false });
            }

            const tokenHashes = getSubscriberTokenHashes(subscriber);
            const hasCurrentCookie = cookieHash ? tokenHashes.includes(cookieHash) : false;

            if (!hasCurrentCookie) {
                await issueSubscriberCookie(req, res, collection, subscriber);
            }

            return res.status(200).json({ subscribed: true });
        }

        // ─── POST: Subscribe a new email ───
        if (req.method === "POST" && !req.query.action) {
            // CSRF + honeypot
            if (!checkOrigin(req, res)) return;
            if (!rejectHoneypot(req, res)) return;

            const email = sanitizeString(req.body?.email);

            const alertPreferences = req.body?.alertPreferences;

            if (!email || !isValidEmail(email)) {
                return res.status(400).json({ error: "Please enter a valid email address." });
            }

            const normalizedEmail = email.trim().toLowerCase();

            // Check for duplicates
            const existing = await collection.findOne({ email: normalizedEmail });
            if (existing) {
                await collection.updateOne(
                    { email: normalizedEmail },
                    {
                        $set: {
                            ...(alertPreferences ? { alertPreferences } : {}),
                            updatedAt: new Date().toISOString(),
                        },
                    },
                );
                await issueSubscriberCookie(req, res, collection, existing);
                return res.status(200).json({ message: "You're already subscribed! 🎉", alreadySubscribed: true });
            }

            // Save subscriber
            const insertedSubscriber = {
                email: normalizedEmail,
                subscribedAt: new Date().toISOString(),
                welcomeSequenceState: 1, // 1 = Received Welcome, waiting for Day 1
                ...(alertPreferences ? { alertPreferences } : {}),
            };
            const insertResult = await collection.insertOne(insertedSubscriber);
            await issueSubscriberCookie(req, res, collection, {
                ...insertedSubscriber,
                _id: insertResult.insertedId,
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

        // ─── GET: Unsubscribe an email ───
        if (req.method === "GET" && req.query.action === "unsubscribe") {
            const email = sanitizeString(req.query.email);
            const normalizedEmail = email && isValidEmail(email) ? email.trim().toLowerCase() : null;

            if (!normalizedEmail) {
                return res.status(400).send("Invalid email address.");
            }

            await collection.updateOne(
                { email: normalizedEmail },
                { $set: { status: "unsubscribed", updatedAt: new Date().toISOString() } }
            );

            // Return a simple HTML response
            res.setHeader("Content-Type", "text/html");
            return res.status(200).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Unsubscribed</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .card { background: #1E293B; padding: 40px; border-radius: 12px; text-align: center; max-width: 400px; width: 90%; }
                        h1 { margin-top: 0; font-size: 24px; }
                        p { color: #94A3B8; margin-bottom: 24px; line-height: 1.5; }
                        a { color: #16A34A; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 6px; background: rgba(22, 163, 74, 0.1); transition: background 0.2s; }
                        a:hover { background: rgba(22, 163, 74, 0.2); }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>You've been unsubscribed</h1>
                        <p>We're sorry to see you go. You will no longer receive emails from The Touchline Dribble.</p>
                        <a href="/">Return to Homepage</a>
                    </div>
                </body>
                </html>
            `);
        }

        // ─── GET: List all subscribers (for admin) ───
        if (req.method === "GET") {
            if (!(await requireAuth(req, res))) return;
            res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
            const subscribers = await collection.find({}).sort({ subscribedAt: -1 }).toArray();
            return res.status(200).json({
                count: subscribers.length,
                subscribers: subscribers.map((s) => ({
                    email: s.email,
                    subscribedAt: s.subscribedAt,
                    alertPreferences: s.alertPreferences || null,
                })),
            });
        }

        // ─── POST: Send Digest (for admin) ───
        if (req.method === "POST" && req.query.action === "send-digest") {
            if (!(await requireAuth(req, res))) return;

            if (!isMailerConfigured()) {
                return res.status(500).json({ error: "Mailer is not configured." });
            }

            const { subject, htmlContent } = req.body;
            if (!subject || !htmlContent) {
                return res.status(400).json({ error: "Subject and HTML are required." });
            }

            // Fetch active subscribers
            const subscribers = await collection.find({}).toArray();
            if (subscribers.length === 0) {
                return res.status(400).json({ error: "No subscribers found." });
            }

            const batchList = subscribers.map(s => ({
                to: s.email,
                subject,
                html: htmlContent
            }));

            await sendBatchEmails(batchList);

            return res.status(200).json({ message: `Digest sent to ${subscribers.length} subscribers!` });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Subscribers API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
