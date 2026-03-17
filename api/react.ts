import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../server/utils/security.js";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "./_db.js";

const POSTS_COLLECTION = "posts";
const STORIES_COLLECTION = "stories";

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

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { itemId, type, reaction } = req.body;

        if (!itemId || !type || !reaction) {
            return res.status(400).json({ error: "Missing itemId, type, or reaction" });
        }

        const validReactions = ["fire", "mindblown", "thumbsdown", "target", "cold"];
        if (!validReactions.includes(reaction)) {
            return res.status(400).json({ error: "Invalid reaction type" });
        }

        const collectionName = type === "story" ? STORIES_COLLECTION : POSTS_COLLECTION;

        const { db } = await connectToDatabase();
        const collection = db.collection(collectionName);

        const updateOperation = {
            $inc: {
                [`reactions.${reaction}`]: 1
            }
        };

        const result = await collection.findOneAndUpdate(
            buildIdFilter(String(itemId)),
            updateOperation,
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ error: "Item not found" });
        }

        return res.status(200).json({ success: true, reactions: result.reactions });
    } catch (error: any) {
        console.error("React API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
