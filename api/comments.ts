import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "./_db.js";
import { checkOrigin, rejectHoneypot, sanitizeString } from "../server/utils/security.js";

const COLLECTION = "comments";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    // CSRF origin check for state-changing methods
    if (!checkOrigin(req, res)) return;

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

            const deviceId = req.cookies?.deviceId;

            return res.status(200).json(
                comments.map((c) => ({
                    id: c._id.toString(),
                    postId: c.postId,
                    parentId: c.parentId || null,
                    name: c.name,
                    text: c.text,
                    likes: c.likes || 0,
                    userLiked: deviceId && c.voters ? c.voters.includes(deviceId) : false,
                    createdAt: c.createdAt || new Date(c.timestamp).toISOString(),
                    clubBadge: c.clubBadge || null,
                }))
            );
        }

        // ─── POST: Add a comment ───
        if (req.method === "POST") {
            const { postId, parentId, name, text, action, commentId, clubBadge } = req.body;

            // Honeypot check
            if (!rejectHoneypot(req, res)) return;

            // Handle like action
            if (action === "like" && commentId) {
                const cid = sanitizeString(commentId);
                if (!cid) return res.status(400).json({ error: "Invalid commentId" });
                const { ObjectId } = await import("mongodb");
                let filter: any;
                try {
                    filter = { _id: new ObjectId(commentId) };
                } catch {
                    filter = { _id: commentId };
                }
                
                const deviceId = req.cookies?.deviceId || req.body?.deviceId;
                if (deviceId) {
                    // Check if already liked
                    const existing = await collection.findOne({ ...filter, voters: deviceId });
                    if (existing) return res.status(400).json({ error: "Already liked" });
                    
                    await collection.updateOne(filter, { 
                        $inc: { likes: 1 },
                        $addToSet: { voters: deviceId }
                    });
                } else {
                    await collection.updateOne(filter, { $inc: { likes: 1 } });
                }
                return res.status(200).json({ success: true });
            }

            const safeName = sanitizeString(name);
            const safeText = sanitizeString(text);
            const safePostId = sanitizeString(postId);

            if (!safePostId || !safeName || !safeText) {
                return res.status(400).json({ error: "postId, name, and text must be non-empty strings." });
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
