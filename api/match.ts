import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Uses API-Football (via RapidAPI) for rich match statistics.
 * Free tier: 100 requests/day — plenty for click-to-view stats.
 *
 * Required env var: RAPIDAPI_KEY
 * Sign up free at: https://rapidapi.com/api-sports/api/api-football
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";

// Map football-data.org competition codes to API-Football league IDs
const LEAGUE_MAP: Record<string, number> = {
    PL: 39,
    CL: 2,
    PD: 140,
    BL1: 78,
    SA: 135,
};

async function apiFootballFetch(endpoint: string) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            "x-rapidapi-key": RAPIDAPI_KEY,
            "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
    });
    if (!res.ok) throw new Error(`API-Football error: ${res.status}`);
    return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!RAPIDAPI_KEY) return res.status(500).json({ error: "RAPIDAPI_KEY not configured." });

    const homeTeam = req.query.home as string;
    const awayTeam = req.query.away as string;
    const matchDate = req.query.date as string; // YYYY-MM-DD
    const competition = req.query.competition as string || "PL";

    if (!homeTeam || !awayTeam || !matchDate) {
        return res.status(400).json({ error: "home, away, and date query params are required." });
    }

    try {
        const leagueId = LEAGUE_MAP[competition] || 39;
        const season = new Date(matchDate).getFullYear();

        // Step 1: Find the fixture by date and league
        const fixturesData = await apiFootballFetch(
            `/fixtures?date=${matchDate}&league=${leagueId}&season=${season}`
        );

        const fixtures = fixturesData.response || [];

        // Match by team names (fuzzy match — compare lowercase substrings)
        const homeLower = homeTeam.toLowerCase();
        const awayLower = awayTeam.toLowerCase();

        const match = fixtures.find((f: any) => {
            const h = (f.teams?.home?.name || "").toLowerCase();
            const a = (f.teams?.away?.name || "").toLowerCase();
            return (
                (h.includes(homeLower) || homeLower.includes(h) ||
                    h.includes(homeLower.split(" ")[0]) || homeLower.includes(h.split(" ")[0])) &&
                (a.includes(awayLower) || awayLower.includes(a) ||
                    a.includes(awayLower.split(" ")[0]) || awayLower.includes(a.split(" ")[0]))
            );
        });

        if (!match) {
            // If season guess was wrong (e.g., Jan match in previous season), try season-1
            const fixturesData2 = await apiFootballFetch(
                `/fixtures?date=${matchDate}&league=${leagueId}&season=${season - 1}`
            );
            const fixtures2 = fixturesData2.response || [];
            const match2 = fixtures2.find((f: any) => {
                const h = (f.teams?.home?.name || "").toLowerCase();
                const a = (f.teams?.away?.name || "").toLowerCase();
                return (
                    (h.includes(homeLower) || homeLower.includes(h) ||
                        h.includes(homeLower.split(" ")[0]) || homeLower.includes(h.split(" ")[0])) &&
                    (a.includes(awayLower) || awayLower.includes(a) ||
                        a.includes(awayLower.split(" ")[0]) || awayLower.includes(a.split(" ")[0]))
                );
            });

            if (!match2) {
                return res.status(404).json({ error: "Match not found." });
            }

            return await buildResponse(match2, res);
        }

        return await buildResponse(match, res);
    } catch (error: any) {
        console.error("Match API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch match details." });
    }
}

async function buildResponse(match: any, res: VercelResponse) {
    const fixtureId = match.fixture?.id;

    // Fetch statistics and events in parallel
    const [statsData, eventsData] = await Promise.all([
        apiFootballFetch(`/fixtures/statistics?fixture=${fixtureId}`),
        apiFootballFetch(`/fixtures/events?fixture=${fixtureId}`),
    ]);

    const statsResponse = statsData.response || [];
    const eventsResponse = eventsData.response || [];

    // Parse statistics
    const homeStats = statsResponse[0]?.statistics || [];
    const awayStats = statsResponse[1]?.statistics || [];

    const statMap = (stats: any[]) => {
        const map: Record<string, any> = {};
        stats.forEach((s: any) => { map[s.type] = s.value; });
        return map;
    };

    const homeStatMap = statMap(homeStats);
    const awayStatMap = statMap(awayStats);

    const statistics = [
        { label: "Possession", home: homeStatMap["Ball Possession"] || "0%", away: awayStatMap["Ball Possession"] || "0%" },
        { label: "Total Shots", home: homeStatMap["Total Shots"] ?? 0, away: awayStatMap["Total Shots"] ?? 0 },
        { label: "Shots on Target", home: homeStatMap["Shots on Goal"] ?? 0, away: awayStatMap["Shots on Goal"] ?? 0 },
        { label: "Corners", home: homeStatMap["Corner Kicks"] ?? 0, away: awayStatMap["Corner Kicks"] ?? 0 },
        { label: "Fouls", home: homeStatMap["Fouls"] ?? 0, away: awayStatMap["Fouls"] ?? 0 },
        { label: "Offsides", home: homeStatMap["Offsides"] ?? 0, away: awayStatMap["Offsides"] ?? 0 },
        { label: "Yellow Cards", home: homeStatMap["Yellow Cards"] ?? 0, away: awayStatMap["Yellow Cards"] ?? 0 },
        { label: "Red Cards", home: homeStatMap["Red Cards"] ?? 0, away: awayStatMap["Red Cards"] ?? 0 },
        { label: "Passes", home: homeStatMap["Total passes"] ?? 0, away: awayStatMap["Total passes"] ?? 0 },
        { label: "Pass Accuracy", home: homeStatMap["Passes %"] || "0%", away: awayStatMap["Passes %"] || "0%" },
    ];

    // Parse events (goals, cards, subs)
    const events = eventsResponse.map((e: any) => ({
        time: e.time?.elapsed || 0,
        extraTime: e.time?.extra || null,
        team: e.team?.name || "",
        teamLogo: e.team?.logo || "",
        player: e.player?.name || "",
        assist: e.assist?.name || null,
        type: e.type || "", // Goal, Card, subst, Var
        detail: e.detail || "", // Normal Goal, Penalty, Own Goal, Yellow Card, Red Card, Substitution 1, etc.
    }));

    const result = {
        fixture: {
            id: fixtureId,
            date: match.fixture?.date || "",
            venue: match.fixture?.venue?.name || null,
            city: match.fixture?.venue?.city || null,
            referee: match.fixture?.referee || null,
            status: match.fixture?.status?.long || "",
        },
        homeTeam: {
            name: match.teams?.home?.name || "",
            logo: match.teams?.home?.logo || "",
        },
        awayTeam: {
            name: match.teams?.away?.name || "",
            logo: match.teams?.away?.logo || "",
        },
        score: {
            home: match.goals?.home ?? null,
            away: match.goals?.away ?? null,
            halfTime: {
                home: match.score?.halftime?.home ?? null,
                away: match.score?.halftime?.away ?? null,
            },
            fullTime: {
                home: match.score?.fulltime?.home ?? null,
                away: match.score?.fulltime?.away ?? null,
            },
            extraTime: {
                home: match.score?.extratime?.home ?? null,
                away: match.score?.extratime?.away ?? null,
            },
            penalty: {
                home: match.score?.penalty?.home ?? null,
                away: match.score?.penalty?.away ?? null,
            },
        },
        statistics,
        events,
    };

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200");
    return res.status(200).json(result);
}
