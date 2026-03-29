import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MongoClient, ObjectId } from "mongodb";

import { connectToDatabase } from "../../api/_db.js";


export type PollOption = {
    id: string; // e.g., "opt1"
    text: string;
    votes: number;
};

export type PollDocument = {
    _id?: ObjectId;
    question: string;
    options: PollOption[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

// GET /api/polls - Get all polls (Admin) or just the active one (Public)
export const getPolls = async (req: VercelRequest, res: VercelResponse) => {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("polls");
        
        const activeOnly = req.query.active === 'true';
        const deviceId = req.cookies?.deviceId;
        
        if (activeOnly) {
            const activePoll = await collection.findOne({ isActive: true });
            if (!activePoll) {
                return res.status(200).json(null);
            }
            
            // Map the user's vote if signed via deviceId
            const userVotedOptionId = deviceId && activePoll.votedDevices ? activePoll.votedDevices[deviceId] : null;
            
            const { votedIps, votedDevices, ...safePoll } = activePoll as any;
            return res.status(200).json({ ...safePoll, userVotedOptionId });
        }

        // Require simple auth check for getting all polls (Admin only)
        const authHeader = req.headers.authorization;
        const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;
        if (authHeader !== expectedAuth) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const polls = await collection.find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json(polls);
    } catch (error) {
        console.error("Failed to fetch polls:", error);
        return res.status(500).json({ error: "Failed to fetch polls" });
    }
};

// ... skipping createPoll, updatePoll, deletePoll as they don't need rewriting right now ...
export const createPoll = async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { question, options, isActive } = req.body;
        
        if (!question || !Array.isArray(options) || options.length < 2) {
             return res.status(400).json({ error: "Invalid poll data. Need a question and at least 2 options." });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection("polls");

        // If setting this to active, deactivate all others first
        if (isActive) {
            await collection.updateMany({}, { $set: { isActive: false } });
        }

        const newPoll = {
            question,
            options: options.map((opt: any) => ({ ...opt, votes: 0 })), // ensure votes start at 0
            isActive: Boolean(isActive),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = await collection.insertOne(newPoll);
        return res.status(201).json({ _id: result.insertedId, ...newPoll });
    } catch (error) {
        console.error("Failed to create poll:", error);
        return res.status(500).json({ error: "Failed to create poll" });
    }
};

export const updatePoll = async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { id } = req.query as { id: string };
        const { question, options, isActive } = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection("polls");

        // If activating this poll, deactivate others
        if (isActive) {
             await collection.updateMany({ _id: { $ne: new ObjectId(id) } }, { $set: { isActive: false } });
        }

        const updates: any = {
            updatedAt: new Date().toISOString()
        };
        
        if (question !== undefined) updates.question = question;
        if (options !== undefined) updates.options = options;
        if (isActive !== undefined) updates.isActive = isActive;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updates },
            { returnDocument: "after" }
        );

        if (!result) {
            return res.status(404).json({ error: "Poll not found" });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Failed to update poll:", error);
        return res.status(500).json({ error: "Failed to update poll" });
    }
};

export const deletePoll = async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { id } = req.query as { id: string };
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection("polls");

        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
             return res.status(404).json({ error: "Poll not found" });
        }

        return res.status(204).send("");
    } catch (error) {
        console.error("Failed to delete poll:", error);
        return res.status(500).json({ error: "Failed to delete poll" });
    }
};

// POST /api/polls/:id/vote - Cast a vote (Public)
export const votePoll = async (req: VercelRequest, res: VercelResponse) => {
     try {
        const { id } = req.query as { id: string };
        const { optionId } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        
        if (!optionId || typeof optionId !== "string") {
             return res.status(400).json({ error: "Missing or invalid optionId" });
        }

        // Derive a voter fingerprint from cookies
        const deviceId = req.cookies?.deviceId || req.body?.deviceId;
        if (!deviceId) return res.status(400).json({ error: "Missing deviceId cookie for voting" });

        const { db } = await connectToDatabase();
        const collection = db.collection("polls");

        // Check if this device already voted on this poll
        const existingPoll = await collection.findOne({
            _id: new ObjectId(id),
            [`votedDevices.${deviceId}`]: { $exists: true }
        });

        if (existingPoll) {
            return res.status(409).json({ error: "You have already voted on this poll." });
        }

        // Atomically increment vote and add deviceId mapping
        const result = await collection.findOneAndUpdate(
            { 
               _id: new ObjectId(id),
               "options.id": optionId 
            },
            { 
               $inc: { "options.$.votes": 1 },
               $set: { [`votedDevices.${deviceId}`]: optionId },
            },
            { returnDocument: "after" }
        );

        if (!result) {
            return res.status(404).json({ error: "Poll or option not found" });
        }

        // Strip tracking props from response for privacy
        const { votedIps, votedDevices, ...safeResult } = result as any;
        return res.status(200).json({ ...safeResult, userVotedOptionId: optionId });
     } catch (error) {
        console.error("Failed to cast vote:", error);
        return res.status(500).json({ error: "Failed to cast vote" });
     }
};
