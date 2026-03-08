import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../server/utils/security.js";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "./_db.js";

// Default seed posts (used when DB is empty on first run)
import { blogPosts as defaultPosts } from "../src/app/data/posts.js";

const COLLECTION = "posts";

function buildIdFilter(id: string) {
    const filters: Array<Record<string, unknown>> = [{ id }, { _id: id }];
    if (ObjectId.isValid(id)) {
        filters.push({ _id: new ObjectId(id) });
    }
    return { $or: filters };
}

async function promoteLatestPostToMainStory(collection: any): Promise<string | null> {
    const latestPost = await collection.find({}).sort({ _id: -1 }).limit(1).next();
    if (!latestPost) return null;

    await collection.updateMany({ mainStory: true }, { $set: { mainStory: false } });
    await collection.updateOne({ _id: latestPost._id }, { $set: { mainStory: true } });

    return (latestPost.id as string | undefined) || String(latestPost._id);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

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
            if (!requireAuth(req, res)) return;
            const postData = req.body;
            const id = Date.now().toString();
            const newPost = { ...postData, id, _id: id as any };
            await collection.insertOne(newPost);
            const { _id, ...result } = newPost;
            return res.status(201).json(result);
        }

        // ─── PUT: Update a post ───
        if (req.method === "PUT") {
            if (!requireAuth(req, res)) return;
            const { id, ...updates } = req.body;
            if (!id) return res.status(400).json({ error: "Missing post id" });

            const result = await collection.updateOne(buildIdFilter(id), { $set: updates });
            if (result.matchedCount === 0) {
                if (updates.mainStory === true) {
                    const fallbackMainStoryId = await promoteLatestPostToMainStory(collection);
                    if (fallbackMainStoryId) {
                        return res.status(200).json({
                            success: true,
                            fallbackApplied: true,
                            mainStoryId: fallbackMainStoryId,
                            message: "No matching post found. Latest post promoted to Main Story.",
                        });
                    }
                    return res.status(404).json({ error: "Post not found and no posts are available for Main Story fallback" });
                }
                return res.status(404).json({ error: "Post not found" });
            }
            return res.status(200).json({ success: true });
        }

        // ─── DELETE: Delete a post ───
        if (req.method === "DELETE") {
            if (!requireAuth(req, res)) return;
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing post id" });

            const result = await collection.deleteOne(buildIdFilter(id));
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Post not found" });
            }
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
