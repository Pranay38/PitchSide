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

function logServerDataError(scope: string, error: unknown) {
  console.error(`[server-data] ${scope} failed:`, error);
}

function getDefaultSiteSettings() {
  return {
    homepageCuration: {
      hero: { type: "post" as const, id: "" },
      latestPostIds: [],
      featuredStoryIds: [],
      transferSpotlightIds: [],
    },

  };
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

  global._mongoClientPromise = MongoClient.connect(MONGODB_URI, options)
    .then((client) => ({ client, db: client.db(MONGODB_DB) }))
    .catch((error) => {
      global._mongoClientPromise = undefined;
      throw error;
    });

  return global._mongoClientPromise;
}

function sanitizePost(post: Record<string, any>) {
  const { _id, ...rest } = post;
  const normalized: Record<string, any> = { ...rest, id: rest.id || String(_id) };
  for (const [key, value] of Object.entries(normalized)) {
    if (value === null) delete normalized[key];
  }
  
  // Dynamically calculate read time to ensure accuracy (238 wpm) for legacy posts
  if (normalized.content) {
    const plainText = normalized.content.replace(/<[^>]*>/g, " ").trim();
    const words = plainText.split(/\s+/).filter(Boolean).length;
    const time = Math.max(1, Math.ceil(words / 238));
    normalized.readTime = `${time} min read`;
  }
  
  return normalized;
}

/**
 * Get all published posts (server-side). Excludes drafts and future-scheduled posts.
 */
export async function getPublishedPostsServer() {
  try {
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
  } catch (error) {
    logServerDataError("getPublishedPostsServer", error);
    return [];
  }
}

/**
 * Get a single post by ID (server-side).
 */
export async function getPostByIdServer(id: string) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("posts");

    const post = await collection.findOne({
      $or: [{ id }, { _id: id as any }, { slug: id }],
    });

    if (!post) return null;
    return sanitizePost(post);
  } catch (error) {
    logServerDataError(`getPostByIdServer(${id})`, error);
    return null;
  }
}

/**
 * Get all published stories (server-side).
 */
export async function getStoriesServer() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("stories");
    const stories = await collection.find({}).sort({ _id: -1 }).toArray();
    return stories.map(sanitizePost);
  } catch (error) {
    logServerDataError("getStoriesServer", error);
    return [];
  }
}

/**
 * Get a single story by slug (server-side).
 */
export async function getStoryBySlugServer(slug: string) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("stories");
    const story = await collection.findOne({ slug });
    if (!story) return null;
    return sanitizePost(story);
  } catch (error) {
    logServerDataError(`getStoryBySlugServer(${slug})`, error);
    return null;
  }
}

/**
 * Get site settings (server-side).
 */
export async function getSiteSettingsServer() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("settings");
    const settings = await collection.findOne({ _id: "site" as any });

    if (!settings) {
      return getDefaultSiteSettings();
    }

    return sanitizePost(settings);
  } catch (error) {
    logServerDataError("getSiteSettingsServer", error);
    return getDefaultSiteSettings();
  }
}
