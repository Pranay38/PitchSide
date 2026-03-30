/**
 * Server-side data fetching utilities for Next.js.
 * These functions connect directly to MongoDB and are used in Server Components.
 * They should NEVER be imported from client components.
 */
import { MongoClient, Db, MongoClientOptions } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB = process.env.MONGODB_DB || "pitchside";

declare global {
  var _mongoClientPromise: Promise<{ client: MongoClient; db: Db }> | undefined;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  const options: MongoClientOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  global._mongoClientPromise = MongoClient.connect(MONGODB_URI, options).then(
    (client) => ({ client, db: client.db(MONGODB_DB) })
  );

  return global._mongoClientPromise;
}

function sanitizePost(post: Record<string, any>) {
  const { _id, ...rest } = post;
  const normalized: Record<string, any> = { ...rest, id: rest.id || String(_id) };
  for (const [key, value] of Object.entries(normalized)) {
    if (value === null) delete normalized[key];
  }
  return normalized;
}

/**
 * Get all published posts (server-side). Excludes drafts and future-scheduled posts.
 */
export async function getPublishedPostsServer() {
  const { db } = await connectToDatabase();
  const collection = db.collection("posts");
  const now = new Date();

  const posts = await collection.find({}).sort({ _id: -1 }).toArray();

  return posts
    .map(sanitizePost)
    .filter((p: any) => {
      if (p.isDraft) return false;
      if (!p.publishAt) return true;
      return new Date(p.publishAt) <= now;
    });
}

/**
 * Get a single post by ID (server-side).
 */
export async function getPostByIdServer(id: string) {
  const { db } = await connectToDatabase();
  const collection = db.collection("posts");

  const post = await collection.findOne({
    $or: [{ id }, { _id: id as any }],
  });

  if (!post) return null;
  return sanitizePost(post);
}

/**
 * Get all published stories (server-side).
 */
export async function getStoriesServer() {
  const { db } = await connectToDatabase();
  const collection = db.collection("stories");
  const stories = await collection.find({}).sort({ _id: -1 }).toArray();
  return stories.map(sanitizePost);
}

/**
 * Get a single story by slug (server-side).
 */
export async function getStoryBySlugServer(slug: string) {
  const { db } = await connectToDatabase();
  const collection = db.collection("stories");
  const story = await collection.findOne({ slug });
  if (!story) return null;
  return sanitizePost(story);
}

/**
 * Get site settings (server-side).
 */
export async function getSiteSettingsServer() {
  const { db } = await connectToDatabase();
  const collection = db.collection("settings");
  const settings = await collection.findOne({ _id: "site" as any });

  // Return defaults if no settings found
  if (!settings) {
    return {
      homepageCuration: {
        hero: { type: "post" as const, id: "" },
        latestPostIds: [],
        featuredStoryIds: [],
        transferSpotlightIds: [],
      },
      transferWatch: [],
    };
  }

  return sanitizePost(settings);
}
