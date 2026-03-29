import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db.js";
import { applyCors, checkRateLimit } from "../utils/security.js";
import { CURATED_HISTORY } from "../data/on-this-day-history.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category = "birthday" | "death" | "event" | "selected";

interface OnThisDayItem {
  year: number;
  text: string;
  category: Category;
  thumbnail: string | null;
  articleUrl: string | null;
}

/* ------------------------------------------------------------------ */
/*  Main Handler                                                       */
/* ------------------------------------------------------------------ */

export default async function onThisDayHandler(
  req: VercelRequest,
  res: VercelResponse,
) {
  applyCors(req, res);
  if (!checkRateLimit(req, res)) return;

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const now = new Date();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const todayKey = `${mm}-${dd}`;

    const { db } = await connectToDatabase();

    // 1. Fetch curated static events for today
    const curatedEvents = CURATED_HISTORY[todayKey] || [];

    // 2. Inject custom events managed by the Admin from site-settings
    const settingsDoc = await db.collection("site-settings").findOne({ _id: "MAIN_SETTINGS" as any });
    const allSupplementalEvents: any[] = settingsDoc?.supplementalEvents || [];
    
    const manualInjections = allSupplementalEvents
      .filter((evt) => evt.dateMMDD === todayKey)
      .map((evt) => ({
        year: evt.year,
        text: evt.text,
        category: evt.category as Category,
        thumbnail: evt.thumbnail || null,
        articleUrl: evt.articleUrl || null,
      }));

    // 3. Merge and sort by year descending
    const merged = [...curatedEvents, ...manualInjections]
      .sort((a, b) => b.year - a.year);

    return res.status(200).json({ events: merged, cachedAt: now });
  } catch (error: any) {
    console.error("OnThisDay API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
