import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = process.env.FOOTBALL_DATA_KEY || "";
const BASE_URL = "https://api.football-data.org/v4";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!API_KEY) {
        return res.status(500).json({ error: "FOOTBALL_DATA_KEY not configured." });
    }

    try {
        // Get dates: 3 days in the past (results) to 3 days ahead (fixtures)
        const today = new Date();
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - 3);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + 3);

        const dateFrom = pastDate.toISOString().split("T")[0];
        const dateTo = futureDate.toISOString().split("T")[0];

        // Fetch matches from football-data.org
        // Competitions: PL (Premier League), CL (Champions League), PD (La Liga), BL1 (Bundesliga), SA (Serie A)
        const competitions = req.query.competition as string || "PL";

        const response = await fetch(
            `${BASE_URL}/competitions/${competitions}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
            {
                headers: {
                    "X-Auth-Token": API_KEY,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Football API error:", response.status, errorText);
            return res.status(response.status).json({ error: "Failed to fetch fixtures." });
        }

        const data = await response.json();

        // Transform the response to a simpler format
        const matches = (data.matches || []).map((match: any) => ({
            id: match.id,
            competition: {
                name: match.competition?.name || "",
                emblem: match.competition?.emblem || "",
            },
            utcDate: match.utcDate,
            status: match.status, // SCHEDULED, LIVE, IN_PLAY, PAUSED, FINISHED, POSTPONED, etc.
            matchday: match.matchday,
            homeTeam: {
                name: match.homeTeam?.shortName || match.homeTeam?.name || "",
                crest: match.homeTeam?.crest || "",
            },
            awayTeam: {
                name: match.awayTeam?.shortName || match.awayTeam?.name || "",
                crest: match.awayTeam?.crest || "",
            },
            score: {
                home: match.score?.fullTime?.home ?? null,
                away: match.score?.fullTime?.away ?? null,
            },
        }));

        // Cache for 5 minutes
        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

        return res.status(200).json({
            competition: competitions,
            dateFrom,
            dateTo,
            count: matches.length,
            matches,
        });
    } catch (error: any) {
        console.error("Fixtures API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch fixtures." });
    }
}
