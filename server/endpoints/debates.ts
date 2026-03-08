import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security.js";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../_db.js";

const COLLECTION = "debates";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch all debates or single debate ───
        if (req.method === "GET") {
            const id = req.query.id as string;

            if (id) {
                const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
                const debate = await collection.findOne(filter);
                if (!debate) return res.status(404).json({ error: "Debate not found" });
                const { _id, ...rest } = debate;
                return res.status(200).json({ ...rest, id: String(_id) });
            }

            const debates = await collection.find({}).sort({ createdAt: -1 }).toArray();
            const result = debates.map((d) => {
                const { _id, ...rest } = d;
                const agreeCount = (rest.arguments || []).filter((a: any) => a.side === "agree").length;
                const disagreeCount = (rest.arguments || []).filter((a: any) => a.side === "disagree").length;
                return {
                    ...rest,
                    id: String(_id),
                    agreeVotes: rest.agreeVotes || 0,
                    disagreeVotes: rest.disagreeVotes || 0,
                    agreeArguments: agreeCount,
                    disagreeArguments: disagreeCount,
                    totalArguments: (rest.arguments || []).length,
                };
            });
            return res.status(200).json(result);
        }

        // ─── POST: Create a new debate or vote/argue ───
        if (req.method === "POST") {
            const { action } = req.body;

            // Vote on a debate
            if (action === "vote") {
                const { id, side } = req.body;
                if (!id || !["agree", "disagree"].includes(side)) {
                    return res.status(400).json({ error: "Valid debate id and side (agree/disagree) required" });
                }
                const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
                const field = side === "agree" ? "agreeVotes" : "disagreeVotes";
                await collection.updateOne(filter, { $inc: { [field]: 1 } });
                return res.status(200).json({ success: true });
            }

            // Add an argument
            if (action === "argue") {
                const { id, side, author, text } = req.body;
                if (!id || !["agree", "disagree"].includes(side) || !text?.trim()) {
                    return res.status(400).json({ error: "Valid id, side, and argument text required" });
                }
                const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
                const argument = {
                    id: Date.now().toString(),
                    side,
                    author: (author || "Anonymous").trim().slice(0, 30),
                    text: text.trim().slice(0, 500),
                    createdAt: new Date().toISOString(),
                    likes: 0,
                };
                await collection.updateOne(filter, { $push: { arguments: argument } as any });
                return res.status(201).json({ success: true, argument });
            }

            // Like an argument
            if (action === "like") {
                const { id, argumentId } = req.body;
                if (!id || !argumentId) return res.status(400).json({ error: "Debate id and argument id required" });
                const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };
                await collection.updateOne(
                    { ...filter, "arguments.id": argumentId },
                    { $inc: { "arguments.$.likes": 1 } }
                );
                return res.status(200).json({ success: true });
            }

            // Create a new debate (admin)
            if (!requireAuth(req, res)) return;
            const { title, description, category } = req.body;
            if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

            const doc = {
                title: title.trim(),
                description: (description || "").trim(),
                category: (category || "General").trim(),
                agreeVotes: 0,
                disagreeVotes: 0,
                arguments: [],
                createdAt: new Date().toISOString(),
                active: true,
            };
            const result = await collection.insertOne(doc);
            return res.status(201).json({ ...doc, id: String(result.insertedId) });
        }

        // ─── DELETE: Delete a debate or argument (admin) ───
        if (req.method === "DELETE") {
            if (!requireAuth(req, res)) return;
            const id = req.query.id as string;
            const argumentId = req.query.argumentId as string;

            if (!id) return res.status(400).json({ error: "Missing debate id" });
            const filter: any = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id as any };

            if (argumentId) {
                // Delete a specific argument
                const result = await collection.updateOne(filter, { $pull: { arguments: { id: argumentId } } as any });
                if (result.matchedCount === 0) return res.status(404).json({ error: "Debate not found" });
                return res.status(200).json({ success: true });
            }

            // Delete the entire debate
            const result = await collection.deleteOne(filter);
            if (result.deletedCount === 0) return res.status(404).json({ error: "Debate not found" });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("Debates API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
