import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "./_db";

// Default seed posts (used when DB is empty on first run)
import { blogPosts as defaultPosts } from "../src/app/data/posts";

const COLLECTION = "posts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch all posts ───
        if (req.method === "GET") {
            let posts = await collection.find({}).sort({ _id: -1 }).toArray();

            // If empty, seed with defaults
            if (posts.length === 0 && defaultPosts.length > 0) {
                await collection.insertMany(
                    defaultPosts.map((p) => ({ ...p, _id: p.id as any }))
                );
                posts = await collection.find({}).sort({ _id: -1 }).toArray();
            }

            // Map _id → id for client compatibility
            const result = posts.map((p) => {
                const { _id, ...rest } = p;
                return { ...rest, id: rest.id || String(_id) };
            });

            return res.status(200).json(result);
        }

        // ─── POST: Create a new post ───
        if (req.method === "POST") {
            const postData = req.body;
            const id = Date.now().toString();
            const newPost = { ...postData, id, _id: id as any };
            await collection.insertOne(newPost);
            const { _id, ...result } = newPost;
            return res.status(201).json(result);
        }

        // ─── PUT: Update a post ───
        if (req.method === "PUT") {
            const { id, ...updates } = req.body;
            if (!id) return res.status(400).json({ error: "Missing post id" });

            await collection.updateOne(
                { $or: [{ id }, { _id: id as any }] },
                { $set: updates }
            );
            return res.status(200).json({ success: true });
        }

        // ─── DELETE: Delete a post ───
        if (req.method === "DELETE") {
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing post id" });

            await collection.deleteOne({ $or: [{ id }, { _id: id as any }] });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
