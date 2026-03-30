import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MongoClient, ObjectId } from "mongodb";

import { connectToDatabase } from "../../api/_db";


export type MatchRatingPlayer = {
    id: string; // e.g., "p1"
    name: string;
    imageUrl: string;
    totalScore: number;
    voteCount: number;
};

export type MatchRatingDocument = {
    _id?: ObjectId;
    title: string;
    isActive: boolean;
    players: MatchRatingPlayer[];
    createdAt: string;
    updatedAt: string;
};

// GET /api/match-ratings - Get all sessions (Admin) or just the active one (Public)
export const getMatchRatings = async (req: VercelRequest, res: VercelResponse) => {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection<MatchRatingDocument>("matchRatings");
        
        const activeOnly = req.query.active === 'true';
        
        if (activeOnly) {
            const activeSession = await collection.findOne({ isActive: true });
            if (!activeSession) {
                return res.status(200).json(null);
            }
            return res.status(200).json(activeSession);
        }

        // Require simple auth check for getting all sessions (Admin only)
        const authHeader = req.headers.authorization;
        const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;
        if (authHeader !== expectedAuth) {
             return res.status(401).json({ error: "Unauthorized" });
        }

        const sessions = await collection.find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json(sessions);
    } catch (error) {
        console.error("Failed to fetch match ratings:", error);
        return res.status(500).json({ error: "Failed to fetch match ratings" });
    }
};

// POST /api/match-ratings - Create a new session (Admin)
export const createMatchRating = async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { title, players, isActive } = req.body;
        
        if (!title || !Array.isArray(players) || players.length === 0) {
             return res.status(400).json({ error: "Invalid data. Need a title and at least 1 player." });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<MatchRatingDocument>("matchRatings");

        if (isActive) {
            await collection.updateMany({}, { $set: { isActive: false } });
        }

        const newSession: MatchRatingDocument = {
            title,
            players: players.map(p => ({ 
                id: p.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: p.name,
                imageUrl: p.imageUrl || "",
                totalScore: 0,
                voteCount: 0 
            })),
            isActive: Boolean(isActive),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = await collection.insertOne(newSession);
        return res.status(201).json({ _id: result.insertedId, ...newSession });
    } catch (error) {
        console.error("Failed to create match rating:", error);
        return res.status(500).json({ error: "Failed to create match rating" });
    }
};

// PUT /api/match-ratings/:id - Update a session (Admin)
export const updateMatchRating = async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { id } = req.query as { id: string };
        const { title, players, isActive } = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<MatchRatingDocument>("matchRatings");

        if (isActive) {
             await collection.updateMany({ _id: { $ne: new ObjectId(id) } }, { $set: { isActive: false } });
        }

        const updates: Partial<MatchRatingDocument> = {
            updatedAt: new Date().toISOString()
        };
        
        if (title !== undefined) updates.title = title;
        if (players !== undefined) {
             // For simplicity, we just overwrite the players array but keep existing scores if matching by ID.
             // But usually admin sends the full updated array with correct scores anyway.
             updates.players = players;
        }
        if (isActive !== undefined) updates.isActive = isActive;

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updates },
            { returnDocument: "after" }
        );

        if (!result) {
            return res.status(404).json({ error: "Session not found" });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Failed to update match rating:", error);
        return res.status(500).json({ error: "Failed to update match rating" });
    }
};

// DELETE /api/match-ratings/:id - Delete a session (Admin)
export const deleteMatchRating = async (req: VercelRequest, res: VercelResponse) => {
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
        const collection = db.collection("matchRatings");

        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
             return res.status(404).json({ error: "Session not found" });
        }

        return res.status(204).send("");
    } catch (error) {
        console.error("Failed to delete match rating:", error);
        return res.status(500).json({ error: "Failed to delete match rating" });
    }
};

// POST /api/match-ratings/:id/vote - Cast votes (Public)
export const voteMatchRating = async (req: VercelRequest, res: VercelResponse) => {
     try {
        const { id } = req.query as { id: string };
        const { ratings } = req.body; // Expected format: [ { playerId: "p1", rating: 8 }, ... ]

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        
        if (!Array.isArray(ratings) || ratings.length === 0) {
             return res.status(400).json({ error: "Missing or invalid ratings array" });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<MatchRatingDocument>("matchRatings");

        const session = await collection.findOne({ _id: new ObjectId(id) });
        if (!session) {
             return res.status(404).json({ error: "Session not found" });
        }

        // Prepare bulk operations to update multiple array elements
        const bulkOps = ratings.map(r => ({
             updateOne: {
                  filter: { _id: new ObjectId(id), "players.id": r.playerId },
                  update: { 
                       $inc: { 
                            "players.$.totalScore": Number(r.rating) || 0,
                            "players.$.voteCount": 1
                       } 
                  }
             }
        }));

        if (bulkOps.length > 0) {
             await collection.bulkWrite(bulkOps);
        }

        // Fetch the updated document to send back
        const updatedSession = await collection.findOne({ _id: new ObjectId(id) });
        return res.status(200).json(updatedSession);
     } catch (error) {
        console.error("Failed to cast match rating votes:", error);
        return res.status(500).json({ error: "Failed to cast match rating votes" });
     }
};
