import type { VercelRequest, VercelResponse } from "@vercel/node";
import collectionsHandler from "./_endpoints/collections.js";
import debatesHandler from "./_endpoints/debates.js";
import notifyHandler from "./_endpoints/notify.js";
import settingsHandler from "./_endpoints/settings.js";
import subscribersHandler from "./_endpoints/subscribers.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const route = req.query.route as string;

    switch (route) {
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
        default:
            return res.status(404).json({ error: "Route not found" });
    }
}
