import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../server/utils/security";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "./_db";

const COLLECTION = "posts";

function buildIdFilter(id: string) {
    const filters: Array<Record<string, unknown>> = [{ id }, { _id: id }];
    if (ObjectId.isValid(id)) {
        filters.push({ _id: new ObjectId(id) });
    }
    return { $or: filters };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        if (req.method === "POST") {
            const { postId, userId } = req.body;
            if (!postId || !userId) return res.status(400).json({ error: "Missing parameters" });

            const currentDoc = await collection.findOne(buildIdFilter(String(postId)));
            if (!currentDoc) return res.status(404).json({ error: "Post not found" });

            const likedBy: string[] = currentDoc.likedBy || [];
            const isLiked = likedBy.includes(userId);
            
            let updateOperation;
            if (isLiked) {
                updateOperation = { $pull: { likedBy: userId } };
            } else {
                updateOperation = { $addToSet: { likedBy: userId } };
            }

            const result = await collection.findOneAndUpdate(
                buildIdFilter(String(postId)),
                updateOperation,
                { returnDocument: "after" }
            );

            if (!result) return res.status(404).json({ error: "Failed to update" });

            return res.status(200).json({ success: true, liked: !isLiked, likedBy: result.likedBy || [] });
        }
        
    } catch (e: any) {
        return res.status(500).json({ error: e.message || "Internal Server Error" });
    }
}
