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

    const matchId = req.query.id as string;
    if (!matchId) return res.status(400).json({ error: "Match ID is required." });

    try {
        const response = await fetch(
            `${BASE_URL}/matches/${matchId}`,
            { headers: { "X-Auth-Token": API_KEY } }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Match API error:", response.status, errorText);
            return res.status(response.status).json({ error: "Failed to fetch match details." });
        }

        const m = await response.json();

        const result = {
            id: m.id,
            competition: { name: m.competition?.name || "", emblem: m.competition?.emblem || "" },
            utcDate: m.utcDate,
            status: m.status,
            matchday: m.matchday,
            stage: m.stage || null,
            homeTeam: {
                name: m.homeTeam?.shortName || m.homeTeam?.name || "",
                crest: m.homeTeam?.crest || "",
            },
            awayTeam: {
                name: m.awayTeam?.shortName || m.awayTeam?.name || "",
                crest: m.awayTeam?.crest || "",
            },
            score: {
                halfTime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null },
                fullTime: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
                extraTime: { home: m.score?.extraTime?.home ?? null, away: m.score?.extraTime?.away ?? null },
                penalties: { home: m.score?.penalties?.home ?? null, away: m.score?.penalties?.away ?? null },
            },
            goals: (m.goals || []).map((g: any) => ({
                minute: g.minute,
                extraTime: g.injuryTime || null,
                team: g.team?.name || "",
                scorer: g.scorer?.name || "Unknown",
                assist: g.assist?.name || null,
                type: g.type || "REGULAR", // REGULAR, OWN, PENALTY
            })),
            bookings: (m.bookings || []).map((b: any) => ({
                minute: b.minute,
                team: b.team?.name || "",
                player: b.player?.name || "Unknown",
                card: b.card || "YELLOW_CARD",
            })),
            substitutions: (m.substitutions || []).map((s: any) => ({
                minute: s.minute,
                team: s.team?.name || "",
                playerIn: s.playerIn?.name || "",
                playerOut: s.playerOut?.name || "",
            })),
            referee: m.referees?.[0]?.name || null,
            venue: m.venue || null,
        };

        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("Match API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch match." });
    }
}
