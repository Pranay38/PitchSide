import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { applyCors, checkRateLimit, requireAuth } from "../server/utils/security";
import { connectToDatabase } from "./_db";
import { createStoryEmailJob, deliverStoryEmails, storyEmailStatus } from "../server/lib/storyNotifications";
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

    if (req.query.action === "email-status" || req.query.action === "retry-emails") {
      if (!(await requireAuth(req, res))) return;
      if ((req.query.action === "email-status" && req.method !== "GET") || (req.query.action === "retry-emails" && req.method !== "POST")) return res.status(405).json({ error: "Method not allowed" });
      const id = String(req.query.id || "");
      if (!id) return res.status(400).json({ error: "Story id is required" });
      if (req.method === "POST") await deliverStoryEmails(db, id);
      const status = await storyEmailStatus(db, id);
      res.setHeader("Cache-Control", "no-store");
      return status ? res.status(200).json(status) : res.status(404).json({ error: "Story not found" });
    }

    if (req.method === "GET") {
      const slug = String(req.query.slug || "").trim();
      const includeDrafts = String(req.query.includeDrafts || "").trim() === "1";
      if (includeDrafts && !(await requireAuth(req, res))) return;
      let stories = await collection.find({}).sort({ _id: -1 }).toArray() as MongoStoryRecord[];

      if (stories.length === 0 && defaultStories.length > 0) {
        await collection.insertMany(
          defaultStories.map((story) => ({ ...story, everPublished: !story.isDraft, _id: story.id as any })),
        );
        stories = await collection.find({}).sort({ _id: -1 }).toArray() as MongoStoryRecord[];
      }

      const result: StoryRecord[] = stories.map((story) => {
        const { _id, publicationEmail, everPublished, ...rest } = story;
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
      if (!(await requireAuth(req, res))) return;
      const { publicationEmail, everPublished, publishedAt, _id: ignoredId, ...story } = req.body || {};
      if (publicationEmail !== undefined || everPublished !== undefined || Object.keys(story).some(key => key.startsWith("$") || key.includes("."))) return res.status(400).json({ error: "Publication email state is server-managed" });
      if (![story.id, story.slug, story.title].every(value => typeof value === "string" && value.trim()) || typeof story.isDraft !== "boolean") {
        return res.status(400).json({ error: "Story id, slug, title, and draft status are required" });
      }

      const existingSlug = await collection.findOne({ slug: story.slug });
      if (existingSlug) {
        return res.status(409).json({ error: "A story with this slug already exists" });
      }

      const doc = {
        ...story,
        publishedAt: !story.isDraft ? new Date().toISOString() : undefined,
        everPublished: !story.isDraft,
        ...(!story.isDraft ? { publicationEmail: createStoryEmailJob(story as { title: string; slug: string; excerpt?: string }) } : {}),
        _id: story.id as any,
      };
      await collection.insertOne(doc);
      if (!story.isDraft) await deliverStoryEmails(db, story.id).catch(error => console.error("Story email error:", error));
      const { _id, publicationEmail: emailState, everPublished: wasPublished, ...result } = doc;
      return res.status(201).json(result);
    }

    if (req.method === "PUT") {
      if (!(await requireAuth(req, res))) return;
      const { id, publicationEmail, everPublished, publishedAt, _id: ignoredId, ...updates } = req.body || {};
      if (publicationEmail !== undefined || everPublished !== undefined || Object.keys(updates).some(key => key.startsWith("$") || key.includes("."))) return res.status(400).json({ error: "Publication email state is server-managed" });
      if (typeof id !== "string" || !id.trim()) return res.status(400).json({ error: "Missing story id" });
      if ((updates.isDraft !== undefined && typeof updates.isDraft !== "boolean") || ["title", "slug"].some(key => updates[key] !== undefined && (typeof updates[key] !== "string" || !updates[key].trim()))) return res.status(400).json({ error: "Invalid story fields" });

      const current = await collection.findOne(buildIdFilter(id));
      if (!current) return res.status(404).json({ error: "Story not found" });

      if (updates.slug) {
        const existingSlug = await collection.findOne({ slug: updates.slug, id: { $ne: id } });
        if (existingSlug) {
          return res.status(409).json({ error: "A story with this slug already exists" });
        }
      }

      let firstPublication = false;
      if (updates.isDraft === false && current.isDraft === true && !current.publishedAt && !current.everPublished && !current.publicationEmail) {
        const merged = { ...current, ...updates };
        const publication = await collection.updateOne({ $and: [buildIdFilter(id), { isDraft: true, publishedAt: null, everPublished: { $ne: true }, publicationEmail: { $exists: false } }] }, { $set: {
          ...updates, everPublished: true, publishedAt: new Date().toISOString(),
          publicationEmail: createStoryEmailJob(merged as { title: string; slug: string; excerpt?: string }),
        } });
        firstPublication = publication.modifiedCount === 1;
      }
      if (!firstPublication) {
        // Remember legacy published records before unpublishing, without broadcasting them.
        await collection.updateOne(buildIdFilter(id), { $set: { ...updates, ...(!current.isDraft || current.publishedAt ? { everPublished: true } : {}) } });
      } else {
        await deliverStoryEmails(db, id).catch(error => console.error("Story email error:", error));
      }
      const saved = await collection.findOne(buildIdFilter(id));
      return res.status(200).json({ success: true, publishedAt: saved?.publishedAt });
    }

    if (req.method === "DELETE") {
      if (!(await requireAuth(req, res))) return;
      const id = String(req.query.id || "").trim();
      if (typeof id !== "string" || !id.trim()) return res.status(400).json({ error: "Missing story id" });

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
