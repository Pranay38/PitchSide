import type { VercelRequest, VercelResponse } from "@vercel/node";

const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY || "";
const FPL_API = "https://fantasy.premierleague.com/api";

interface MatchResult {
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    competition: string;
    matchday: number;
    utcDate: string;
    homeCrest: string;
    awayCrest: string;
}

interface TopPerformer {
    name: string;
    team: string;
    position: string;
    gwPoints: number;
    totalPoints: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    bonus: number;
    minutes: number;
}

interface StandingsEntry {
    position: number;
    team: string;
    crest: string;
    playedGames: number;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalDifference: number;
    form: string;
    league: string;
}

interface DigestData {
    weekLabel: string;
    gameweek: number;
    results: MatchResult[];
    topPerformers: TopPerformer[];
    standings: StandingsEntry[];
    generatedAt: string;
}

// Get the date range for the past week (Monday to Sunday)
function getWeekRange(): { from: string; to: string; label: string } {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...

    // Find last Monday
    const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - daysBack);
    monday.setUTCHours(0, 0, 0, 0);

    // Find next Sunday (or today if Sunday)
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 0);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const fmtLabel = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    return {
        from: fmt(monday),
        to: fmt(sunday),
        label: `${fmtLabel(monday)} – ${fmtLabel(sunday)}`,
    };
}

async function fetchWeekendResults(from: string, to: string): Promise<MatchResult[]> {
    if (!FOOTBALL_DATA_KEY) return [];

    const competitions = ["PL", "CL", "PD", "SA", "BL1", "FL1"]; // PL, UCL, La Liga, Serie A, Bundesliga, Ligue 1
    const allResults: MatchResult[] = [];

    for (const comp of competitions) {
        try {
            const url = `https://api.football-data.org/v4/competitions/${comp}/matches?dateFrom=${from}&dateTo=${to}&status=FINISHED`;
            const res = await fetch(url, {
                headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) continue;
            const data = await res.json();

            const compName = comp === "PL" ? "Premier League"
                : comp === "CL" ? "Champions League"
                    : comp === "PD" ? "La Liga"
                        : comp === "SA" ? "Serie A"
                            : comp === "BL1" ? "Bundesliga"
                                : "Ligue 1";

            for (const m of data.matches || []) {
                allResults.push({
                    homeTeam: m.homeTeam?.shortName || m.homeTeam?.name || "Home",
                    awayTeam: m.awayTeam?.shortName || m.awayTeam?.name || "Away",
                    homeScore: m.score?.fullTime?.home ?? null,
                    awayScore: m.score?.fullTime?.away ?? null,
                    status: m.status,
                    competition: compName,
                    matchday: m.matchday || 0,
                    utcDate: m.utcDate,
                    homeCrest: m.homeTeam?.crest || "",
                    awayCrest: m.awayTeam?.crest || "",
                });
            }
        } catch {
            // Skip failed competition
        }
    }

    // Sort by date
    allResults.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
    return allResults;
}

async function fetchTopPerformers(): Promise<{ performers: TopPerformer[]; gameweek: number }> {
    try {
        // Get current gameweek
        const eventsRes = await fetch(`${FPL_API}/bootstrap-static/`, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)" },
            signal: AbortSignal.timeout(5000),
        });
        if (!eventsRes.ok) return { performers: [], gameweek: 0 };
        const data = await eventsRes.json();

        const currentGw = data.events?.find((e: any) => e.is_current)?.id || 0;
        if (!currentGw) return { performers: [], gameweek: 0 };

        const elementTypes: Record<number, string> = {};
        for (const et of data.element_types || []) {
            elementTypes[et.id] = et.singular_name_short;
        }
        const teams: Record<number, string> = {};
        for (const t of data.teams || []) {
            teams[t.id] = t.short_name;
        }

        // Get GW live data
        const liveRes = await fetch(`${FPL_API}/event/${currentGw}/live/`, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)" },
            signal: AbortSignal.timeout(5000),
        });
        if (!liveRes.ok) return { performers: [], gameweek: currentGw };
        const liveData = await liveRes.json();

        // Map live stats to player info
        const performers: TopPerformer[] = [];
        for (const el of liveData.elements || []) {
            const stats = el.stats;
            if (!stats || stats.minutes === 0) continue;

            const playerInfo = data.elements?.find((p: any) => p.id === el.id);
            if (!playerInfo) continue;

            performers.push({
                name: playerInfo.web_name,
                team: teams[playerInfo.team] || "Unknown",
                position: elementTypes[playerInfo.element_type] || "???",
                gwPoints: stats.total_points,
                totalPoints: playerInfo.total_points,
                goals: stats.goals_scored || 0,
                assists: stats.assists || 0,
                cleanSheets: stats.clean_sheets || 0,
                bonus: stats.bonus || 0,
                minutes: stats.minutes || 0,
            });
        }

        // Sort by gameweek points
        performers.sort((a, b) => b.gwPoints - a.gwPoints);
        return { performers: performers.slice(0, 10), gameweek: currentGw };
    } catch {
        return { performers: [], gameweek: 0 };
    }
}

async function fetchStandings(): Promise<StandingsEntry[]> {
    if (!FOOTBALL_DATA_KEY) return [];

    const leagues = [
        { code: "PL", name: "Premier League" },
        { code: "PD", name: "La Liga" },
        { code: "SA", name: "Serie A" },
        { code: "BL1", name: "Bundesliga" },
        { code: "FL1", name: "Ligue 1" },
    ];
    const allStandings: StandingsEntry[] = [];

    for (const league of leagues) {
        try {
            const res = await fetch(`https://api.football-data.org/v4/competitions/${league.code}/standings`, {
                headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) continue;
            const data = await res.json();

            const table = data.standings?.[0]?.table || [];
            // Only take top 6 per league for the digest
            for (const t of table.slice(0, 6)) {
                allStandings.push({
                    position: t.position,
                    team: t.team?.shortName || t.team?.name || "Team",
                    crest: t.team?.crest || "",
                    playedGames: t.playedGames,
                    won: t.won,
                    draw: t.draw,
                    lost: t.lost,
                    points: t.points,
                    goalDifference: t.goalDifference,
                    form: t.form || "",
                    league: league.name,
                });
            }
        } catch {
            // Skip failed league
        }
    }
    return allStandings;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        const { from, to, label } = getWeekRange();

        const [results, { performers, gameweek }, standings] = await Promise.all([
            fetchWeekendResults(from, to),
            fetchTopPerformers(),
            fetchStandings(),
        ]);

        const digest: DigestData = {
            weekLabel: label,
            gameweek,
            results,
            topPerformers: performers,
            standings,
            generatedAt: new Date().toISOString(),
        };

        res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
        return res.status(200).json(digest);
    } catch (error: any) {
        console.error("Weekly Digest Error:", error);
        return res.status(500).json({ error: "Failed to generate digest." });
    }
}
