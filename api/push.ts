import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../server/utils/security.js";
import { connectToDatabase } from "../server/_db.js";

const COLLECTION = "push_subscriptions";

// VAPID keys — set these in Vercel Environment Variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@pitchside.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Return VAPID public key to the client ───
        if (req.method === "GET") {
            return res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
        }

        // ─── POST ───
        if (req.method === "POST") {
            const { action } = req.body;

            // Subscribe: store push subscription
            if (action === "subscribe") {
                const { subscription } = req.body;
                if (!subscription?.endpoint) {
                    return res.status(400).json({ error: "Valid push subscription required" });
                }

                // Upsert by endpoint to avoid duplicates
                await collection.updateOne(
                    { endpoint: subscription.endpoint },
                    { $set: { ...subscription, updatedAt: new Date().toISOString() } },
                    { upsert: true }
                );
                return res.status(201).json({ success: true });
            }

            // Unsubscribe
            if (action === "unsubscribe") {
                const { endpoint } = req.body;
                if (!endpoint) return res.status(400).json({ error: "Endpoint required" });
                await collection.deleteOne({ endpoint });
                return res.status(200).json({ success: true });
            }

            // Send notification (admin only)
            if (action === "send") {
                if (!requireAuth(req, res)) return;

                const { title, body, url } = req.body;
                if (!title?.trim()) return res.status(400).json({ error: "Notification title required" });

                if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
                    return res.status(500).json({ error: "VAPID keys not configured on server" });
                }

                // Dynamic import to avoid bundling web-push in the client
                const webpush = await import("web-push");
                webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

                const subscriptions = await collection.find({}).toArray();
                const payload = JSON.stringify({
                    title: title.trim(),
                    body: (body || "").trim(),
                    url: url || "/",
                });

                let sent = 0;
                let failed = 0;
                const failedEndpoints: string[] = [];

                for (const sub of subscriptions) {
                    try {
                        await webpush.sendNotification(
                            { endpoint: sub.endpoint, keys: sub.keys } as any,
                            payload
                        );
                        sent++;
                    } catch (err: any) {
                        failed++;
                        // Remove expired subscriptions (410 Gone or 404)
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            failedEndpoints.push(sub.endpoint);
                        }
                    }
                }

                // Clean up stale subscriptions
                if (failedEndpoints.length > 0) {
                    await collection.deleteMany({ endpoint: { $in: failedEndpoints } });
                }

                return res.status(200).json({ sent, failed, cleaned: failedEndpoints.length });
            }

            return res.status(400).json({ error: "Unknown action" });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Push API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
