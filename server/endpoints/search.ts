import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../../api/_db";

/**
 * GET /api/search?q=arsenal+tactical
 * Full-text search across posts.
 * Tries MongoDB Atlas Search ($search) first, falls back to regex.
 * Rate limiting handled globally by sys.ts.
 */
export default async function searchHandler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const query = (req.query.q as string || "").trim();
    if (!query || query.length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("posts");

        let results: any[];

        try {
            // Attempt MongoDB Atlas Search ($search)
            results = await collection.aggregate([
                {
                    $search: {
                        index: "default",
                        text: {
                            query: query,
                            path: { wildcard: "*" },
                            fuzzy: { maxEdits: 1 },
                        }
                    }
                },
                { $match: { isDraft: { $ne: true } } },
                { $limit: limit },
                {
                    $project: {
                        _id: 0,
                        id: 1,
                        title: 1,
                        excerpt: 1,
                        coverImage: 1,
                        date: 1,
                        club: 1,
                        category: 1,
                        tags: 1,
                        readTime: 1,
                        score: { $meta: "searchScore" },
                    }
                }
            ]).toArray();
        } catch {
            // Fallback to regex if Atlas Search is not configured
            const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            results = await collection.find({
                isDraft: { $ne: true },
                $or: [
                    { title: regex },
                    { excerpt: regex },
                    { tags: regex },
                    { club: regex },
                    { category: regex },
                ],
            })
            .sort({ date: -1 })
            .limit(limit)
            .project({
                _id: 0,
                id: 1,
                title: 1,
                excerpt: 1,
                coverImage: 1,
                date: 1,
                club: 1,
                category: 1,
                tags: 1,
                readTime: 1,
            })
            .toArray();
        }

        res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return res.json({ results, count: results.length, query });
    } catch (err) {
        console.error("Search failed:", err);
        return res.status(500).json({ error: "Search failed" });
    }
}
