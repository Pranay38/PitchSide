import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../utils/security";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../_db";

const COLLECTION = "comments";

function buildFilter(id: string) {
    return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch comments for a post or user ───
        if (req.method === "GET") {
            const postId = req.query.postId as string;
            const userId = req.query.userId as string;

            if (!postId && !userId) {
                return res.status(400).json({ error: "Missing postId or userId parameter" });
            }

            const query: any = {};
            if (postId) query.postId = postId;
            if (userId) query.userId = userId;

            const comments = await collection
                .find(query)
                .sort({ createdAt: userId && !postId ? -1 : 1 }) // Older first for threads, newest first for activity feeds
                .toArray();

            const result = comments.map(c => {
                const { _id, ...rest } = c;
                return {
                    ...rest,
                    id: String(_id),
                };
            });

            return res.status(200).json(result);
        }

        // ─── POST: Create a new comment or reply, or like a comment ───
        if (req.method === "POST") {
            const { action, commentId } = req.body;

            // Handle likes
            if (action === "like") {
                if (!commentId) return res.status(400).json({ error: "Missing commentId" });
                const filter = buildFilter(commentId);
                const result = await collection.updateOne(filter, { $inc: { likes: 1 } });
                if (result.matchedCount === 0) return res.status(404).json({ error: "Comment not found" });
                return res.status(200).json({ success: true });
            }

            // Create a comment/reply
            const { postId, parentId, name, text, clubBadge, userId } = req.body;
            
            if (!postId || !name?.trim() || !text?.trim()) {
                return res.status(400).json({ error: "postId, name, and text are required" });
            }

            const doc = {
                postId,
                userId: userId || null,
                parentId: parentId || null,
                name: name.trim().slice(0, 50),
                text: text.trim().slice(0, 2000),
                clubBadge: clubBadge || null,
                likes: 0,
                createdAt: new Date().toISOString(),
            };

            const result = await collection.insertOne(doc);
            
            return res.status(201).json({ 
                ...doc, 
                id: String(result.insertedId) 
            });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Comments API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
