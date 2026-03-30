import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = process.env.FOOTBALL_DATA_KEY || "";
const BASE_URL = "https://api.football-data.org/v4";
const TEAM_ALIASES: Record<string, string[]> = {
    "manchester united": ["man united", "man utd", "manchester utd"],
    "manchester city": ["man city"],
    "tottenham hotspur": ["tottenham", "spurs"],
    "newcastle united": ["newcastle", "newcastle utd"],
    "west ham united": ["west ham", "west ham utd"],
    "paris saint germain": ["paris saint-germain", "paris sg", "psg"],
    "atletico madrid": ["atleti", "atl madrid", "atletico de madrid", "atletico"],
    "inter milan": ["inter", "internazionale", "internazionale milano", "fc internazionale milano"],
    "ac milan": ["milan", "acm"],
    "bayern munich": ["bayern", "bayern munchen", "fc bayern", "fc bayern munchen"],
    "barcelona": ["fc barcelona", "barca"],
    "real madrid": ["real madrid cf"],
    "borussia dortmund": ["dortmund", "bvb"],
    "rb leipzig": ["leipzig", "rasenballsport leipzig"],
    "juventus": ["juve"],
    "marseille": ["olympique de marseille", "om"],
    "lyon": ["olympique lyonnais", "ol"],
};
const TOKEN_REPLACEMENTS: Record<string, string[]> = {
    utd: ["united"],
    man: ["manchester"],
    sg: ["saint", "germain"],
    psg: ["paris", "saint", "germain"],
    munchen: ["munich"],
    muenchen: ["munich"],
    internazionale: ["inter"],
    acm: ["ac", "milan"],
    bvb: ["borussia", "dortmund"],
    om: ["marseille"],
    ol: ["lyon"],
    barca: ["barcelona"],
    juve: ["juventus"],
    atleti: ["atletico", "madrid"],
};

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

