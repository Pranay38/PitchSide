import { MongoClient, Db } from "mongodb";

// Connection string comes from environment variable
const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = "pitchside";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB Atlas.
 * Uses connection caching so serverless functions reuse the same connection.
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    if (!MONGODB_URI) {
        throw new Error(
            "MONGODB_URI environment variable is not set. " +
            "Go to Vercel → Settings → Environment Variables and add your MongoDB connection string."
        );
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}
