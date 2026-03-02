import type { VercelRequest, VercelResponse } from "@vercel/node";

/* ── Types ── */
interface RedditComment {
    id: string;
    author: string;
    body: string;
    score: number;
    awards: number;
    permalink: string;
    created: string;
    flair: string;
}

interface RedditPost {
    id: string;
    title: string;
    score: number;
    numComments: number;
    permalink: string;
    created: string;
    flair: string;
    author: string;
}

interface SentimentResult {
    positive: number;
    negative: number;
    neutral: number;
    total: number;
    topPositive: string[];
    topNegative: string[];
    mood: string;
    moodEmoji: string;
}

/* ── Sentiment keywords ── */
const POSITIVE_WORDS = new Set([
    "amazing", "incredible", "brilliant", "fantastic", "wonderful", "beautiful",
    "excellent", "superb", "outstanding", "great", "love", "dominated", "masterclass",
    "world class", "class", "clinical", "unstoppable", "magic", "magical",
    "goat", "legend", "legendary", "best", "insane", "fire", "lit", "peak",
    "deserved", "well played", "impressed", "proud", "happy", "joy", "celebrate",
    "bravo", "clutch", "clean sheet", "banger", "goal of the season", "what a goal",
    "top class", "quality", "immense", "massive", "sexy football", "tiki-taka",
    "phenomenal", "wow", "lethal", "unreal", "ridiculous", "perfection",
]);

const NEGATIVE_WORDS = new Set([
    "terrible", "awful", "horrible", "worst", "disaster", "embarrassing",
    "pathetic", "disgrace", "shameful", "useless", "trash", "garbage",
    "robbed", "rigged", "dive", "cheat", "fraud", "overrated", "flop",
    "bottled", "bottler", "sacked", "out", "finished", "done", "washed",
    "hate", "angry", "furious", "disgusted", "disappointed", "sad", "crying",
    "relegation", "nightmare", "shambles", "joke", "clown", "embarrassment",
    "shit", "crap", "rubbish", "abysmal", "dreadful", "woeful", "appalling",
]);

function analyzeSentiment(texts: string[]): SentimentResult {
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    const posExamples: string[] = [];
    const negExamples: string[] = [];

    for (const text of texts) {
        const lower = text.toLowerCase();
        let posScore = 0;
        let negScore = 0;

        for (const w of POSITIVE_WORDS) {
            if (lower.includes(w)) posScore++;
        }
        for (const w of NEGATIVE_WORDS) {
            if (lower.includes(w)) negScore++;
        }

        if (posScore > negScore) {
            positive++;
            if (posExamples.length < 3) posExamples.push(text.slice(0, 120));
        } else if (negScore > posScore) {
            negative++;
            if (negExamples.length < 3) negExamples.push(text.slice(0, 120));
        } else {
            neutral++;
        }
    }

    const total = texts.length || 1;
    const posPercent = Math.round((positive / total) * 100);
    const negPercent = Math.round((negative / total) * 100);

    let mood = "Mixed";
    let moodEmoji = "😐";
    if (posPercent >= 60) { mood = "Very Positive"; moodEmoji = "🔥"; }
    else if (posPercent >= 45) { mood = "Positive"; moodEmoji = "😊"; }
    else if (negPercent >= 60) { mood = "Very Negative"; moodEmoji = "😤"; }
    else if (negPercent >= 45) { mood = "Negative"; moodEmoji = "😞"; }
    else { mood = "Mixed Reactions"; moodEmoji = "🤔"; }

    return {
        positive: posPercent,
        negative: negPercent,
        neutral: 100 - posPercent - negPercent,
        total,
        topPositive: posExamples,
        topNegative: negExamples,
        mood,
        moodEmoji,
    };
}

/* ── Reddit fetch helpers ── */
const REDDIT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
};

const REDDIT_JSON_URLS = [
    (sub: string, sort: string, limit: number) => `https://old.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1`,
    (sub: string, sort: string, limit: number) => `https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1`,
    (sub: string, sort: string, limit: number) => `https://api.reddit.com/r/${sub}/${sort}?limit=${limit}&raw_json=1`,
];

async function tryRedditFetch(urlBuilders: ((sub: string, sort: string, limit: number) => string)[], sub: string, sort: string, limit: number): Promise<any | null> {
    for (const buildUrl of urlBuilders) {
        try {
            const url = buildUrl(sub, sort, limit);
            const res = await fetch(url, {
                headers: REDDIT_HEADERS,
                signal: AbortSignal.timeout(8000),
                redirect: "follow",
            });
            if (!res.ok) {
                console.error(`Reddit ${url}: ${res.status}`);
                continue;
            }
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("json")) {
                console.error(`Reddit ${url}: non-JSON response (${contentType})`);
                continue;
            }
            return await res.json();
        } catch (err) {
            console.error(`Reddit fetch error:`, err);
        }
    }
    return null;
}

