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
import pollOfWeekHandler from "../server/endpoints/poll-of-week.js";
import onThisDayHandler from "../server/endpoints/on-this-day.js";
import newsletterHandler from "../server/endpoints/newsletter.js";
import { getPolls, createPoll, updatePoll, deletePoll, votePoll } from "../server/endpoints/polls.js";
import { getMatchRatings, createMatchRating, updateMatchRating, deleteMatchRating, voteMatchRating } from "../server/endpoints/matchRatings.js";

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
        case "newsletter":
            return newsletterHandler(req, res);
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
        default:
            return res.status(404).json({ error: "Route not found: " + route });
    }
}
