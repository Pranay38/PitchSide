import type { VercelRequest, VercelResponse } from "@vercel/node";
import collectionsHandler from "../server/endpoints/collections.js";
import debatesHandler from "../server/endpoints/debates.js";
import notifyHandler from "../server/endpoints/notify.js";
import settingsHandler from "../server/endpoints/settings.js";
import subscribersHandler from "../server/endpoints/subscribers.js";
import tacticsHandler from "../server/endpoints/tactics.js";
import ogHandler from "../server/endpoints/og.js";
import clubSeasonHandler from "../server/endpoints/club-season.js";
import authHandler from "../server/endpoints/auth.js";
import predictionsHandler from "../server/endpoints/predictions.js";
import runInHandler from "../server/endpoints/run-in.js";
import titleRaceHandler from "../server/endpoints/title-race.js";
import pollOfWeekHandler from "../server/endpoints/poll-of-week.js";
import onThisDayHandler from "../server/endpoints/on-this-day.js";
import analyticsHandler from "../server/endpoints/analytics.js";
import aiGenerateHandler from "../server/endpoints/ai-generate.js";
import sitemapHandler from "../server/endpoints/sitemap.js";
import { getPolls, createPoll, updatePoll, deletePoll, votePoll } from "../server/endpoints/polls.js";
import { getMatchRatings, createMatchRating, updateMatchRating, deleteMatchRating, voteMatchRating } from "../server/endpoints/matchRatings.js";
import { recordArticleView, getRecommendations, getTagBasedFallback } from "./_recommendations-lib";
import { connectToDatabase } from "./_db";
import notificationsHandler from "../server/endpoints/notifications.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const route = (req.query.route || req.query.action) as string;

    switch (route) {
        case "auth":
            return authHandler(req, res);
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
        case "sitemap":
            return sitemapHandler(req, res);
        case "notifications":
            return notificationsHandler(req, res);
        case "recommendations": {
            const { articleId } = req.query;
            const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);
            if (!articleId || typeof articleId !== "string") return res.status(400).json({ error: "Invalid articleId" });
            try {
                let recommendations = await getRecommendations({ articleId, limit });
                if (recommendations.length < 3) {
                    const { db } = await connectToDatabase();
                    const article = await db.collection("posts").findOne({ id: articleId });
                    const tagBased = await getTagBasedFallback({ articleId, tags: article?.tags || [], club: article?.club, limit: limit - recommendations.length });
                    const seen = new Set(recommendations.map((r: any) => r?.id));
                    recommendations = [...recommendations, ...tagBased.filter((a: any) => a && !seen.has(a.id))].filter(Boolean);
                }
                res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
                return res.json({ recommendations, source: recommendations.length >= 3 ? "collaborative" : "tag-based" });
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
        default:
            return res.status(404).json({ error: "Route not found: " + route });
    }
}
