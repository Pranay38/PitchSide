import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { applyCors, checkOrigin, checkRateLimit, sanitizeString } from "../utils/security";
import { GROWTH_EVENTS, analyticsSlug, sanitizeCampaign } from "../../src/app/lib/growth";

const ALLOWED_EVENTS = new Set<string>(GROWTH_EVENTS);
const ALLOWED_STATES = new Set(["subscriber", "signed_in", "guest"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (!checkRateLimit(req, res)) return;
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!checkOrigin(req, res)) return;

  const event = sanitizeString(req.body?.event)?.slice(0, 40) || "";
  const postId = analyticsSlug(req.body?.postId);
  const placement = analyticsSlug(req.body?.placement) || (postId ? "article_end" : undefined);
  const readerState = sanitizeString(req.body?.readerState)?.slice(0, 24) || "";

  if (!ALLOWED_EVENTS.has(event) || !placement || !ALLOWED_STATES.has(readerState)) {
    return res.status(400).json({ error: "Invalid growth event" });
  }

  try {
    const { db } = await connectToDatabase();
    await db.collection("growth_events").insertOne({
      event,
      ...(postId ? { postId } : {}),
      placement,
      campaign: sanitizeCampaign(req.body?.campaign),
      readerState,
      createdAt: new Date(),
    });
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Growth event error:", error);
    return res.status(500).json({ error: "Could not record event" });
  }
}