// RSS fallback for when all JSON APIs are blocked
async function fetchRedditRSSPosts(limit = 15): Promise<RedditPost[]> {
    try {
        const res = await fetch(`https://www.reddit.com/r/soccer/hot/.rss?limit=${limit}`, {
            headers: { ...REDDIT_HEADERS, "Accept": "application/rss+xml,application/xml,text/xml" },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const xml = await res.text();

        const entries: RedditPost[] = [];
        const entryRegex = /<entry>(.*?)<\/entry>/gs;
        let match;
        while ((match = entryRegex.exec(xml)) !== null && entries.length < limit) {
            const entry = match[1];
            const title = (entry.match(/<title>(.*?)<\/title>/s)?.[1] || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
            const link = entry.match(/<link\s+href="(.*?)"/)?.[1] || "";
            const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || "";
            const updated = entry.match(/<updated>(.*?)<\/updated>/)?.[1] || "";
            const author = entry.match(/<name>(.*?)<\/name>/)?.[1] || "Anonymous";
            const category = entry.match(/<category\s+term="(.*?)"/)?.[1] || "";

            if (!title || title.startsWith("[Match Thread]") && entries.length > 3) continue;

            // Extract post ID from Reddit URL
            const postIdMatch = link.match(/comments\/([a-z0-9]+)/);
            entries.push({
                id: postIdMatch?.[1] || id,
                title: title.replace(/^\[.*?\]\s*/, ""),
                score: 0,
                numComments: 0,
                permalink: link.startsWith("http") ? link : `https://www.reddit.com${link}`,
                created: updated ? new Date(updated).toISOString() : new Date().toISOString(),
                flair: category || "",
                author: author.replace("/u/", ""),
            });
        }
        return entries;
    } catch {
        return [];
    }
}

async function fetchRedditHotPosts(limit = 15): Promise<RedditPost[]> {
    // Try JSON APIs first
    const data = await tryRedditFetch(REDDIT_JSON_URLS, "soccer", "hot", limit);
    if (data?.data?.children?.length > 0) {
        return data.data.children
            .map((c: any) => c.data)
            .filter((p: any) => p && !p.stickied)
            .map((p: any) => ({
                id: p.id,
                title: p.title || "",
                score: p.score || 0,
                numComments: p.num_comments || 0,
                permalink: `https://www.reddit.com${p.permalink}`,
                created: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : new Date().toISOString(),
                flair: p.link_flair_text || "",
                author: p.author || "Anonymous",
            }));
    }

    // Fallback to RSS
    console.log("Reddit JSON blocked, falling back to RSS");
    return fetchRedditRSSPosts(limit);
}

async function fetchPostComments(postId: string, limit = 25): Promise<RedditComment[]> {
    // Try multiple URL forms
    const urls = [
        `https://old.reddit.com/r/soccer/comments/${postId}.json?sort=top&limit=${limit}&raw_json=1`,
        `https://www.reddit.com/r/soccer/comments/${postId}.json?sort=top&limit=${limit}&raw_json=1`,
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url, {
                headers: REDDIT_HEADERS,
                signal: AbortSignal.timeout(8000),
                redirect: "follow",
            });
            if (!res.ok) continue;
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("json")) continue;
            const data = await res.json();

            // Second element in array is the comments listing
            const commentListing = data?.[1]?.data?.children || [];
            if (commentListing.length > 0) {
                return commentListing
                    .map((c: any) => c.data)
                    .filter((c: any) => c && c.body && c.author !== "AutoModerator" && c.body !== "[deleted]" && c.body !== "[removed]")
                    .slice(0, limit)
                    .map((c: any) => ({
                        id: c.id,
                        author: c.author || "Anonymous",
                        body: (c.body || "").slice(0, 500),
                        score: c.score || 0,
                        awards: c.total_awards_received || 0,
                        permalink: `https://www.reddit.com${c.permalink || ""}`,
                        created: c.created_utc ? new Date(c.created_utc * 1000).toISOString() : new Date().toISOString(),
                        flair: c.author_flair_text || "",
                    }));
            }
        } catch {
            continue;
        }
    }
    return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const mode = (req.query.mode as string) || "reactions";

    try {
        if (mode === "reactions") {
            // Get hot posts and top comments from the hottest thread
            const posts = await fetchRedditHotPosts(15);

            // Find the most active match/post thread
            const commentablePosts = posts.filter(p => p.numComments > 10);
            const topPost = commentablePosts.length > 0 ? commentablePosts[0] : posts[0];

            let topComments: RedditComment[] = [];
            if (topPost) {
                topComments = await fetchPostComments(topPost.id, 20);
            }

            res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=600");
            return res.status(200).json({
                mode: "reactions",
                hotPosts: posts.slice(0, 10),
                threadTitle: topPost?.title || "",
                threadPermalink: topPost?.permalink || "",
                topComments,
            });
        }

        if (mode === "sentiment") {
            // Fetch multiple threads and analyze sentiment
            const posts = await fetchRedditHotPosts(10);

            // Gather comments from top 3 most active threads
            const activePosts = posts
                .filter(p => p.numComments > 20)
                .slice(0, 3);

            const allCommentTexts: string[] = [];
            for (const post of activePosts) {
                const comments = await fetchPostComments(post.id, 30);
                for (const c of comments) {
                    allCommentTexts.push(c.body);
                }
            }

            const sentiment = analyzeSentiment(allCommentTexts);

            res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
            return res.status(200).json({
                mode: "sentiment",
                ...sentiment,
                analyzedThreads: activePosts.map(p => p.title).slice(0, 3),
            });
        }

        return res.status(400).json({ error: "Invalid mode. Use 'reactions' or 'sentiment'." });
    } catch (err: any) {
        console.error("Fan pulse error:", err);
        return res.status(500).json({ error: "Failed to fetch fan data." });
    }
}
