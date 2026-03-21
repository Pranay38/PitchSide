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

    try {
        const { db } = await connectToDatabase();
        
        if (req.method === "GET") {
            const { itemId, type } = req.query;
            if (!itemId || !type) return res.status(400).json({ error: "Missing parameters" });
            
            const collectionName = type === "story" ? STORIES_COLLECTION : POSTS_COLLECTION;
            const collection = db.collection(collectionName);
            
            const doc = await collection.findOne(buildIdFilter(String(itemId)), { 
                projection: { userReactions: 1, reactions: 1 } 
            });
            
            if (!doc) return res.status(404).json({ error: "Not found" });
            
            const deviceId = req.cookies?.deviceId;
            const userReaction = deviceId && doc.userReactions ? doc.userReactions[deviceId] : null;

            return res.status(200).json({
                reactions: doc.reactions || {},
                userReaction,
            });
        }

        if (req.method === "POST") {
            const { itemId, type, reaction, deviceId: bodyDeviceId } = req.body;

            if (!itemId || !type || !reaction) {
                return res.status(400).json({ error: "Missing itemId, type, or reaction" });
            }

            const validReactions = ["fire", "mindblown", "thumbsdown", "target", "cold", "screamer", "howler", "offside", "worldie", "tekkers", "shithouse", "bottled"];
            if (!validReactions.includes(reaction)) {
                return res.status(400).json({ error: "Invalid reaction type" });
            }

            const collectionName = type === "story" ? STORIES_COLLECTION : POSTS_COLLECTION;
            const collection = db.collection(collectionName);
            
            const deviceId = req.cookies?.deviceId || bodyDeviceId;
            
            if (deviceId) {
                // Check if already reacted
                const existing = await collection.findOne({
                    ...buildIdFilter(String(itemId)),
                    [`userReactions.${deviceId}`]: { $exists: true }
                });
                if (existing) {
                    return res.status(400).json({ error: "Already reacted to this item" });
                }
            }

            const updateOperation: any = {
                $inc: {
                    [`reactions.${reaction}`]: 1
                }
            };
            
            if (deviceId) {
                updateOperation.$set = {
                    [`userReactions.${deviceId}`]: reaction
                };
            }

            const result = await collection.findOneAndUpdate(
                buildIdFilter(String(itemId)),
                updateOperation,
                { returnDocument: 'after' }
            );

            if (!result) {
                return res.status(404).json({ error: "Item not found" });
            }

            return res.status(200).json({ success: true, reactions: result.reactions, userReaction: reaction });
        }
    } catch (error: any) {
        console.error("React API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
