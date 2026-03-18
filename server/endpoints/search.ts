import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../utils/security.js";
import { connectToDatabase } from "../_db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;
    if (req.method === "OPTIONS") return res.status(200).end();

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
        return res.status(200).json([]);
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("posts");

        let results;

        try {
            // Attempt MongoDB Atlas Search ($search)
            results = await collection.aggregate([
                {
                    $search: {
                        index: "default", // Assumes default index name "default" in Atlas UI
                        text: {
                            query: query,
                            path: { wildcard: "*" } // Search across all mapped string fields
                        }
                    }
                },
                { $limit: 10 },
                {
                    $project: {
                        title: 1,
                        excerpt: 1,
                        slug: 1,
                        author: 1,
                        publishedAt: 1,
                        tags: 1,
                        score: { $meta: "searchScore" }
                    }
                }
            ]).toArray();
        } catch (searchError: any) {
            // Fallback to standard regex match if $search pipeline fails (e.g., index not built or not M0 supported feature set)
            console.warn("Atlas $search failed, falling back to $regex:", searchError.message);
            
            // Escape regex specials
            const regex = new RegExp(query.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
            
            results = await collection.find({
                $or: [
                    { title: regex },
                    { excerpt: regex },
                    { content: regex },
                    { tags: regex }
                ]
            })
            .sort({ publishedAt: -1 })
            .limit(10)
            .project({
                title: 1,
                excerpt: 1,
                slug: 1,
                author: 1,
                publishedAt: 1,
                tags: 1
            })
            .toArray();
        }

        // Map _id to id
        const mappedResults = results.map(doc => {
            const { _id, ...rest } = doc;
            return { id: String(_id), ...rest };
        });

        return res.status(200).json(mappedResults);
    } catch (error: any) {
        console.error("Search API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
