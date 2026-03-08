import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security.js";

const API_KEY = process.env.FOOTBALL_DATA_KEY || "";
const BASE_URL = "https://api.football-data.org/v4";

/** Map of URL slugs to football-data.org competition codes */
const LEAGUE_MAP: Record<string, string> = {
    "premier-league": "PL",
    "la-liga": "PD",
    "bundesliga": "BL1",
    "serie-a": "SA",
    "ligue-1": "FL1",
    "champions-league": "CL",
};

async function fetchJSON(url: string) {
    const res = await fetch(url, {
        headers: { "X-Auth-Token": API_KEY },
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!API_KEY) return res.status(500).json({ error: "FOOTBALL_DATA_KEY not configured." });

    try {
        const leagueSlug = (req.query.league as string || "").toLowerCase();
        const clubSlug = (req.query.club as string || "").toLowerCase();
        const season = req.query.season as string || "";

        const competitionCode = LEAGUE_MAP[leagueSlug];
        if (!competitionCode) {
            return res.status(400).json({
                error: "Unknown league",
                available: Object.keys(LEAGUE_MAP),
            });
        }

        // Fetch standings
        const standingsData = await fetchJSON(
            `${BASE_URL}/competitions/${competitionCode}/standings`
        );
        const mainTable = standingsData.standings?.find((s: any) => s.type === "TOTAL")?.table || [];

        // Find the club in the standings
        const clubEntry = mainTable.find((entry: any) => {
            const name = (entry.team?.name || entry.team?.shortName || "").toLowerCase();
            const shortName = (entry.team?.shortName || "").toLowerCase();
            const tla = (entry.team?.tla || "").toLowerCase();
            return (
                name.includes(clubSlug.replace(/-/g, " ")) ||
                shortName.includes(clubSlug.replace(/-/g, " ")) ||
                tla === clubSlug.replace(/-/g, "")
            );
        });

        // Fetch top scorers
        const scorersData = await fetchJSON(
            `${BASE_URL}/competitions/${competitionCode}/scorers`
        );
        const allScorers = (scorersData.scorers || []).slice(0, 20).map((entry: any, idx: number) => ({
            rank: idx + 1,
            player: entry.player?.name || "Unknown",
            team: entry.team?.shortName || entry.team?.name || "Unknown",
            teamCrest: entry.team?.crest || "",
            goals: entry.goals ?? 0,
            assists: entry.assists ?? null,
            nationality: entry.player?.nationality || null,
        }));

        // Filter scorers for this club if a club is specified and found
        const clubScorers = clubEntry
            ? allScorers.filter((s: any) =>
                s.team.toLowerCase().includes(clubSlug.replace(/-/g, " ")) ||
                clubEntry.team?.shortName?.toLowerCase() === s.team.toLowerCase()
            )
            : [];

        // Build table with position highlighting
        const table = mainTable.map((entry: any) => ({
            position: entry.position,
            team: entry.team?.shortName || entry.team?.name || "",
            crest: entry.team?.crest || "",
            played: entry.playedGames,
            won: entry.won,
            draw: entry.draw,
            lost: entry.lost,
            gf: entry.goalsFor,
            ga: entry.goalsAgainst,
            gd: entry.goalDifference,
            points: entry.points,
            isTarget: !!clubEntry && (entry.team?.name === clubEntry.team?.name),
        }));

        // Build response
        const result: any = {
            league: leagueSlug,
            leagueName: standingsData.competition?.name || leagueSlug,
            leagueEmblem: standingsData.competition?.emblem || "",
            season: season || standingsData.season?.startDate?.slice(0, 4) + "-" + String(Number(standingsData.season?.startDate?.slice(0, 4)) + 1).slice(2),
            table,
            topScorers: allScorers.slice(0, 10),
        };

        if (clubEntry) {
            result.club = {
                name: clubEntry.team?.name || clubEntry.team?.shortName || "",
                shortName: clubEntry.team?.shortName || "",
                crest: clubEntry.team?.crest || "",
                position: clubEntry.position,
                played: clubEntry.playedGames,
                won: clubEntry.won,
                draw: clubEntry.draw,
                lost: clubEntry.lost,
                gf: clubEntry.goalsFor,
                ga: clubEntry.goalsAgainst,
                gd: clubEntry.goalDifference,
                points: clubEntry.points,
            };
            result.clubScorers = clubScorers;
        }

        res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=1800");
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("Club Season API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch data." });
    }
}
