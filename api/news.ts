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

type SocialSourceKey =
    | "premier-league"
    | "champions-league"
    | "la-liga"
    | "serie-a"
    | "bundesliga"
    | "fabrizio-romano"
    | "r-soccer";

interface SocialSourceConfig {
    name: string;
    profileUrl: string;
    xHandle?: string;
    keywords?: string[];
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
    "premier-league": {
        name: "Premier League",
        profileUrl: "https://x.com/premierleague",
        xHandle: "premierleague",
        keywords: ["premier league", "epl", "arsenal", "liverpool", "chelsea", "manchester", "tottenham", "newcastle", "aston villa"],
    },
    "champions-league": {
        name: "Champions League",
        profileUrl: "https://x.com/ChampionsLeague",
        xHandle: "ChampionsLeague",
        keywords: ["champions league", "ucl", "uefa champions league", "round of 16", "quarter-final", "semi-final", "group stage"],
    },
    "la-liga": {
        name: "La Liga",
        profileUrl: "https://x.com/LaLigaEN",
        xHandle: "LaLigaEN",
        keywords: ["la liga", "real madrid", "barcelona", "atletico", "sevilla", "girona", "bilbao", "sociedad"],
    },
    "serie-a": {
        name: "Serie A",
        profileUrl: "https://x.com/SerieA_EN",
        xHandle: "SerieA_EN",
        keywords: ["serie a", "juventus", "inter", "milan", "napoli", "roma", "lazio", "atalanta", "fiorentina"],
    },
    "bundesliga": {
        name: "Bundesliga",
        profileUrl: "https://x.com/Bundesliga_EN",
        xHandle: "Bundesliga_EN",
        keywords: ["bundesliga", "bayern", "dortmund", "leverkusen", "leipzig", "frankfurt", "stuttgart"],
    },
    "fabrizio-romano": {
        name: "Fabrizio Romano",
        profileUrl: "https://x.com/FabrizioRomano",
        xHandle: "FabrizioRomano",
        keywords: ["transfer", "deal", "medical", "bid", "loan", "gossip", "rumour", "rumor", "fee", "signing"],
    },
    "r-soccer": {
        name: "r/soccer",
        profileUrl: "https://www.reddit.com/r/soccer",
    },
};

const SOCIAL_SOURCE_ICONS: Record<SocialSourceKey, string> = {
    "premier-league": "🏴",
    "champions-league": "🏆",
    "la-liga": "🇪🇸",
    "serie-a": "🇮🇹",
    "bundesliga": "🇩🇪",
    "fabrizio-romano": "🔔",
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
    if (!rawSource) return null;
    const allowed = new Set<SocialSourceKey>([
        "premier-league",
        "champions-league",
        "la-liga",
        "serie-a",
        "bundesliga",
        "fabrizio-romano",
        "r-soccer",
    ]);
    const source = rawSource as SocialSourceKey;
    return allowed.has(source) ? source : null;
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

const NITTER_RSS_MIRRORS = [
    "https://nitter.net",
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
    "https://nitter.1d4.us",
];

function normalizeXPostUrl(rawLink: string, fallbackHandle: string): string {
    const normalized = normalizeUrl(rawLink);
    if (!normalized) return `https://x.com/${fallbackHandle}`;

    const statusMatch = normalized.match(/\/status\/(\d+)/);
    if (statusMatch?.[1]) {
        return `https://x.com/${fallbackHandle}/status/${statusMatch[1]}`;
    }
    return normalized
        .replace("https://nitter.net/", "https://x.com/")
        .replace("https://nitter.poast.org/", "https://x.com/")
        .replace("https://nitter.privacydev.net/", "https://x.com/")
        .replace("https://nitter.1d4.us/", "https://x.com/");
}

async function fetchXTimelineRssItems(source: SocialSourceConfig, sourceIcon: string, limit = 20): Promise<SocialFeedItem[]> {
    if (!source.xHandle) return [];

    for (const mirror of NITTER_RSS_MIRRORS) {
        try {
            const rssUrl = `${mirror}/${encodeURIComponent(source.xHandle)}/rss`;
            const response = await fetch(rssUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)" },
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) continue;

            const xml = await response.text();
            const itemRegex = /<item>([\s\S]*?)<\/item>/g;
            const items: SocialFeedItem[] = [];
            let match;

            while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
                const itemXml = match[1];
                const rawTitle = stripHtml(extractFromXML(itemXml, "title"));
                const title = rawTitle.replace(/^@?[A-Za-z0-9_]+\s*:\s*/g, "").trim() || rawTitle;
                const link = normalizeXPostUrl(extractFromXML(itemXml, "link"), source.xHandle);
                const pubDate = extractFromXML(itemXml, "pubDate");
                const summary = stripHtml(extractFromXML(itemXml, "description")).slice(0, 240);

                if (!title) continue;

                items.push({
                    id: `x-${source.xHandle}-${normalizeTitleKey(`${title}-${pubDate}`)}`,
                    title,
                    summary,
                    link,
                    pubDate,
                    source: source.name,
                    sourceIcon,
                });
            }

            if (items.length > 0) return items;
        } catch {
            // Try next mirror.
        }
    }

    return [];
}

async function fetchRedditSocialItems(limit = 25): Promise<SocialFeedItem[]> {
    try {
        const response = await fetch(`https://www.reddit.com/r/soccer/hot.json?limit=${limit}`, {
            headers: { "User-Agent": "FootballBlogBot/1.0" },
            signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) return [];

        const data = await response.json() as { data?: { children?: Array<{ data?: any }> } };
        const children = data.data?.children || [];
        return children
            .map((entry) => entry.data)
            .filter(Boolean)
            .map((post) => {
                const permalink = typeof post.permalink === "string" ? post.permalink : "";
                return {
                    id: `reddit-${post.id || normalizeTitleKey(post.title || "")}`,
                    title: stripHtml(post.title || "Untitled post"),
                    summary: stripHtml(post.selftext || "").slice(0, 220),
                    link: permalink ? `https://www.reddit.com${permalink}` : "https://www.reddit.com/r/soccer",
                    pubDate: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString(),
                    source: "r/soccer",
                    sourceIcon: "🟠",
                } as SocialFeedItem;
            });
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        const socialSource = parseSocialSource(req.query.source as string | undefined);
        if (socialSource) {
            const config = SOCIAL_SOURCES[socialSource];
            const sourceIcon = SOCIAL_SOURCE_ICONS[socialSource] || "📱";
            let socialItems: SocialFeedItem[] = [];

            if (socialSource === "r-soccer") {
                socialItems = dedupeSocialItems(sortByDateDesc(await fetchRedditSocialItems())).slice(0, 20);
            } else {
                socialItems = dedupeSocialItems(
                    sortByDateDesc(await fetchXTimelineRssItems(config, sourceIcon, 20))
                ).slice(0, 20);
            }

            if (socialItems.length === 0) {
                socialItems = [
                    {
                        id: `fallback-${socialSource}`,
                        title: `${config.name} X feed is temporarily unavailable.`,
                        summary: "Use the profile link to view the latest posts directly on X.",
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

        // Fetch all feeds in parallel
        const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
        const allNews = sortByDateDesc(results.flat());
        const unique = dedupeByTitle(allNews);

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
