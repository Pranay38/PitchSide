import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Football News Aggregator API
 * Fetches latest football news from multiple RSS feeds (free, no API key needed).
 *
 * Sources:
 * - BBC Sport Football
 * - ESPN FC
 * - The Guardian Football
 * - Sky Sports Football
 * - Goal.com
 */

interface NewsItem {
    title: string;
    link: string;
    source: string;
    sourceIcon: string;
    pubDate: string;
    description: string;
    imageUrl: string | null;
}

const RSS_FEEDS = [
    {
        url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
        source: "BBC Sport",
        sourceIcon: "🔴",
    },
    {
        url: "https://www.theguardian.com/football/rss",
        source: "The Guardian",
        sourceIcon: "🔵",
    },
    {
        url: "https://www.espn.com/espn/rss/soccer/news",
        source: "ESPN FC",
        sourceIcon: "🟡",
    },
    {
        url: "https://www.skysports.com/rss/12040",
        source: "Sky Sports",
        sourceIcon: "🔴",
    },
];

function extractFromXML(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?\\s*</${tag}>`, "s"));
    return match ? match[1].trim() : "";
}

function extractImageFromItem(itemXml: string): string | null {
    // 1. media:content
    const mediaContentMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    if (mediaContentMatch && mediaContentMatch[1].match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        return mediaContentMatch[1];
    }

    // 2. media:thumbnail
    const mediaThumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
    if (mediaThumbMatch && mediaThumbMatch[1].match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        return mediaThumbMatch[1];
    }

    // 3. enclosure
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    if (enclosureMatch && enclosureMatch[1].match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        return enclosureMatch[1];
    }

    // 4. Try image in description
    const descImgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (descImgMatch) {
        return descImgMatch[1];
    }

    return null;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").trim();
}

async function fetchFeed(feed: typeof RSS_FEEDS[0]): Promise<NewsItem[]> {
    try {
        const res = await fetch(feed.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)" },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return [];
        const xml = await res.text();

        const items: NewsItem[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 8) {
            const itemXml = match[1];
            const title = stripHtml(extractFromXML(itemXml, "title"));
            const link = extractFromXML(itemXml, "link") || extractFromXML(itemXml, "guid");
            const pubDate = extractFromXML(itemXml, "pubDate");
            const description = stripHtml(extractFromXML(itemXml, "description")).slice(0, 200);
            const imageUrl = extractImageFromItem(itemXml);

            if (title && link) {
                items.push({
                    title,
                    link,
                    source: feed.source,
                    sourceIcon: feed.sourceIcon,
                    pubDate,
                    description,
                    imageUrl,
                });
                count++;
            }
        }
        return items;
    } catch (e) {
        console.error(`Failed to fetch ${feed.source}:`, e);
        return [];
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        // Fetch all feeds in parallel
        const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
        const allNews = results.flat();

        // Sort by date (newest first)
        allNews.sort((a, b) => {
            const dateA = new Date(a.pubDate).getTime() || 0;
            const dateB = new Date(b.pubDate).getTime() || 0;
            return dateB - dateA;
        });

        // Deduplicate by similar titles
        const seen = new Set<string>();
        const unique = allNews.filter(item => {
            const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Return top 25 stories
        const news = unique.slice(0, 25);

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        return res.status(200).json({
            count: news.length,
            lastUpdated: new Date().toISOString(),
            news,
        });
    } catch (error: any) {
        console.error("News API Error:", error);
        return res.status(500).json({ error: "Failed to fetch news." });
    }
}
