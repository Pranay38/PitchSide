import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { applyCors, checkRateLimit, requireAuth } from "../server/utils/security";
import { connectToDatabase } from "./_db";
import { storyFeatures as defaultStories } from "../src/app/data/stories";

const COLLECTION = "stories";

type StoryRecord = Record<string, unknown> & {
  id?: string;
  slug?: string;
  isDraft?: boolean;
};

type MongoStoryRecord = StoryRecord & {
  _id?: ObjectId | string;
};

function buildIdFilter(id: string) {
  const filters: Array<Record<string, unknown>> = [{ id }, { _id: id }];
  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }
  return { $or: filters };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (!checkRateLimit(req, res)) return;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    if (req.method === "GET") {
      const slug = String(req.query.slug || "").trim();
      const includeDrafts = String(req.query.includeDrafts || "").trim() === "1";
      if (includeDrafts && !requireAuth(req, res)) return;
      let stories = await collection.find({}).sort({ _id: -1 }).toArray() as MongoStoryRecord[];

      if (stories.length === 0 && defaultStories.length > 0) {
        await collection.insertMany(
          defaultStories.map((story) => ({ ...story, _id: story.id as any })),
        );
        stories = await collection.find({}).sort({ _id: -1 }).toArray() as MongoStoryRecord[];
      }

      const result: StoryRecord[] = stories.map((story) => {
        const { _id, ...rest } = story;
        return { ...(rest as StoryRecord), id: String((rest as StoryRecord).id || _id) };
      });
      const visibleStories = includeDrafts ? result : result.filter((item) => !item.isDraft);

      if (slug) {
        const story = visibleStories.find((item) => item.slug === slug);
        if (!story) return res.status(404).json({ error: "Story not found" });
        return res.status(200).json(story);
      }

      return res.status(200).json(visibleStories);
    }

    if (req.method === "POST") {
      if (!requireAuth(req, res)) return;
      const story = req.body;
      if (!story?.id || !story?.slug || !story?.title) {
        return res.status(400).json({ error: "Story id, slug, and title are required" });
      }

      const existingSlug = await collection.findOne({ slug: story.slug });
      if (existingSlug) {
        return res.status(409).json({ error: "A story with this slug already exists" });
      }

      const doc = { ...story, _id: story.id as any };
      await collection.insertOne(doc);
      const { _id, ...result } = doc;
      return res.status(201).json(result);
    }

    if (req.method === "PUT") {
      if (!requireAuth(req, res)) return;
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: "Missing story id" });

      if (updates.slug) {
        const existingSlug = await collection.findOne({ slug: updates.slug, id: { $ne: id } });
        if (existingSlug) {
          return res.status(409).json({ error: "A story with this slug already exists" });
        }
      }

      const result = await collection.updateOne(buildIdFilter(id), { $set: updates });
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Story not found" });
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      if (!requireAuth(req, res)) return;
      const id = String(req.query.id || "").trim();
      if (!id) return res.status(400).json({ error: "Missing story id" });

      const result = await collection.deleteOne(buildIdFilter(id));
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Story not found" });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Stories API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
