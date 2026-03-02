import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = process.env.FOOTBALL_DATA_KEY || "";
const BASE_URL = "https://api.football-data.org/v4";

function normalizeWebsiteUrl(rawUrl: string | null | undefined): string | null {
    const value = String(rawUrl || "").trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value.replace(/^http:\/\//i, "https://");
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
    return null;
}

function buildOfficialUrl(teamName: string, website: string | null | undefined): string {
    const normalized = normalizeWebsiteUrl(website);
    if (normalized) return normalized;
    return `https://www.google.com/search?q=${encodeURIComponent(`${teamName} official website`)}`;
}

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

        const [response, teamsResponse] = await Promise.all([
            fetch(
            `${BASE_URL}/competitions/${competitions}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
            { headers: { "X-Auth-Token": API_KEY } }
            ),
            fetch(
                `${BASE_URL}/competitions/${competitions}/teams`,
                { headers: { "X-Auth-Token": API_KEY } }
            ).catch(() => null),
        ]);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Football API error:", response.status, errorText);
            return res.status(response.status).json({ error: "Failed to fetch fixtures." });
        }

        const data = await response.json();
        const teamWebsiteMap = new Map<number, string | null>();

        if (teamsResponse && teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            for (const team of teamsData.teams || []) {
                teamWebsiteMap.set(team.id, normalizeWebsiteUrl(team.website));
            }
        }

        const matches = (data.matches || []).map((match: any) => ({
            id: match.id,
            competition: { name: match.competition?.name || "", emblem: match.competition?.emblem || "" },
            utcDate: match.utcDate,
            status: match.status,
            matchday: match.matchday,
            homeTeam: {
                id: match.homeTeam?.id || null,
                name: match.homeTeam?.shortName || match.homeTeam?.name || "",
                crest: match.homeTeam?.crest || "",
                officialUrl: buildOfficialUrl(
                    match.homeTeam?.shortName || match.homeTeam?.name || "Team",
                    teamWebsiteMap.get(match.homeTeam?.id) || null
                ),
            },
            awayTeam: {
                id: match.awayTeam?.id || null,
                name: match.awayTeam?.shortName || match.awayTeam?.name || "",
                crest: match.awayTeam?.crest || "",
                officialUrl: buildOfficialUrl(
                    match.awayTeam?.shortName || match.awayTeam?.name || "Team",
                    teamWebsiteMap.get(match.awayTeam?.id) || null
                ),
            },
            score: { home: match.score?.fullTime?.home ?? null, away: match.score?.fullTime?.away ?? null },
        }));

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

        return res.status(200).json({ competition: competitions, dateFrom, dateTo, mode, count: matches.length, matches });
    } catch (error: any) {
        console.error("Fixtures API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch fixtures." });
    }
}
