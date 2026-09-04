import type { VercelRequest, VercelResponse } from "@vercel/node";
import collectionsHandler from "../server/endpoints/collections";
import debatesHandler from "../server/endpoints/debates";
import notifyHandler from "../server/endpoints/notify";
import settingsHandler from "../server/endpoints/settings";
import subscribersHandler from "../server/endpoints/subscribers";
import tacticsHandler from "../server/endpoints/tactics";
import ogHandler from "../server/endpoints/og";
import clubSeasonHandler from "../server/endpoints/club-season";
import predictionsHandler from "../server/endpoints/predictions";
import runInHandler from "../server/endpoints/run-in";
import titleRaceHandler from "../server/endpoints/title-race";
import pollOfWeekHandler from "../server/endpoints/poll-of-week";
import onThisDayHandler from "../server/endpoints/on-this-day";
import analyticsHandler from "../server/endpoints/analytics";
import aiGenerateHandler from "../server/endpoints/ai-generate";
import sitemapHandler from "../server/endpoints/sitemap";

import { getPolls, createPoll, updatePoll, deletePoll, votePoll } from "../server/endpoints/polls";
import { getMatchRatings, createMatchRating, updateMatchRating, deleteMatchRating, voteMatchRating } from "../server/endpoints/matchRatings";
import { getArmchairRatings, voteArmchairRatings } from "../server/endpoints/armchairRatings";
import { recordArticleView, getRecommendations, getTagBasedFallback } from "./_recommendations-lib";
import { connectToDatabase } from "./_db";
import notificationsHandler from "../server/endpoints/notifications";
import digestHandler from "../server/endpoints/digest";
import userPrefsHandler from "../server/endpoints/user-prefs";
import dailyFeaturesHandler from "../server/endpoints/daily-features";
import errorLogHandler from "../server/endpoints/error-log";
import rssHandler from "../server/endpoints/rss";
import ensureIndexesHandler from "../server/endpoints/ensure-indexes";
import searchHandler from "../server/endpoints/search";
import footballDataHandler from "../server/endpoints/football-data";

