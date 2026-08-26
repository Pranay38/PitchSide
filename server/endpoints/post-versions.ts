import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { requireAuth } from "../utils/security";

export default async function postVersionsHandler(req: VercelRequest, res: VercelResponse) {
    if (!(await requireAuth(req, res))) return;

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("post_versions");

        if (req.method === "GET") {
            const postId = req.query.postId as string;
            if (!postId) return res.status(400).json({ error: "Missing postId" });

            const version = req.query.version as string;
            
            if (version) {
                const doc = await collection.findOne({ postId, version: parseInt(version, 10) });
                if (!doc) return res.status(404).json({ error: "Version not found" });
                return res.status(200).json(doc);
            } else {
                const versions = await collection.find({ postId })
                    .sort({ version: -1 })
                    .project({ version: 1, title: 1, savedAt: 1 })
                    .toArray();
                
                const formatted = versions.map(v => ({
                    ...v,
                    title: v.title ? (v.title.length > 60 ? v.title.substring(0, 60) + '...' : v.title) : "Untitled"
                }));
                
                return res.status(200).json(formatted);
            }
        }

        if (req.method === "POST") {
            const { postId, version } = req.body;
            if (!postId || !version) return res.status(400).json({ error: "Missing postId or version" });

            const doc = await collection.findOne({ postId, version: parseInt(version, 10) });
            if (!doc) return res.status(404).json({ error: "Version not found" });

            const postsCollection = db.collection("posts");
            await postsCollection.updateOne(
                { _id: postId as any },
                { $set: { 
                    title: doc.title, 
                    content: doc.content, 
                    excerpt: doc.excerpt, 
                    coverImage: doc.coverImage, 
                    tags: doc.tags 
                } }
            );

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
