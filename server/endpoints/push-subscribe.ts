import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../utils/security";
import { connectToDatabase } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;
    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: "Invalid subscription" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection("push_subscriptions");

        // Upsert based on endpoint to avoid duplicates
        await collection.updateOne(
            { endpoint: subscription.endpoint },
            { $set: { ...subscription, updatedAt: new Date().toISOString() } },
            { upsert: true }
        );

        return res.status(201).json({ success: true });
    } catch (error: any) {
        console.error("Push subscribe error:", error);
        return res.status(500).json({ error: error.message });
    }
}
