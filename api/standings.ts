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
        const competition = req.query.competition as string || "PL";

        const response = await fetch(
            `${BASE_URL}/competitions/${competition}/standings`,
            { headers: { "X-Auth-Token": API_KEY } }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Standings API error:", response.status, errorText);
            return res.status(response.status).json({ error: "Failed to fetch standings." });
        }

        const data = await response.json();

        // Get the total standings (first table)
        const standing = data.standings?.find((s: any) => s.type === "TOTAL") || data.standings?.[0];

        if (!standing) {
            return res.status(200).json({ competition: competition, table: [] });
        }

        const table = standing.table.map((entry: any) => ({
            position: entry.position,
            team: {
                name: entry.team?.shortName || entry.team?.name || "",
                crest: entry.team?.crest || "",
            },
            played: entry.playedGames,
            won: entry.won,
            draw: entry.draw,
            lost: entry.lost,
            gf: entry.goalsFor,
            ga: entry.goalsAgainst,
            gd: entry.goalDifference,
            points: entry.points,
        }));

        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");

        return res.status(200).json({ competition, table });
    } catch (error: any) {
        console.error("Standings API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch standings." });
    }
}
