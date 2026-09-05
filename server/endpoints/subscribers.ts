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
            const clubPreferences = req.body?.clubPreferences;

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
                            ...(clubPreferences ? { clubPreferences } : {}),
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
                ...(clubPreferences ? { clubPreferences } : {}),
            };
            const insertResult = await collection.insertOne(insertedSubscriber);
            await issueSubscriberCookie(req, res, collection, {
                ...insertedSubscriber,
                _id: insertResult.insertedId,
            });

            // Send welcome email (non-blocking, don't fail the request if email fails)
            let emailSent = false;
            if (isMailerConfigured()) {
                try {
                    const unSubUrl = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host || "www.thetouchlinedribble.in"}/api/subscribers?action=unsubscribe&email=${encodeURIComponent(normalizedEmail)}`;
                    
                    const { buildEditorialEmail } = await import("../utils/emailTemplate");
                    const html = buildEditorialEmail({
                        title: "Welcome to The Touchline Dribble ⚽",
                        previewText: "You're in. Here is what to expect from us.",
                        unsubscribeUrl: unSubUrl,
                        content: `
                            <h2 class="headline serif">Welcome to the Inner Circle.</h2>
                            <p class="body-text sans">
                                Hi there,<br><br>
                                Thanks for trusting us with your inbox. I know it's a crowded space, so I'll make sure every email we send is worth your time.
                            </p>
                            <p class="body-text sans">
                                You are now on the list to receive our sharpest tactical breakdowns, exclusive opinion pieces, and in-depth analysis before anyone else. We don't do clickbait or standard match reports. We focus on the "why" and "how" of the beautiful game.
                            </p>
                            <div class="editors-note sans">
                                <strong>What's next?</strong><br>
                                Keep an eye out over the next few days. I'll be sending over a curated selection of our best timeless pieces to get you acquainted with our style of analysis.
                            </div>
                            <p class="body-text sans">
                                If there's a specific team or tactical concept you want us to cover, just hit reply to this email. I read every single one.
                            </p>
                            <p class="body-text sans" style="margin-top: 24px;">
                                Speak soon,<br>
                                <strong>Pranay Agarwal</strong><br>
                                Editor, The Touchline Dribble
                            </p>
                        `
                    });

                    await sendEmail({
                        to: normalizedEmail,
                        subject: "Welcome to The Touchline Dribble ⚽",
                        html,
                    });
                    emailSent = true;
                } catch (emailError) {
                    console.error("Failed to send welcome email:", emailError);
                    // Log to error_logs for admin dashboard visibility
                    try {
                        await db.collection("error_logs").insertOne({
                            type: "welcome_email",
                            email: normalizedEmail,
                            error: emailError instanceof Error ? emailError.message : String(emailError),
                            stack: emailError instanceof Error ? emailError.stack : undefined,
                            timestamp: new Date().toISOString(),
                        });
                    } catch (_logErr) {
                        // Last resort — don't let logging break the subscribe flow
                    }
                }
            }

            return res.status(201).json({
                message: emailSent
                    ? "Subscribed successfully! Check your inbox for a welcome email ⚽"
                    : "Subscribed successfully! Welcome email may be slightly delayed ⚽",
                emailSent,
            });
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
            const query: any = {};
            const targetClub = req.query.club;
            if (targetClub && typeof targetClub === "string" && targetClub !== "All") {
                query.clubPreferences = targetClub;
            }
            const subscribers = await collection.find(query).toArray();
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
