import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";

// ── RSS feed sources for real football gossip & transfer news ─────────────

const RSS_FEEDS = [
  "https://feeds.bbci.co.uk/sport/football/rss.xml",
  "https://www.theguardian.com/football/rss",
  "https://www.espn.com/espn/rss/soccer/news",
];

// Transfer/gossip keywords to prioritize juicy rumour headlines
const GOSSIP_KEYWORDS = [
  "transfer", "sign", "deal", "bid", "offer", "move", "swap", "loan",
  "target", "want", "chase", "link", "eye", "interested", "pursue",
  "fee", "contract", "agree", "join", "exit", "leave", "depart",
  "rumour", "rumor", "gossip", "report", "exclusive", "reveal",
  "sack", "fire", "replace", "appoint", "manager", "coach",
  "million", "£", "€", "$",
];

// ── Simple RSS XML parser (no dependencies) ───────────────────────────────

function extractItems(xml: string): string[] {
  const titles: string[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && titles.length < 20) {
    const block = match[1];
    const titleMatch = block.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
    if (titleMatch?.[1]) {
      const title = titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim();
      if (title.length > 10) titles.push(title);
    }
  }

  return titles;
}

function scoreHeadline(headline: string): number {
  const lower = headline.toLowerCase();
  let score = 0;
  for (const kw of GOSSIP_KEYWORDS) {
    if (lower.includes(kw)) score += 1;
  }
  return score;
}

async function fetchBestRumour(): Promise<{ text: string; sentimentScore: number } | null> {
  const allHeadlines: string[] = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0 PitchSide-Bot/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      allHeadlines.push(...extractItems(xml));
    } catch (e) {
      console.warn(`Failed to fetch RSS from ${feedUrl}:`, e);
    }
  }

  if (allHeadlines.length === 0) return null;

  // Sort by gossip relevance, pick the best one
  const scored = allHeadlines.map((h) => ({ text: h, score: scoreHeadline(h) }));
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  // Sentiment: gossip-heavy headlines get a moderate score, generic news gets lower
  const sentimentScore = Math.min(90, Math.max(30, 40 + best.score * 8));

  return { text: best.text, sentimentScore };
}

// ── Manager pressure — hard-coded realistic defaults ──────────────────────

function getDefaultManagerPressure() {
  // These can be updated periodically; Gemini is NOT used here
  return [
    { name: "Igor Tudor (TOT)", pressureScore: 95 },
    { name: "Marco Silva (FUL)", pressureScore: 88 },
    { name: "Unai Emery (AVL)", pressureScore: 78 },
    { name: "Julen Lopetegui (WHU)", pressureScore: 72 },
  ];
}

// ── Collection ────────────────────────────────────────────────────────────

const COLLECTION = "daily_features";

// ── Handler ───────────────────────────────────────────────────────────────

export default async function dailyFeaturesHandler(req: VercelRequest, res: VercelResponse) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    // Vercel cron sends GET with "x-vercel-cron" header
    // POST also triggers a manual refresh (from admin)
    const isCronTrigger = req.method === "GET" && !!req.headers["x-vercel-cron"];
    const isManualRefresh = req.method === "POST";

    if (isCronTrigger || isManualRefresh) {
      // ── Refresh: Scrape fresh headlines and store ──────────────────
      const rumour = await fetchBestRumour();

      const today = new Date().toISOString().split("T")[0];
      const doc = {
        lastUpdated: new Date().toISOString(),
        rumorMill: rumour || {
          text: "Transfer window heating up — clubs preparing bids across Europe",
          sentimentScore: 50,
        },
        managerPressure: getDefaultManagerPressure(),
        onThisDay: {
          year: new Date().getFullYear().toString(),
          event: "The beautiful game continues on pitches worldwide.",
        },
      };

      await collection.updateOne(
        { _id: `daily-${today}` as any },
        { $set: doc },
        { upsert: true }
      );

      if (isCronTrigger) {
          await db.collection("cron_logs").updateOne(
              { jobName: "daily-features" },
              { $set: { lastRunAt: new Date().toISOString(), status: "success" } },
              { upsert: true }
          );
      }

      return res.status(200).json({ success: true, data: doc });
    }

    // ── GET: Return current daily features ──────────────────────────
    if (req.method === "GET") {
      // Check if today's data exists; if not, scrape on first request
      const today = new Date().toISOString().split("T")[0];
      let latest = await collection.findOne({ _id: `daily-${today}` as any });

      if (!latest) {
        // No data for today — scrape now (first visitor triggers the refresh)
        const rumour = await fetchBestRumour();
        const doc = {
          lastUpdated: new Date().toISOString(),
          rumorMill: rumour || {
            text: "Transfer window heating up — clubs preparing bids across Europe",
            sentimentScore: 50,
          },
          managerPressure: getDefaultManagerPressure(),
          onThisDay: {
            year: new Date().getFullYear().toString(),
            event: "The beautiful game continues on pitches worldwide.",
          },
        };

        await collection.updateOne(
          { _id: `daily-${today}` as any },
          { $set: doc },
          { upsert: true }
        );
        latest = doc as any;
      }

      res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
      return res.status(200).json({
        lastUpdated: latest!.lastUpdated,
        rumorMill: latest!.rumorMill,
        managerPressure: latest!.managerPressure,
        onThisDay: latest!.onThisDay,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("daily-features error:", error);
    try {
        const { db } = await connectToDatabase();
        if (req.method === "GET" && !!req.headers["x-vercel-cron"]) {
            await db.collection("cron_logs").updateOne(
                { jobName: "daily-features" },
                { $set: { lastRunAt: new Date().toISOString(), status: "failed", error: String(error) } },
                { upsert: true }
            );
        }
    } catch (e) {}
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