function normalizeTeamName(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/\b(fc|cf)\b/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function expandTeamTokens(value: string): string {
    const normalized = normalizeTeamName(value);
    const expandedTokens = normalized
        .split(" ")
        .flatMap((token) => TOKEN_REPLACEMENTS[token] || [token]);

    return expandedTokens.join(" ").trim().replace(/\s+/g, " ");
}

function canonicalTeamName(value: string): string {
    const normalized = expandTeamTokens(value);
    const canonicalEntry = Object.entries(TEAM_ALIASES).find(([canonical, aliases]) => {
        const allNames = [canonical, ...aliases].map(expandTeamTokens);
        return allNames.includes(normalized);
    });

    return canonicalEntry ? expandTeamTokens(canonicalEntry[0]) : normalized;
}

function teamTokens(value: string): string[] {
    return canonicalTeamName(value)
        .split(" ")
        .filter(Boolean);
}

function teamsMatch(left: string, right: string): boolean {
    const normalizedLeft = canonicalTeamName(left);
    const normalizedRight = canonicalTeamName(right);
    const leftTokens = teamTokens(left);
    const rightTokens = teamTokens(right);
    const shorterTokens = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens;
    const longerTokenSet = new Set(leftTokens.length <= rightTokens.length ? rightTokens : leftTokens);
    const shorterTokenMatch =
        shorterTokens.length > 0 && shorterTokens.every((token) => longerTokenSet.has(token));

    return (
        normalizedLeft === normalizedRight ||
        normalizedLeft.includes(normalizedRight) ||
        normalizedRight.includes(normalizedLeft) ||
        shorterTokenMatch
    );
}

function collectTeamNames(team: any): string[] {
    return [team?.name, team?.shortName, team?.tla]
        .map((value) => String(value || "").trim())
        .filter(Boolean);
}

function getTeamMatchScore(team: any, teamQuery: string): number {
    if (!teamQuery) return 0;

    const canonicalQuery = canonicalTeamName(teamQuery);
    const queryTokens = teamTokens(teamQuery);

    return collectTeamNames(team).reduce((bestScore, candidate) => {
        const normalizedCandidate = canonicalTeamName(candidate);
        const candidateTokens = teamTokens(candidate);
        const overlap = queryTokens.filter((token) => candidateTokens.includes(token)).length;

        if (normalizedCandidate === canonicalQuery) {
            return Math.max(bestScore, 100 + overlap);
        }

        if (teamsMatch(candidate, teamQuery)) {
            return Math.max(bestScore, 60 + overlap);
        }

        return bestScore;
    }, 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    if (!API_KEY) return res.status(500).json({ error: "FOOTBALL_DATA_KEY not configured." });

    try {
        const competitions = String(req.query.competition || "PL")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        const teamQuery = String(req.query.team || "").trim();

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

        const competitionPayloads = await Promise.all(
            competitions.map(async (competitionCode) => {
                const [response, teamsResponse] = await Promise.all([
                    fetch(
                        `${BASE_URL}/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
                        { headers: { "X-Auth-Token": API_KEY } }
                    ),
                    fetch(
                        `${BASE_URL}/competitions/${competitionCode}/teams`,
                        { headers: { "X-Auth-Token": API_KEY } }
                    ).catch(() => null),
                ]);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Football API error:", response.status, errorText);
                    throw new Error(`Failed to fetch fixtures for ${competitionCode}.`);
                }

                const data = await response.json();
                const teamsData = teamsResponse && teamsResponse.ok ? await teamsResponse.json() : { teams: [] };

                return {
                    competitionCode,
                    matches: Array.isArray(data.matches) ? data.matches : [],
                    teams: Array.isArray(teamsData.teams) ? teamsData.teams : [],
                };
            })
        );

        const teamWebsiteMap = new Map<number, string | null>();
        let resolvedTeamId: number | null = null;
        let resolvedTeamScore = 0;
        const rawMatches = competitionPayloads.flatMap((payload) => payload.matches);

        for (const payload of competitionPayloads) {
            for (const team of payload.teams) {
                teamWebsiteMap.set(team.id, normalizeWebsiteUrl(team.website));
                if (teamQuery) {
                    const score = getTeamMatchScore(team, teamQuery);
                    if (score > resolvedTeamScore) {
                        resolvedTeamScore = score;
                        resolvedTeamId = team.id;
                    }
                }
            }
        }

        const dedupedMatches = Array.from(
            new Map(rawMatches.map((match: any) => [match.id, match])).values()
        );

        const matches = dedupedMatches
            .filter((match: any) => {
                if (!teamQuery) return true;
                if (resolvedTeamId !== null) {
                    return resolvedTeamId === match.homeTeam?.id || resolvedTeamId === match.awayTeam?.id;
                }

                return collectTeamNames(match.homeTeam).some((candidate) => teamsMatch(candidate, teamQuery))
                    || collectTeamNames(match.awayTeam).some((candidate) => teamsMatch(candidate, teamQuery));
            })
            .map((match: any) => ({
            id: match.id,
            competition: { name: match.competition?.name || "", emblem: match.competition?.emblem || "" },
            utcDate: match.utcDate,
            status: match.status,
            matchday: match.matchday,
            homeTeam: {
                id: match.homeTeam?.id || null,
                name: match.homeTeam?.shortName || match.homeTeam?.name || "",
                shortName: match.homeTeam?.shortName || "",
                fullName: match.homeTeam?.name || "",
                tla: match.homeTeam?.tla || "",
                crest: match.homeTeam?.crest || "",
                officialUrl: buildOfficialUrl(
                    match.homeTeam?.shortName || match.homeTeam?.name || "Team",
                    teamWebsiteMap.get(match.homeTeam?.id) || null
                ),
            },
            awayTeam: {
                id: match.awayTeam?.id || null,
                name: match.awayTeam?.shortName || match.awayTeam?.name || "",
                shortName: match.awayTeam?.shortName || "",
                fullName: match.awayTeam?.name || "",
                tla: match.awayTeam?.tla || "",
                crest: match.awayTeam?.crest || "",
                officialUrl: buildOfficialUrl(
                    match.awayTeam?.shortName || match.awayTeam?.name || "Team",
                    teamWebsiteMap.get(match.awayTeam?.id) || null
                ),
            },
            score: { home: match.score?.fullTime?.home ?? null, away: match.score?.fullTime?.away ?? null },
        }));

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

        return res.status(200).json({ competition: competitions.join(","), dateFrom, dateTo, mode, count: matches.length, matches });
    } catch (error: any) {
        console.error("Fixtures API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch fixtures." });
    }
}
