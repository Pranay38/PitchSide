import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../_db";

const COLLECTION = "match_cards";

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

        // ─── GET: Fetch all match cards or a single one by ID ───
        if (req.method === "GET") {
            const id = req.query.id as string;

            if (id) {
                const filter = buildFilter(id);
                const card = await collection.findOne(filter);
                if (!card) return res.status(404).json({ error: "Match card not found" });
                const { _id, ...rest } = card;
                return res.status(200).json({ ...rest, id: String(_id) });
            }

            const cards = await collection.find({}).sort({ matchDate: -1 }).toArray();
            const result = cards.map(c => {
                const { _id, ...rest } = c;
                return { ...rest, id: String(_id) };
            });
            return res.status(200).json(result);
        }

        // ─── POST: Create a new match card (admin) ───
        if (req.method === "POST") {
            if (!requireAuth(req, res)) return;

            const {
                homeTeam, awayTeam,
                homeScore, awayScore,
                homeScorers, awayScorers,
                competition, matchDate, venue,
                stats, // Array of { label, home, away }
                homePlayers, awayPlayers // Array of { name, rating, position }
            } = req.body;

            if (!homeTeam?.trim() || !awayTeam?.trim()) {
                return res.status(400).json({ error: "Home and away team names are required" });
            }

            const doc = {
                homeTeam: homeTeam.trim(),
                awayTeam: awayTeam.trim(),
                homeScore: parseInt(homeScore) || 0,
                awayScore: parseInt(awayScore) || 0,
                homeScorers: homeScorers || [],   // [{ name, minute }]
                awayScorers: awayScorers || [],
                competition: (competition || "").trim(),
                matchDate: matchDate || new Date().toISOString(),
                venue: (venue || "").trim(),
                stats: stats || [],               // [{ label: "Possession", home: "58%", away: "42%" }]
                homePlayers: homePlayers || [],    // [{ name, rating, position }]
                awayPlayers: awayPlayers || [],
                createdAt: new Date().toISOString()
            };

            const result = await collection.insertOne(doc);
            return res.status(201).json({ ...doc, id: String(result.insertedId) });
        }

        // ─── PUT: Update match card (admin) ───
        if (req.method === "PUT") {
            if (!requireAuth(req, res)) return;
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing id" });

            const filter = buildFilter(id);
            const { _id, id: _, ...updateFields } = req.body;
            updateFields.updatedAt = new Date().toISOString();

            const result = await collection.findOneAndUpdate(
                filter,
                { $set: updateFields },
                { returnDocument: "after" }
            );
            if (!result) return res.status(404).json({ error: "Match card not found" });

            const { _id: docId, ...rest } = result;
            return res.status(200).json({ ...rest, id: String(docId) });
        }

        // ─── DELETE (admin) ───
        if (req.method === "DELETE") {
            if (!requireAuth(req, res)) return;
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing id" });

            const filter = buildFilter(id);
            const result = await collection.deleteOne(filter);
            if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Match Cards API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
