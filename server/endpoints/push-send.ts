import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, requireAuth } from "../utils/security";
import { connectToDatabase } from "../_db";
import webpush from "web-push";

const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@pitchside.app";

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (req.method === "OPTIONS") return res.status(200).end();

    // Require admin auth
    if (!requireAuth(req, res)) return;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        if (!publicVapidKey || !privateVapidKey) {
            return res.status(500).json({ error: "VAPID keys are not configured" });
        }

        const { title, body, url, icon, badge } = req.body;
        if (!title || !body) {
            return res.status(400).json({ error: "Title and body are required" });
        }

        const payload = JSON.stringify({
            title,
            body,
            url: url || "https://pitchside-orcin.vercel.app",
            icon: icon || "https://pitchside-orcin.vercel.app/pwa-192x192.png",
            badge: badge || "https://pitchside-orcin.vercel.app/pwa-192x192.png"
        });

        const { db } = await connectToDatabase();
        const collection = db.collection("push_subscriptions");
        
        const subscriptions = await collection.find({}).toArray();
        let successCount = 0;
        let failCount = 0;

        const promises = subscriptions.map(async (sub) => {
            try {
                // Must extract just the webpush subscription shape
                const pushSub = {
                    endpoint: sub.endpoint,
                    keys: sub.keys
                };
                await webpush.sendNotification(pushSub, payload);
                successCount++;
            } catch (error: any) {
                failCount++;
                if (error.statusCode === 404 || error.statusCode === 410) {
                    console.log("Subscription has expired or is no longer valid:", sub.endpoint);
                    await collection.deleteOne({ endpoint: sub.endpoint });
                } else {
                    console.error("Error sending push notification:", error);
                }
            }
        });

        await Promise.allSettled(promises);

        return res.status(200).json({ 
            success: true, 
            sent: successCount, 
            failed: failCount, 
            total: subscriptions.length 
        });
    } catch (error: any) {
        console.error("Push send error:", error);
        return res.status(500).json({ error: error.message });
    }
}
