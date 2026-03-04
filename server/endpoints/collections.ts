import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../_db.js";

const COLLECTION = "collections";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch all collections (with optional post details) ───
        if (req.method === "GET") {
            const id = req.query.id as string;

            // Single collection with full post data
            if (id) {
                const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
                const col = await collection.findOne(filter);
                if (!col) return res.status(404).json({ error: "Collection not found" });

                // Fetch the actual posts in this collection
                const postIds = col.postIds || [];
                let posts: any[] = [];
                if (postIds.length > 0) {
                    const postsCollection = db.collection("posts");
                    posts = await postsCollection.find({
                        $or: postIds.flatMap((pid: string) => {
                            const filters: any[] = [{ id: pid }];
                            if (ObjectId.isValid(pid)) filters.push({ _id: new ObjectId(pid) });
                            return filters;
                        }),
                    }).toArray();
                    posts = posts.map((p) => {
                        const { _id, ...rest } = p;
                        return { ...rest, id: rest.id || String(_id) };
                    });
                }

                const { _id, ...rest } = col;
                return res.status(200).json({ ...rest, id: String(_id), posts });
            }

            // All collections (summary)
            const collections = await collection.find({}).sort({ createdAt: -1 }).toArray();
            const result = collections.map((c) => {
                const { _id, ...rest } = c;
                return { ...rest, id: String(_id), postCount: (rest.postIds || []).length };
            });
            return res.status(200).json(result);
        }

        // ─── POST: Create a new collection ───
        if (req.method === "POST") {
            const { title, description, emoji, postIds } = req.body;
            if (!title) return res.status(400).json({ error: "Title is required" });

            const doc = {
                title: title.trim(),
                description: (description || "").trim(),
                emoji: emoji || "📚",
                postIds: postIds || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const result = await collection.insertOne(doc);
            return res.status(201).json({ ...doc, id: String(result.insertedId) });
        }

        // ─── PUT: Update a collection ───
        if (req.method === "PUT") {
            const { id, ...updates } = req.body;
            if (!id) return res.status(400).json({ error: "Missing collection id" });

            updates.updatedAt = new Date().toISOString();
            const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
            const result = await collection.updateOne(filter, { $set: updates });
            if (result.matchedCount === 0) return res.status(404).json({ error: "Collection not found" });
            return res.status(200).json({ success: true });
        }

        // ─── DELETE: Delete a collection ───
        if (req.method === "DELETE") {
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing collection id" });

            const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
            const result = await collection.deleteOne(filter);
            if (result.deletedCount === 0) return res.status(404).json({ error: "Collection not found" });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Collections API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
