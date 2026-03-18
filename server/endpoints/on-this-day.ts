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

interface CacheDocument {
  _id?: string;
  cacheKey: string; // e.g. "03-17"
  events: OnThisDayItem[];
  cachedAt: Date;
}

/* ------------------------------------------------------------------ */
/*  Football filter                                                    */
/* ------------------------------------------------------------------ */

const EXCLUDE_KEYWORDS = [
  "american football", "gridiron", "nfl", "quarterback", "super bowl",
  "wide receiver", "running back", "tight end", "linebacker", "cornerback",
  "canadian football", "arena football", "xfl",
];

const INCLUDE_KEYWORDS = [
  // People
  "footballer", "football player", "football manager", "football coach",
  "football referee", "football executive",
  "association football", "soccer",
  // Governing bodies & competitions
  "fifa", "uefa", "conmebol", "concacaf", "caf", "afc",
  "world cup", "premier league", "la liga", "serie a", "bundesliga",
  "ligue 1", "champions league", "europa league", "fa cup", "copa del rey",
  "eredivisie", "primeira liga", "copa libertadores", "copa america",
  "european championship", "euro 2", "euro 1", "euro 20", "euro 19",
  "african cup of nations", "asian cup", "gold cup",
  "league cup", "carabao cup", "efl cup", "community shield",
  "super cup", "club world cup", "intercontinental cup",
  "conference league", "cup winners' cup",
  // Clubs
  "real madrid", "barcelona", "juventus", "bayern munich", "liverpool",
  "manchester united", "manchester city", "arsenal", "chelsea", "inter milan",
  "ac milan", "paris saint-germain", "borussia dortmund", "tottenham",
  "atletico madrid", "napoli", "roma", "ajax", "benfica", "porto",
  "celtic", "rangers", "everton", "west ham", "aston villa", "newcastle",
  "nottingham forest", "leeds united", "sunderland",
  // Positions & match language
  "striker", "midfielder", "defender", "goalkeeper", "winger", "forward",
  "hat-trick", "hat trick", "penalty shootout", "own goal", "red card",
  "relegation", "promotion", "football match", "football final",
  "football league", "football club", "f.c.",
  // Historic events
  "hillsborough", "heysel", "munich air disaster",
  "hand of god", "wembley", "maracanã", "azteca", "camp nou", "bernabéu",
  "old trafford", "anfield", "san siro", "transfer",
  "ballon d'or", "golden boot", "golden ball",
];

function isFootballEntry(text: string, description: string): boolean {
  const combined = (text + " " + description).toLowerCase();

  // Exclusion before inclusion
  if (EXCLUDE_KEYWORDS.some((kw) => combined.includes(kw))) return false;
  if (INCLUDE_KEYWORDS.some((kw) => combined.includes(kw))) return true;

  return false;
}

/* ------------------------------------------------------------------ */
/*  Wikipedia fetcher (one per endpoint type)                          */
/* ------------------------------------------------------------------ */

const BASE = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday";
const UA = { "User-Agent": "PitchsideBlog/1.0 (football blog widget)" };

async function fetchEndpoint(
  type: "births" | "deaths" | "events" | "selected",
  mm: string,
  dd: string,
): Promise<OnThisDayItem[]> {
  const res = await fetch(`${BASE}/${type}/${mm}/${dd}`, { headers: UA });
  if (!res.ok) {
    console.error(`Wikipedia ${type} API returned ${res.status}`);
    return [];
  }

  const data = await res.json();
  const entries: any[] = data[type] || [];

  const categoryMap: Record<string, Category> = {
    births: "birthday",
    deaths: "death",
    events: "event",
    selected: "selected",
  };

  return entries
    .filter((e: any) => {
      const text = e.text || "";
      const pages: any[] = e.pages || [];
      const desc = pages.map((p: any) => p.description || "").join(" ");
      return isFootballEntry(text, desc);
    })
    .map((e: any) => {
      const pages: any[] = e.pages || [];
      return {
        year: e.year ?? 0,
        text: e.text || "",
        category: categoryMap[type],
        thumbnail: pages[0]?.thumbnail?.source || null,
        articleUrl: pages[0]?.content_urls?.desktop?.page || null,
      };
    });
}

/* ------------------------------------------------------------------ */
/*  Deduplication                                                      */
/* ------------------------------------------------------------------ */

function deduplicateEvents(items: OnThisDayItem[]): OnThisDayItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const fingerprint = `${item.year}::${item.text.slice(0, 60).toLowerCase()}`;
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Main Handler                                                       */
/* ------------------------------------------------------------------ */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    const cacheKey = `${mm}-${dd}`;

    const { db } = await connectToDatabase();
    const collection = db.collection<CacheDocument>("on_this_day_cache");

    // 1. Check cache
    const cached = await collection.findOne({ cacheKey });

    if (
      cached?.cachedAt &&
      now.getTime() - new Date(cached.cachedAt).getTime() < CACHE_TTL_MS
    ) {
      return res.status(200).json({
        events: cached.events,
        cachedAt: cached.cachedAt,
      });
    }

    // 2. Cache miss — fetch all 4 endpoints in parallel (resilient)
    const results = await Promise.allSettled([
      fetchEndpoint("births", mm, dd),
      fetchEndpoint("deaths", mm, dd),
      fetchEndpoint("events", mm, dd),
      fetchEndpoint("selected", mm, dd),
    ]);

    const merged: OnThisDayItem[] = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : [],
    );

    // 2b. Inject custom events missing from Wikipedia from the Admin Panel
    const settingsDoc = await db.collection("site-settings").findOne({ _id: "MAIN_SETTINGS" as any });
    const allSupplementalEvents: any[] = settingsDoc?.supplementalEvents || [];
    
    const manualInjections = allSupplementalEvents
      .filter((evt) => evt.dateMMDD === cacheKey)
      .map((evt) => ({
        year: evt.year,
        text: evt.text,
        category: evt.category as Category,
        thumbnail: evt.thumbnail || null,
        articleUrl: evt.articleUrl || null,
      }));

    merged.push(...manualInjections);

    // 3. Deduplicate & sort by year descending
    const final = deduplicateEvents(merged).sort((a, b) => b.year - a.year);

    // 4. Upsert cache
    const cachedAt = new Date();
    await collection.updateOne(
      { cacheKey },
      { $set: { cacheKey, events: final, cachedAt } },
      { upsert: true },
    );

    return res.status(200).json({ events: final, cachedAt });
  } catch (error: any) {
    console.error("OnThisDay API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
