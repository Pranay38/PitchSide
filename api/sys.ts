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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const route = req.query.route as string;

    switch (route) {
        case "auth":
            return authHandler(req, res);
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
        case "tactics":
            return tacticsHandler(req, res);
        case "og":
            return ogHandler(req, res);
        case "club-season":
            return clubSeasonHandler(req, res);
        default:
            return res.status(404).json({ error: "Route not found" });
    }
}
