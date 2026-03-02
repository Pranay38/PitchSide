import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "./_db.js";

const COLLECTION = "comments";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch comments for a post ───
        if (req.method === "GET") {
            const postId = req.query.postId as string;
            if (!postId) {
                return res.status(400).json({ error: "postId query parameter is required." });
            }

            const comments = await collection
                .find({ postId })
                .sort({ timestamp: -1 })
                .toArray();

            return res.status(200).json(
                comments.map((c) => ({
                    id: c._id.toString(),
                    name: c.name,
                    text: c.text,
                    timestamp: c.timestamp,
                }))
            );
        }

        // ─── POST: Add a comment ───
        if (req.method === "POST") {
            const { postId, name, text } = req.body;

            if (!postId || !name?.trim() || !text?.trim()) {
                return res.status(400).json({ error: "postId, name, and text are required." });
            }

            const comment = {
                postId,
                name: name.trim(),
                text: text.trim(),
                timestamp: Date.now(),
            };

            await collection.insertOne(comment);

            return res.status(201).json({
                id: comment.postId,
                name: comment.name,
                text: comment.text,
                timestamp: comment.timestamp,
            });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Comments API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
