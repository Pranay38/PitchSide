import type { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";

// Note: To match the structure of other endpoints, we'll accept the db middleware 
// but since the platform often re-connects on the fly in `api/sys.ts`, we'll ensure
// we have a robust connection fallback.

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "pitchsidetest";

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    return client;
}

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
export const getPolls = async (req: Request, res: Response) => {
    try {
        const client = await connectToDatabase();
        const collection = client.db(dbName).collection<PollDocument>("polls");
        
        const activeOnly = req.query.active === 'true';
        
        if (activeOnly) {
            const activePoll = await collection.findOne({ isActive: true });
            if (!activePoll) {
                return res.status(200).json(null);
            }
            return res.status(200).json(activePoll);
        }

        // Require simple auth check for getting all polls (Admin only)
        const authHeader = req.headers.authorization;
        const expectedAuth = \`Bearer \${process.env.ADMIN_PASSWORD}\`;
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

// POST /api/polls - Create a new poll (Admin)
export const createPoll = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = \`Bearer \${process.env.ADMIN_PASSWORD}\`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { question, options, isActive } = req.body;
        
        if (!question || !Array.isArray(options) || options.length < 2) {
             return res.status(400).json({ error: "Invalid poll data. Need a question and at least 2 options." });
        }

        const client = await connectToDatabase();
        const collection = client.db(dbName).collection<PollDocument>("polls");

        // If setting this to active, deactivate all others first
        if (isActive) {
            await collection.updateMany({}, { $set: { isActive: false } });
        }

        const newPoll: PollDocument = {
            question,
            options: options.map(opt => ({ ...opt, votes: 0 })), // ensure votes start at 0
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

// PUT /api/polls/:id - Update a poll (Admin)
export const updatePoll = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = \`Bearer \${process.env.ADMIN_PASSWORD}\`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { id } = req.params;
        const { question, options, isActive } = req.body;
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const client = await connectToDatabase();
        const collection = client.db(dbName).collection<PollDocument>("polls");

        // If activating this poll, deactivate others
        if (isActive) {
             await collection.updateMany({ _id: { $ne: new ObjectId(id) } }, { $set: { isActive: false } });
        }

        const updates: Partial<PollDocument> = {
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

// DELETE /api/polls/:id - Delete a poll (Admin)
export const deletePoll = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const expectedAuth = \`Bearer \${process.env.ADMIN_PASSWORD}\`;

    if (authHeader !== expectedAuth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const client = await connectToDatabase();
        const collection = client.db(dbName).collection("polls");

        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
             return res.status(404).json({ error: "Poll not found" });
        }

        return res.status(204).send();
    } catch (error) {
        console.error("Failed to delete poll:", error);
        return res.status(500).json({ error: "Failed to delete poll" });
    }
};

// POST /api/polls/:id/vote - Cast a vote (Public)
export const votePoll = async (req: Request, res: Response) => {
     try {
        const { id } = req.params;
        const { optionId } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }
        
        if (!optionId) {
             return res.status(400).json({ error: "Missing optionId" });
        }

        const client = await connectToDatabase();
        const collection = client.db(dbName).collection<PollDocument>("polls");

        // Use findOneAndUpdate to atomically increment the vote count for the specific nested array element
        const result = await collection.findOneAndUpdate(
            { 
               _id: new ObjectId(id),
               "options.id": optionId 
            },
            { 
               $inc: { "options.$.votes": 1 } 
            },
            { returnDocument: "after" }
        );

        if (!result) {
            // Could mean poll ID is bad, or option ID is bad.
            return res.status(404).json({ error: "Poll or option not found" });
        }

        return res.status(200).json(result);
     } catch (error) {
        console.error("Failed to cast vote:", error);
        return res.status(500).json({ error: "Failed to cast vote" });
     }
};
