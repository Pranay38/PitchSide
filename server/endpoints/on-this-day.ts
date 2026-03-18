import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db.js";
import { applyCors, checkRateLimit } from "../utils/security.js";

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
/*  Curated Dataset (Fallback & Highlights)                            */
/* ------------------------------------------------------------------ */

// A curated map of MM-DD to iconic football events.
const CURATED_HISTORY: Record<string, OnThisDayItem[]> = {
  "03-18": [
    { year: 2012, text: "Fabrice Muamba collapsed on the pitch during an FA Cup tie between Bolton Wanderers and Tottenham Hotspur, surviving after his heart stopped for 78 minutes.", category: "event", thumbnail: null, articleUrl: null },
    { year: 1900, text: "AFC Ajax, one of the most successful clubs in Dutch football history, was founded in Amsterdam.", category: "event", thumbnail: null, articleUrl: "https://en.wikipedia.org/wiki/AFC_Ajax" },
  ],
  "03-19": [
    { year: 1976, text: "Alessandro Nesta, regarded as one of the greatest defenders of all time, was born in Rome, Italy.", category: "birthday", thumbnail: null, articleUrl: null },
  ],
  "03-20": [
    { year: 1984, text: "Fernando Torres, legendary Spanish striker who scored the winning goal in Euro 2008, was born.", category: "birthday", thumbnail: null, articleUrl: null },
  ],
  "03-21": [
    { year: 1980, text: "Ronaldinho, the Brazilian maestro who redefined skill and joy in football, was born in Porto Alegre.", category: "birthday", thumbnail: null, articleUrl: null },
  ],
  "05-26": [
    { year: 1999, text: "Manchester United completed their historic Treble by defeating Bayern Munich 2-1 in the Champions League final with two dramatic injury-time goals.", category: "event", thumbnail: null, articleUrl: null },
  ],
  "07-09": [
    { year: 2006, text: "Italy won their 4th World Cup, defeating France on penalties after a 1-1 draw remembered for Zinedine Zidane's infamous headbutt.", category: "event", thumbnail: null, articleUrl: null },
  ],
  "12-18": [
    { year: 2022, text: "Lionel Messi lifted the World Cup as Argentina defeated France in a legendary final in Qatar, winning 4-2 on penalties after a 3-3 draw.", category: "event", thumbnail: null, articleUrl: null },
  ]
};

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