import welcomeSequenceHandler from "../server/endpoints/welcome-sequence";
import { applyRateLimit, applyStrictRateLimit } from "../server/lib/rateLimit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const route = (req.query.route || req.query.action) as string;

    // ── Global rate limiting (all public endpoints) ──
    const blocked = await applyRateLimit(req, res);
    if (blocked) return; // 429 already sent

    // ── Strict rate limiting for sensitive endpoints ──
    const shouldApplyStrictRateLimit =
        route === "error-log" ||
        route === "auth" ||
        route === "notify" ||
        (route === "subscribers" && req.method !== "GET");

    if (shouldApplyStrictRateLimit) {
        const strictBlocked = await applyStrictRateLimit(req, res);
        if (strictBlocked) return;
    }

    switch (route) {
        case "on-this-day":
            return onThisDayHandler(req, res);
        case "predictions":
            return predictionsHandler(req, res);
        case "run-in":
            return runInHandler(req as any, res as any);
        case "title-race":
            return titleRaceHandler(req as any, res as any);
        case "poll-of-week":
            return pollOfWeekHandler(req, res);
        case "collections":
            return collectionsHandler(req, res);
        case "debates":
            return debatesHandler(req, res);
        case "notify":
            return notifyHandler(req, res);
        case "settings":
            return settingsHandler(req, res);
        case "subscribers":
            return subscribersHandler(req, res);
        case "digest":
            return digestHandler(req, res);
        case "analytics":
            return analyticsHandler(req, res);
        case "generate-carousel":
            return aiGenerateHandler(req, res);
        case "ai-generate":
            return aiGenerateHandler(req, res);
        case "tactics":
            return tacticsHandler(req, res);
        case "og":
            return ogHandler(req, res);
        case "club-season":
            return clubSeasonHandler(req, res);

        case "user-prefs":
            return userPrefsHandler(req, res);
        case "polls":
            if (req.method === "GET") return await getPolls(req as any, res as any);
            if (req.method === "POST") return await createPoll(req as any, res as any);
            if (req.method === "PUT") return await updatePoll(req as any, res as any);
            if (req.method === "DELETE") return await deletePoll(req as any, res as any);
            return res.status(405).json({ error: "Method not allowed" });
        case "polls-vote":
            if (req.method === "POST") return await votePoll(req as any, res as any);
            return res.status(405).json({ error: "Method not allowed" });
        case "match-ratings":
            if (req.method === "GET") return await getMatchRatings(req as any, res as any);
            if (req.method === "POST") return await createMatchRating(req as any, res as any);
            if (req.method === "PUT") return await updateMatchRating(req as any, res as any);
            if (req.method === "DELETE") return await deleteMatchRating(req as any, res as any);
            return res.status(405).json({ error: "Method not allowed" });
        case "match-ratings-vote":
            if (req.method === "POST") return await voteMatchRating(req as any, res as any);
            return res.status(405).json({ error: "Method not allowed" });
        case "armchair-ratings":
            if (req.method === "GET") return await getArmchairRatings(req as any, res as any);
            return res.status(405).json({ error: "Method not allowed" });
        case "armchair-ratings-vote":
            if (req.method === "POST") return await voteArmchairRatings(req as any, res as any);
            return res.status(405).json({ error: "Method not allowed" });
        case "sitemap":
            return sitemapHandler(req, res);
        case "notifications":
            return notificationsHandler(req, res);
        case "recommendations": {
            const { articleId } = req.query;
            const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);
            if (!articleId || typeof articleId !== "string") return res.status(400).json({ error: "Invalid articleId" });
            try {
                const { db } = await connectToDatabase();
                const article = await db.collection("posts").findOne({ id: articleId });
                
                let recommendations: any[] = [];
                const seen = new Set<string>();

                // 1. Curated Read Next (relatedPostIds)
                if (article?.relatedPostIds && Array.isArray(article.relatedPostIds)) {
                    const relatedPosts = await db.collection("posts").find({ id: { $in: article.relatedPostIds }, isDraft: { $ne: true } }).toArray();
                    for (const rp of relatedPosts) {
                        if (!seen.has(rp.id)) {
                            recommendations.push(rp);
                            seen.add(rp.id);
                        }
                    }
                }

                // 2. Machine Learning Collaborative Filtering
                if (recommendations.length < limit) {
                    const mlRecs = await getRecommendations({ articleId, limit: limit - recommendations.length });
                    for (const rec of mlRecs) {
                        if (rec && !seen.has(rec.id)) {
                            recommendations.push(rec);
                            seen.add(rec.id);
                        }
                    }
                }

                // 3. Tag-based Fallback
                if (recommendations.length < limit) {
                    const tagBased = await getTagBasedFallback({ articleId, tags: article?.tags || [], club: article?.club, limit: limit - recommendations.length });
                    for (const rec of tagBased) {
                        if (rec && !seen.has(rec.id)) {
                            recommendations.push(rec);
                            seen.add(rec.id);
                        }
                    }
                }

                const source = article?.relatedPostIds?.length > 0 ? "curated" : (recommendations.length >= 3 ? "collaborative" : "tag-based");
                res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
                return res.json({ recommendations, source });
            } catch (err) {
                console.error("Recommendations error:", err);
                return res.status(500).json({ error: "Failed to fetch recommendations" });
            }
        }
        case "recommendations-track": {
            if (req.method !== "POST") return res.status(405).end();
            const { articleId, sessionId, userId } = req.body;
            if (!articleId || !sessionId) return res.status(400).json({ error: "articleId and sessionId required" });
            try {
                await recordArticleView({ articleId, sessionId, userId });
                return res.json({ success: true });
            } catch (err) {
                console.error("Track error:", err);
                return res.status(500).json({ error: "Failed to track view" });
            }
        }
        case "daily-features":
            return dailyFeaturesHandler(req, res);
        case "error-log":
            return errorLogHandler(req, res);
        case "rss":
            return rssHandler(req, res);
        case "ensure-indexes":
            return ensureIndexesHandler(req, res);
        case "search":
            return searchHandler(req, res);
        case "football-data":
            return footballDataHandler(req, res);

        case "welcome-sequence":
            return welcomeSequenceHandler(req, res);
        default:
            return res.status(404).json({ error: "Route not found: " + route });
    }
}
