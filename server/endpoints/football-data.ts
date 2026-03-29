import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * /api/football-data — Proxy to football-data.org REST API.
 *
 * Endpoints:
 *   GET ?type=standings&league=PL        → Premier League standings
 *   GET ?type=standings&league=PD        → La Liga standings
 *   GET ?type=standings&league=SA        → Serie A standings
 *   GET ?type=matches&league=PL          → Current matchday matches
 *   GET ?type=matches&league=PL&status=LIVE  → Live matches only
 *
 * Free tier: 10 requests/min. We cache responses for 5 minutes.
 *
 * League codes: PL (Premier League), PD (La Liga), SA (Serie A),
 * BL1 (Bundesliga), FL1 (Ligue 1), CL (Champions League), etc.
 */

const API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_KEY || process.env.FOOTBALL_DATA_API_KEY || "";

const ALLOWED_LEAGUES = new Set([
  "PL", "PD", "SA", "BL1", "FL1", "CL", "ELC", "PPL", "DED", "BSA", "EC", "WC",
]);

async function fetchFootballData(path: string) {
  if (!API_KEY) {
    throw new Error("FOOTBALL_DATA_API_KEY not configured");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-Auth-Token": API_KEY },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`football-data.org ${res.status}: ${text}`);
  }

  return res.json();
}

export default async function footballDataHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const type = req.query.type as string;
  const league = (req.query.league as string || "PL").toUpperCase();
  const status = req.query.status as string | undefined;

  if (!ALLOWED_LEAGUES.has(league)) {
    return res.status(400).json({ error: `Invalid league code: ${league}` });
  }

  try {
    let data: any;

    switch (type) {
      case "standings": {
        const raw = await fetchFootballData(`/competitions/${league}/standings`);
        // Flatten to just the TOTAL table
        const table = raw.standings?.find((s: any) => s.type === "TOTAL")?.table || [];
        data = {
          competition: raw.competition?.name,
          season: raw.season,
          standings: table.map((row: any) => ({
            position: row.position,
            team: {
              id: row.team.id,
              name: row.team.name,
              shortName: row.team.shortName,
              crest: row.team.crest,
            },
            playedGames: row.playedGames,
            won: row.won,
            draw: row.draw,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            goalDifference: row.goalDifference,
            points: row.points,
            form: row.form,
          })),
        };
        break;
      }

      case "matches": {
        const params = status ? `?status=${status}` : "";
        const raw = await fetchFootballData(`/competitions/${league}/matches${params}`);
        data = {
          competition: raw.competition?.name,
          matches: (raw.matches || []).slice(0, 30).map((m: any) => ({
            id: m.id,
            status: m.status,
            matchday: m.matchday,
            utcDate: m.utcDate,
            homeTeam: {
              id: m.homeTeam.id,
              name: m.homeTeam.name,
              shortName: m.homeTeam.shortName,
              crest: m.homeTeam.crest,
            },
            awayTeam: {
              id: m.awayTeam.id,
              name: m.awayTeam.name,
              shortName: m.awayTeam.shortName,
              crest: m.awayTeam.crest,
            },
            score: m.score,
          })),
        };
        break;
      }

      default:
        return res.status(400).json({
          error: "Invalid type. Use 'standings' or 'matches'.",
        });
    }

    // Cache for 5 minutes at edge, 30 min stale-while-revalidate
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
    return res.json(data);
  } catch (err: any) {
    console.error("football-data.org API error:", err.message);

    if (err.message.includes("not configured")) {
      return res.status(503).json({ error: "Football data API key not configured" });
    }

    return res.status(502).json({ error: "Failed to fetch football data" });
  }
}
