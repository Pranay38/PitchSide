import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Match detail endpoint.
 * Strategy:
 * 1. Always fetch basic match data from football-data.org
 * 2. If RAPIDAPI_KEY is set, try API-Football for fixture metadata and score confirmation
 * 3. Return a reliable score-first payload without pretending richer timeline data exists
 */

const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY || "";
const APIFOOTBALL_KEY = process.env.RAPIDAPI_KEY || "";
const FD_BASE = "https://api.football-data.org/v4";
const AF_BASE = "https://v3.football.api-sports.io";

const LEAGUE_MAP: Record<string, number> = { PL: 39, CL: 2, PD: 140, BL1: 78, SA: 135 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const matchId = req.query.id as string;
    const homeTeam = req.query.home as string;
    const awayTeam = req.query.away as string;
    const matchDate = req.query.date as string;
    const competition = req.query.competition as string || "PL";

    try {
        let result: any = null;

        // Strategy 1: Use football-data.org match ID if provided
        if (matchId && FOOTBALL_DATA_KEY) {
            const fdRes = await fetch(`${FD_BASE}/matches/${matchId}`, {
                headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
            });

            if (fdRes.ok) {
                const m = await fdRes.json();
                result = {
                    fixture: {
                        venue: m.venue || null,
                        city: null,
                        referee: m.referees?.[0]?.name || null,
                    },
                    homeTeam: { name: m.homeTeam?.shortName || m.homeTeam?.name || "", logo: m.homeTeam?.crest || "" },
                    awayTeam: { name: m.awayTeam?.shortName || m.awayTeam?.name || "", logo: m.awayTeam?.crest || "" },
                    score: {
                        home: m.score?.fullTime?.home ?? null,
                        away: m.score?.fullTime?.away ?? null,
                        halfTime: { home: m.score?.halfTime?.home ?? null, away: m.score?.halfTime?.away ?? null },
                        fullTime: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
                        extraTime: { home: m.score?.extraTime?.home ?? null, away: m.score?.extraTime?.away ?? null },
                        penalty: { home: m.score?.penalties?.home ?? null, away: m.score?.penalties?.away ?? null },
                    },
                };
            }
        }

        // Strategy 2: Try API-Football for fixture metadata if key available
        if (APIFOOTBALL_KEY && homeTeam && awayTeam && matchDate) {
            try {
                const leagueId = LEAGUE_MAP[competition] || 39;
                const matchDateObj = new Date(matchDate);
                const month = matchDateObj.getMonth();
                const year = matchDateObj.getFullYear();
                const season = month < 7 ? year - 1 : year;

                const afRes = await fetch(
                    `${AF_BASE}/fixtures?date=${matchDate}&league=${leagueId}&season=${season}`,
                    { headers: { "x-apisports-key": APIFOOTBALL_KEY } }
                );

                if (afRes.ok) {
                    const afData = await afRes.json();
                    const fixtures = afData.response || [];

                    // Fuzzy match teams
                    const hl = homeTeam.toLowerCase();
                    const al = awayTeam.toLowerCase();
                    const afMatch = fixtures.find((f: any) => {
                        const h = (f.teams?.home?.name || "").toLowerCase();
                        const a = (f.teams?.away?.name || "").toLowerCase();
                        return (h.includes(hl.split(" ")[0]) || hl.includes(h.split(" ")[0])) &&
                            (a.includes(al.split(" ")[0]) || al.includes(a.split(" ")[0]));
                    });

                    if (afMatch) {
                        // Build or enhance result with API-Football fixture data
                        result = {
                            fixture: {
                                venue: afMatch.fixture?.venue?.name || result?.fixture?.venue || null,
                                city: afMatch.fixture?.venue?.city || null,
                                referee: afMatch.fixture?.referee || result?.fixture?.referee || null,
                            },
                            homeTeam: { name: afMatch.teams?.home?.name || "", logo: afMatch.teams?.home?.logo || "" },
                            awayTeam: { name: afMatch.teams?.away?.name || "", logo: afMatch.teams?.away?.logo || "" },
                            score: {
                                home: afMatch.goals?.home ?? null, away: afMatch.goals?.away ?? null,
                                halfTime: { home: afMatch.score?.halftime?.home ?? null, away: afMatch.score?.halftime?.away ?? null },
                                fullTime: { home: afMatch.score?.fulltime?.home ?? null, away: afMatch.score?.fulltime?.away ?? null },
                                extraTime: { home: afMatch.score?.extratime?.home ?? null, away: afMatch.score?.extratime?.away ?? null },
                                penalty: { home: afMatch.score?.penalty?.home ?? null, away: afMatch.score?.penalty?.away ?? null },
                            },
                        };
                    }
                }
            } catch (e) {
                console.error("API-Football fallback failed:", e);
                // Continue with football-data.org result if available
            }
        }

        if (!result) {
            return res.status(404).json({ error: "Match not found. Check that FOOTBALL_DATA_KEY is configured." });
        }

        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("Match API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch match." });
    }
}
