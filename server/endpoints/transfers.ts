import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security.js";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../_db.js";

const COLLECTION = "transfers";

function buildFilter(id: string) {
    return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch all active transfers ───
        if (req.method === "GET") {
            const transfers = await collection.find({}).sort({ updatedAt: -1 }).toArray();
            
            const result = transfers.map((t) => {
                const { _id, ...rest } = t;
                return { ...rest, id: String(_id) };
            });

            return res.status(200).json(result);
        }

        // ─── POST: Create or Update a Transfer (Admin) ───
        if (req.method === "POST") {
            if (!requireAuth(req, res)) return;
            const { id, player, playerImageUrl, fromClub, toClub, fee, source, status } = req.body;

            const now = new Date().toISOString();

            if (id) {
                // Update an existing transfer (e.g., status change via drag/drop/slider)
                const filter = buildFilter(id);
                
                // If only status is provided, update just the status
                const updateFields: any = { updatedAt: now };
                if (status) updateFields.status = status;
                if (player) updateFields.player = player.trim();
                if (playerImageUrl !== undefined) updateFields.playerImageUrl = playerImageUrl.trim();
                if (fromClub) updateFields.fromClub = fromClub.trim();
                if (toClub) updateFields.toClub = toClub.trim();
                if (fee) updateFields.fee = fee.trim();
                if (source) updateFields.source = source.trim();

                const result = await collection.updateOne(filter, { $set: updateFields });
                if (result.matchedCount === 0) return res.status(404).json({ error: "Transfer not found" });
                
                return res.status(200).json({ success: true });
            }

            // Create a new transfer rumor
            if (!player?.trim() || !fromClub?.trim() || !toClub?.trim() || !status) {
                return res.status(400).json({ error: "Player, From Club, To Club, and Status are required" });
            }

            const doc = {
                player: player.trim(),
                playerImageUrl: playerImageUrl?.trim() || "",
                fromClub: fromClub.trim(),
                toClub: toClub.trim(),
                fee: fee?.trim() || "Undisclosed",
                source: source?.trim() || "Unknown",
                status,
                updatedAt: now,
                createdAt: now,
            };

            const result = await collection.insertOne(doc);
            return res.status(201).json({ ...doc, id: String(result.insertedId) });
        }

        // ─── DELETE: Remove a transfer (Admin) ───
        if (req.method === "DELETE") {
            if (!requireAuth(req, res)) return;
            const id = req.query.id as string;
            
            if (!id) return res.status(400).json({ error: "Missing transfer id" });
            
            const result = await collection.deleteOne(buildFilter(id));
            if (result.deletedCount === 0) return res.status(404).json({ error: "Transfer not found" });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Transfers API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
