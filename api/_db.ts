import { MongoClient, Db, MongoClientOptions } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "pitchside";

declare global {
    var _mongoClientPromise: Promise<{ client: MongoClient; db: Db }> | undefined;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
    if (!MONGODB_URI) {
        throw new Error(
            "Please define the MONGODB_URI environment variable inside .env.local"
        );
    }

    if (global._mongoClientPromise) {
        return global._mongoClientPromise;
    }

    const options: MongoClientOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };

    global._mongoClientPromise = MongoClient.connect(MONGODB_URI, options).then((client) => {
        return { client, db: client.db(MONGODB_DB) };
    });

    return global._mongoClientPromise;
}
