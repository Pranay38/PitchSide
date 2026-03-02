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

function decodeEntities(text: string): string {
    return text
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&#x2F;|&#47;/gi, "/")
        .replace(/&colon;/gi, ":");
}

function normalizeUrl(rawUrl: string): string | null {
    const decoded = decodeEntities(rawUrl).replace(/\\\//g, "/").trim();
    if (!decoded) return null;

    if (decoded.startsWith("//")) return `https:${decoded}`;
    if (/^https?:\/\//i.test(decoded)) return decoded.replace(/^http:\/\//i, "https://");
    return null;
}

function isLikelyImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/i.test(url)
        || /[?&](img|image|url)=/i.test(url)
        || /(images?|photo|media|uploads?)/i.test(url);
}

function extractImageFromItem(itemXml: string): string | null {
    const candidates: string[] = [];
    const seen = new Set<string>();

    const addCandidate = (rawUrl: string, requireImageHint: boolean = false) => {
        const normalized = normalizeUrl(rawUrl);
        if (!normalized) return;
        if (requireImageHint && !isLikelyImageUrl(normalized)) return;
        if (seen.has(normalized)) return;
        seen.add(normalized);
        candidates.push(normalized);
    };

    // 1. media:* and enclosure tags
    const mediaTagRegex = /<(media:content|media:thumbnail|enclosure)\b([^>]*)>/gi;
    let mediaMatch;
    while ((mediaMatch = mediaTagRegex.exec(itemXml)) !== null) {
        const attrs = mediaMatch[2] || "";
        const urlMatch = attrs.match(/\burl=["']([^"']+)["']/i);
        if (!urlMatch) continue;

        const typeMatch = attrs.match(/\btype=["']([^"']+)["']/i);
        const hasImageType = !!typeMatch && typeMatch[1].toLowerCase().startsWith("image/");
        addCandidate(urlMatch[1], !hasImageType);
    }

    // 2. Rich content fields (description/content:encoded/summary)
    const richFields = [
        extractFromXML(itemXml, "description"),
        extractFromXML(itemXml, "content:encoded"),
        extractFromXML(itemXml, "summary"),
        itemXml, // Last resort: parse full item XML for embedded image URLs
    ];

    for (const field of richFields) {
        const decoded = decodeEntities(field);

        let imgMatch;
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        while ((imgMatch = imgRegex.exec(decoded)) !== null) {
            addCandidate(imgMatch[1]);
        }

        const ogImageMatch = decoded.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogImageMatch) addCandidate(ogImageMatch[1]);

        let directMatch;
        const directImageRegex = /(https?:\/\/[^"'\s<>]+(?:\.(?:jpg|jpeg|png|webp|gif|avif|svg)|[?&](?:img|image|url)=)[^"'\s<>]*)/gi;
        while ((directMatch = directImageRegex.exec(decoded)) !== null) {
            addCandidate(directMatch[1]);
        }
    }

    return candidates[0] || null;
}

function stripHtml(html: string): string {
    return decodeEntities(html).replace(/<[^>]+>/g, "").trim();
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

        // Filter to ensure only football-related content (just in case other sports leak in)
        const footballKeywords = ["football", "soccer", "premier league", "champions league", "serie a", "la liga", "bundesliga", "ligue 1", "fa cup", "world cup", "euro ", "fifa", "uefa", "madrid", "barcelona", "united", "city", "arsenal", "chelsea", "liverpool", "bayern", "juventus", "psg"];
        const soccerOnly = unique.filter(item => {
            const text = (item.title + " " + item.description).toLowerCase();
            return footballKeywords.some(kw => text.includes(kw)) || item.source !== "BBC Sport"; // BBC Sport Football feed is reliable, others might need filtering
        });

        // Return top 25 stories
        const news = soccerOnly.slice(0, 25);

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
