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
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
};

async function fetchRedditHotPosts(limit = 15): Promise<RedditPost[]> {
    try {
        const res = await fetch(`https://www.reddit.com/r/soccer/hot.json?limit=${limit}&raw_json=1`, {
            headers: REDDIT_HEADERS,
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) {
            console.error(`Reddit hot posts: ${res.status} ${res.statusText}`);
            return [];
        }
        const data = await res.json();
        return (data.data?.children || [])
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
    } catch {
        return [];
    }
}

async function fetchPostComments(postId: string, limit = 25): Promise<RedditComment[]> {
    try {
        const res = await fetch(
            `https://www.reddit.com/r/soccer/comments/${postId}.json?sort=top&limit=${limit}&raw_json=1`,
            { headers: REDDIT_HEADERS, signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) {
            console.error(`Reddit comments: ${res.status} ${res.statusText}`);
            return [];
        }
        const data = await res.json();

        // Second element in array is the comments listing
        const commentListing = data?.[1]?.data?.children || [];
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
    } catch {
        return [];
    }
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
