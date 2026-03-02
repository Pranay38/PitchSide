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

        // For Champions League, there may be multiple standings types
        // (TOTAL for league phase, plus GROUP tables)
        const allStandings = (data.standings || []).map((s: any) => ({
            type: s.type, // TOTAL, HOME, AWAY
            stage: s.stage, // LEAGUE_STAGE, GROUP_STAGE, etc.
            group: s.group || null,
            table: (s.table || []).map((entry: any) => ({
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
            })),
        }));

        // Get the main table (TOTAL type)
        const mainTable = allStandings.find((s: any) => s.type === "TOTAL")?.table || allStandings[0]?.table || [];

        // For CL knockouts: fetch matches with knockout stages
        let knockouts: any[] = [];
        if (competition === "CL") {
            try {
                const matchesRes = await fetch(
                    `${BASE_URL}/competitions/CL/matches?status=SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED`,
                    { headers: { "X-Auth-Token": API_KEY } }
                );
                if (matchesRes.ok) {
                    const matchesData = await matchesRes.json();
                    const knockoutStages = ["LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL", "ROUND_OF_16", "PLAYOFF"];
                    knockouts = (matchesData.matches || [])
                        .filter((m: any) => knockoutStages.includes(m.stage))
                        .map((m: any) => ({
                            id: m.id,
                            stage: m.stage,
                            utcDate: m.utcDate,
                            status: m.status,
                            matchday: m.matchday,
                            homeTeam: {
                                name: m.homeTeam?.shortName || m.homeTeam?.name || "",
                                crest: m.homeTeam?.crest || "",
                            },
                            awayTeam: {
                                name: m.awayTeam?.shortName || m.awayTeam?.name || "",
                                crest: m.awayTeam?.crest || "",
                            },
                            score: {
                                home: m.score?.fullTime?.home ?? null,
                                away: m.score?.fullTime?.away ?? null,
                            },
                            aggregateHome: m.score?.aggregateHome ?? null,
                            aggregateAway: m.score?.aggregateAway ?? null,
                        }));
                }
            } catch (e) {
                console.error("Failed to fetch CL knockouts:", e);
            }
        }

        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");

        return res.status(200).json({
            competition,
            table: mainTable,
            knockouts,
        });
    } catch (error: any) {
        console.error("Standings API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch standings." });
    }
}
