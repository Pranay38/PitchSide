import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit } from "../utils/security.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Sentiment Analyzer                                                 */
/* ------------------------------------------------------------------ */

const POSITIVE_WORDS = new Set([
    "amazing", "incredible", "brilliant", "fantastic", "wonderful", "beautiful",
    "excellent", "superb", "outstanding", "great", "love", "dominated", "masterclass",
    "world class", "class", "clinical", "unstoppable", "magic", "magical",
    "goat", "legend", "legendary", "best", "insane", "fire", "lit", "peak",
    "deserved", "well played", "impressed", "proud", "happy", "joy", "celebrate",
    "bravo", "clutch", "clean sheet", "banger", "what a goal",
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
            if (posExamples.length < 3 && text.length > 20) posExamples.push(text.slice(0, 150) + (text.length > 150 ? "..." : ""));
        } else if (negScore > posScore) {
            negative++;
            if (negExamples.length < 3 && text.length > 20) negExamples.push(text.slice(0, 150) + (text.length > 150 ? "..." : ""));
        } else {
            neutral++;
        }
    }

    const total = texts.length || 1;
    const posPercent = Math.round((positive / total) * 100);
    const negPercent = Math.round((negative / total) * 100);

    let mood = "Mixed Reactions";
    let moodEmoji = "🤔";
    if (posPercent >= 55) { mood = "Very Positive"; moodEmoji = "🔥"; }
    else if (posPercent >= 40) { mood = "Positive"; moodEmoji = "😊"; }
    else if (negPercent >= 55) { mood = "Very Negative"; moodEmoji = "😤"; }
    else if (negPercent >= 40) { mood = "Negative"; moodEmoji = "😞"; }

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

/* ------------------------------------------------------------------ */
/*  Reddit Fetchers                                                    */
/* ------------------------------------------------------------------ */

async function fetchRedditHotPosts(limit = 15): Promise<RedditPost[]> {
    try {
        const res = await fetch(`https://www.reddit.com/r/soccer/hot.json?limit=${limit}`, {
            headers: { "User-Agent": "FootballBlogBot/1.1" },
            signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return [];
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
            `https://www.reddit.com/r/soccer/comments/${postId}.json?sort=top&limit=${limit}`,
            { headers: { "User-Agent": "FootballBlogBot/1.1" }, signal: AbortSignal.timeout(6000) }
        );
        if (!res.ok) return [];
        const data = await res.json();
        const commentListing = data?.[1]?.data?.children || [];
        return commentListing
            .map((c: any) => c.data)
            .filter((c: any) => c && c.body && c.author !== "AutoModerator" && c.body !== "[deleted]" && c.body !== "[removed]")
            .slice(0, limit)
            .map((c: any) => ({
                id: c.id,
                author: c.author || "Anonymous",
                body: (c.body || ""),
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

/* ------------------------------------------------------------------ */
/*  Main Handler                                                       */
/* ------------------------------------------------------------------ */

export default async function fanPulseHandler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        // Fetch top threads
        const posts = await fetchRedditHotPosts(12);

        // Gather comments from top 3 most active threads
        const activePosts = posts
            .filter(p => p.numComments > 15)
            .slice(0, 3);

        const allCommentTexts: string[] = [];
        for (const post of activePosts) {
            const comments = await fetchPostComments(post.id, 25);
            for (const c of comments) {
                allCommentTexts.push(c.body);
            }
        }

        const sentiment = analyzeSentiment(allCommentTexts);

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        return res.status(200).json({
            ...sentiment,
            analyzedThreads: activePosts.map(p => p.title).slice(0, 3),
        });

    } catch (err: any) {
        console.error("Fan pulse error:", err);
        return res.status(500).json({ error: "Failed to fetch fan data." });
    }
}
