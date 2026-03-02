import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = process.env.FOOTBALL_DATA_KEY || "";
const BASE_URL = "https://api.football-data.org/v4";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!API_KEY) return res.status(500).json({ error: "FOOTBALL_DATA_KEY not configured." });

    try {
        const competitions = req.query.competition as string || "PL";

        // Support custom date ranges via query params
        const mode = req.query.mode as string || "recent"; // "recent", "next", "prev", or "custom"
        const offsetDays = parseInt(req.query.offset as string) || 0;

        let dateFrom: string;
        let dateTo: string;
        const now = new Date();

        if (mode === "recent") {
            // Last 24 hours + next few hours
            const past = new Date(now);
            past.setDate(past.getDate() - 1);
            const future = new Date(now);
            future.setHours(future.getHours() + 6);
            dateFrom = past.toISOString().split("T")[0];
            dateTo = future.toISOString().split("T")[0];
        } else if (mode === "next") {
            // Next fixtures from offset
            const start = new Date(now);
            start.setDate(start.getDate() + offsetDays);
            const end = new Date(start);
            end.setDate(end.getDate() + 3);
            dateFrom = start.toISOString().split("T")[0];
            dateTo = end.toISOString().split("T")[0];
        } else if (mode === "prev") {
            // Previous results from offset
            const end = new Date(now);
            end.setDate(end.getDate() - offsetDays);
            const start = new Date(end);
            start.setDate(start.getDate() - 3);
            dateFrom = start.toISOString().split("T")[0];
            dateTo = end.toISOString().split("T")[0];
        } else {
            // Custom: use dateFrom and dateTo from query
            dateFrom = req.query.dateFrom as string || now.toISOString().split("T")[0];
            dateTo = req.query.dateTo as string || now.toISOString().split("T")[0];
        }

        const response = await fetch(
            `${BASE_URL}/competitions/${competitions}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
            { headers: { "X-Auth-Token": API_KEY } }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Football API error:", response.status, errorText);
            return res.status(response.status).json({ error: "Failed to fetch fixtures." });
        }

        const data = await response.json();

        const matches = (data.matches || []).map((match: any) => ({
            id: match.id,
            competition: { name: match.competition?.name || "", emblem: match.competition?.emblem || "" },
            utcDate: match.utcDate,
            status: match.status,
            matchday: match.matchday,
            homeTeam: { name: match.homeTeam?.shortName || match.homeTeam?.name || "", crest: match.homeTeam?.crest || "" },
            awayTeam: { name: match.awayTeam?.shortName || match.awayTeam?.name || "", crest: match.awayTeam?.crest || "" },
            score: { home: match.score?.fullTime?.home ?? null, away: match.score?.fullTime?.away ?? null },
        }));

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

        return res.status(200).json({ competition: competitions, dateFrom, dateTo, mode, count: matches.length, matches });
    } catch (error: any) {
        console.error("Fixtures API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch fixtures." });
    }
}
