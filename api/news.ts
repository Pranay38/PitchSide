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

interface SocialFeedItem {
    id: string;
    title: string;
    summary: string;
    link: string;
    pubDate: string;
    source: string;
    sourceIcon: string;
}

type SocialSourceKey = "r-soccer";

interface SocialSourceConfig {
    name: string;
    profileUrl: string;
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

const SOCIAL_SOURCES: Record<SocialSourceKey, SocialSourceConfig> = {
    "r-soccer": {
        name: "r/soccer",
        profileUrl: "https://www.reddit.com/r/soccer",
    },
};

const SOCIAL_SOURCE_ICONS: Record<SocialSourceKey, string> = {
    "r-soccer": "🟠",
};

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

function stripHtml(html: string): string {
    return decodeEntities(html).replace(/<[^>]+>/g, "").trim();
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

    const richFields = [
        extractFromXML(itemXml, "description"),
        extractFromXML(itemXml, "content:encoded"),
        extractFromXML(itemXml, "summary"),
        itemXml,
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

function normalizeTitleKey(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
}

function dedupeByTitle(items: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = normalizeTitleKey(item.title);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function parseSocialSource(rawSource: string | undefined): SocialSourceKey | null {
    return rawSource === "r-soccer" ? "r-soccer" : null;
}

function sortByDateDesc<T extends { pubDate: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        const dateA = new Date(a.pubDate).getTime() || 0;
        const dateB = new Date(b.pubDate).getTime() || 0;
        return dateB - dateA;
    });
}

function dedupeSocialItems(items: SocialFeedItem[]): SocialFeedItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = normalizeTitleKey(item.title);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function extractAtomEntryLink(entryXml: string): string {
    const alternateLink = entryXml.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i);
    if (alternateLink?.[1]) return normalizeUrl(alternateLink[1]) || alternateLink[1];

    const fallbackLink = entryXml.match(/<link[^>]+href=["']([^"']+)["']/i);
    if (fallbackLink?.[1]) return normalizeUrl(fallbackLink[1]) || fallbackLink[1];

    return "https://www.reddit.com/r/soccer";
}

async function fetchRedditRssSocialItems(limit = 25): Promise<SocialFeedItem[]> {
    try {
        const response = await fetch("https://www.reddit.com/r/soccer/.rss", {
            headers: { "User-Agent": "FootballBlogBot/1.0" },
            signal: AbortSignal.timeout(6000),
        });
        if (!response.ok) return [];

        const xml = await response.text();
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        const items: SocialFeedItem[] = [];
        let match;

        while ((match = entryRegex.exec(xml)) !== null && items.length < limit) {
            const entryXml = match[1];
            const title = stripHtml(extractFromXML(entryXml, "title"));
            const summary = stripHtml(extractFromXML(entryXml, "content") || extractFromXML(entryXml, "summary")).slice(0, 220);
            const pubDate = extractFromXML(entryXml, "updated") || extractFromXML(entryXml, "published") || new Date().toISOString();
            const entryId = extractFromXML(entryXml, "id");
            const link = extractAtomEntryLink(entryXml);

            if (!title) continue;

            items.push({
                id: `reddit-${entryId || normalizeTitleKey(`${title}-${pubDate}`)}`,
                title,
                summary,
                link,
                pubDate,
                source: "r/soccer",
                sourceIcon: "🟠",
            });
        }

        return items;
    } catch {
        return [];
    }
}

async function fetchFeed(feed: typeof RSS_FEEDS[0], limit = 8): Promise<NewsItem[]> {
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

        while ((match = itemRegex.exec(xml)) !== null && count < limit) {
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

function parseLimit(rawLimit: unknown, fallback = 25): number {
    const parsed = Number.parseInt(String(rawLimit ?? ""), 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(100, Math.max(10, parsed));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        const feedLimit = parseLimit(req.query.limit, 25);
        const socialSource = parseSocialSource(req.query.source as string | undefined);
        if (socialSource) {
            const config = SOCIAL_SOURCES[socialSource];
            const sourceIcon = SOCIAL_SOURCE_ICONS[socialSource] || "📱";
            let socialItems = dedupeSocialItems(
                sortByDateDesc(await fetchRedditRssSocialItems(30))
            ).slice(0, 20);

            if (socialItems.length === 0) {
                socialItems = [
                    {
                        id: "fallback-r-soccer",
                        title: "r/soccer RSS feed is temporarily unavailable.",
                        summary: "Open r/soccer directly while the feed reconnects.",
                        link: config.profileUrl,
                        pubDate: new Date().toISOString(),
                        source: config.name,
                        sourceIcon,
                    },
                ];
            }

            res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
            return res.status(200).json({
                source: socialSource,
                name: config.name,
                profileUrl: config.profileUrl,
                count: socialItems.length,
                lastUpdated: new Date().toISOString(),
                items: socialItems,
            });
        }

        const perFeedLimit = Math.ceil((feedLimit * 1.6) / RSS_FEEDS.length);
        const results = await Promise.all(RSS_FEEDS.map((feed) => fetchFeed(feed, perFeedLimit)));
        const allNews = sortByDateDesc(results.flat());
        const unique = dedupeByTitle(allNews);

        const footballKeywords = ["football", "soccer", "premier league", "champions league", "serie a", "la liga", "bundesliga", "ligue 1", "fa cup", "world cup", "euro ", "fifa", "uefa", "madrid", "barcelona", "united", "city", "arsenal", "chelsea", "liverpool", "bayern", "juventus", "psg"];
        const soccerOnly = unique.filter(item => {
            const text = (item.title + " " + item.description).toLowerCase();
            return footballKeywords.some(kw => text.includes(kw)) || item.source !== "BBC Sport";
        });

        const news = soccerOnly.slice(0, feedLimit);

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
