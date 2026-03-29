import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed. Use GET." });
    }

    try {
        const { userId } = req.query;

        if (!userId || typeof userId !== "string") {
            return res.status(400).json({ error: "userId is required" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection("ai_history");

        const history = await collection
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        // Optional: sanitize or shape data
        const safeHistory = history.map(doc => ({
            id: doc._id.toString(),
            type: doc.type,
            prompt: doc.prompt,
            response: doc.response,
            createdAt: doc.createdAt
        }));

        return res.status(200).json(safeHistory);
    } catch (error: any) {
        console.error("Error fetching AI history:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
