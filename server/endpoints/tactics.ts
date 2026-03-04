import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../_db.js";

const COLLECTION = "tactics";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch all saved tactics ───
        if (req.method === "GET") {
            const tactics = await collection.find({}).sort({ createdAt: -1 }).toArray();
            return res.status(200).json(
                tactics.map((t) => {
                    const { _id, ...rest } = t;
                    return { id: _id.toString(), ...rest };
                })
            );
        }

        // ─── POST: Save a new tactical sequence ───
        if (req.method === "POST") {
            const { title, formation, keyframes } = req.body;
            if (!title) return res.status(400).json({ error: "Missing title" });
            if (!keyframes || !Array.isArray(keyframes) || keyframes.length === 0) {
                return res.status(400).json({ error: "Missing or invalid keyframes" });
            }

            const doc = {
                title,
                formation: formation || "Unknown",
                keyframes,
                createdAt: new Date().toISOString(),
            };
            const result = await collection.insertOne(doc);
            return res.status(201).json({ ...doc, id: String(result.insertedId) });
        }

        // ─── DELETE: Delete a saved sequence ───
        if (req.method === "DELETE") {
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing tactics id" });
            const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
            const result = await collection.deleteOne(filter);
            if (result.deletedCount === 0) return res.status(404).json({ error: "Tactics not found" });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Tactics API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
