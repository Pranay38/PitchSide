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
                    postId: c.postId,
                    parentId: c.parentId || null,
                    name: c.name,
                    text: c.text,
                    likes: c.likes || 0,
                    createdAt: c.createdAt || new Date(c.timestamp).toISOString(),
                    clubBadge: c.clubBadge || null,
                }))
            );
        }

        // ─── POST: Add a comment ───
        if (req.method === "POST") {
            const { postId, parentId, name, text, action, commentId, clubBadge } = req.body;

            // Handle like action
            if (action === "like" && commentId) {
                const { ObjectId } = await import("mongodb");
                let filter: any;
                try {
                    filter = { _id: new ObjectId(commentId) };
                } catch {
                    filter = { _id: commentId };
                }
                await collection.updateOne(filter, { $inc: { likes: 1 } });
                return res.status(200).json({ success: true });
            }

            if (!postId || !name?.trim() || !text?.trim()) {
                return res.status(400).json({ error: "postId, name, and text are required." });
            }

            const now = new Date().toISOString();
            const comment: any = {
                postId,
                parentId: parentId || null,
                name: name.trim(),
                text: text.trim(),
                likes: 0,
                createdAt: now,
                timestamp: Date.now(),
            };

            // Attach club badge if provided
            if (clubBadge && clubBadge.name) {
                comment.clubBadge = {
                    name: clubBadge.name,
                    logoUrl: clubBadge.logoUrl || null,
                };
            }

            const result = await collection.insertOne(comment);

            return res.status(201).json({
                id: result.insertedId.toString(),
                postId: comment.postId,
                parentId: comment.parentId,
                name: comment.name,
                text: comment.text,
                likes: 0,
                createdAt: now,
                clubBadge: comment.clubBadge || null,
            });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Comments API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
