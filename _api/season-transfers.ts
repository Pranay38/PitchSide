import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

interface TransferRecord {
    player: string;
    from: string;
    to: string;
    fee: string;
    window?: string;
    window_type?: WindowType;
    season?: string;
    tm_url?: string;
    performance?: string;
    fpl_id?: number;
}

interface TransferCachePayload {
    transfers?: TransferRecord[];
}

interface FplElement {
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    team: number;
    element_type: number;
    starts: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    total_points: number;
    form: string;
}

interface UnderstatPlayer {
    player_name: string;
    team_title: string;
    games: string;
    time: string;
    goals: string;
    assists: string;
    xG: string;
    xA: string;
    position: string;
}

type WindowType = "summer" | "winter";

interface TransferStats {
    available: boolean;
    summary: string;
    league?: string;
    team?: string;
    position?: string;
    starts?: number;
    minutes?: number;
    goals?: number;
    assists?: number;
    cleanSheets?: number;
    points?: number;
    form?: number;
}

interface TransferResponseItem {
    player: string;
    from: string;
    to: string;
    fee: string;
    window: string;
    windowType: WindowType;
    tm_url: string | null;
    stats: TransferStats;
}

interface TransfersPayload {
    season: string;
    generatedAt: string;
    totals: {
        all: number;
        summer: number;
        winter: number;
        withLiveStats: number;
    };
    windows: {
        summer: TransferResponseItem[];
        winter: TransferResponseItem[];
    };
}

const TRANSFERMARKT_SEARCH = "https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=";

function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function buildTransfermarktSearchUrl(query: string): string {
    return `${TRANSFERMARKT_SEARCH}${encodeURIComponent(query)}`;
}

function getCurrentSeasonLabel(now: Date = new Date()): string {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const startYear = month >= 6 ? year : year - 1;
    const endShort = String((startYear + 1) % 100).padStart(2, "0");
    return `${startYear}/${endShort}`;
}

function getSeasonFromWindow(windowLabel: string | undefined): string | null {
    if (!windowLabel) return null;

    const seasonMatch = windowLabel.match(/(\d{4})\/(\d{2})/);
    if (seasonMatch) return `${seasonMatch[1]}/${seasonMatch[2]}`;

    const summerMatch = windowLabel.match(/summer\s+(\d{4})/i);
    if (summerMatch) {
        const startYear = Number.parseInt(summerMatch[1], 10);
        return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
    }

    const winterMatch = windowLabel.match(/winter\s+(\d{4})/i);
    if (winterMatch) {
        const startYear = Number.parseInt(winterMatch[1], 10) - 1;
        return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
    }

    return null;
}

function getSeasonStartYear(season: string | null): number {
    if (!season) return -1;
    const startYear = Number.parseInt(season.split("/")[0], 10);
    return Number.isFinite(startYear) ? startYear : -1;
}

function parseKnownDate(raw: string | undefined): Date | null {
    if (!raw) return null;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const slashDate = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashDate) {
        const month = Number.parseInt(slashDate[1], 10);
        const day = Number.parseInt(slashDate[2], 10);
        const year = Number.parseInt(slashDate[3], 10);
        const alt = new Date(Date.UTC(year, month - 1, day));
        if (!Number.isNaN(alt.getTime())) return alt;
    }

    return null;
}

function classifyWindow(transfer: TransferRecord, seasonStartYear: number): WindowType {
    if (transfer.window_type === "summer" || transfer.window_type === "winter") {
        return transfer.window_type;
    }

    const text = (transfer.window || "").toLowerCase();
    if (text.includes("summer")) return "summer";
    if (text.includes("winter")) return "winter";

    const date = parseKnownDate(transfer.window);
    if (date) {
        const month = date.getUTCMonth(); // Jan = 0
        if (month <= 2) return "winter";
        if (month >= 5 && month <= 10) return "summer";
        return date.getUTCFullYear() > seasonStartYear ? "winter" : "summer";
    }

    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) {
        const year = Number.parseInt(yearMatch[1], 10);
        return year > seasonStartYear ? "winter" : "summer";
    }

    return "summer";
}

function readTransferEntriesFromFile(filePath: string): TransferRecord[] {
    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as TransferRecord[] | TransferCachePayload;
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.transfers)) return parsed.transfers;
    } catch {
        // Fall through to empty list.
    }
    return [];
}

function loadTransferRecords(): TransferRecord[] {
    const dataDir = path.join(process.cwd(), "public", "data");
    const scrapedPath = path.join(dataDir, "transfers_scraped.json");
    const staticPath = path.join(dataDir, "transfers.json");

    const scrapedTransfers = readTransferEntriesFromFile(scrapedPath);
    if (scrapedTransfers.length > 0) return scrapedTransfers;

    return readTransferEntriesFromFile(staticPath);
}

function loadSeasonTransfers(): { season: string; transfers: TransferRecord[] } {
    const rawTransfers = loadTransferRecords();
    const currentSeason = getCurrentSeasonLabel();

    const withSeason = rawTransfers.map((t) => {
        const season = t.season || getSeasonFromWindow(t.window) || "";
        return { ...t, season };
    });

    const currentSeasonTransfers = withSeason.filter((t) => t.season === currentSeason);
    if (currentSeasonTransfers.length > 0) {
        return { season: currentSeason, transfers: currentSeasonTransfers };
    }

    const latestSeason = withSeason.reduce((best, t) => {
        const bestStart = getSeasonStartYear(best);
        const thisStart = getSeasonStartYear(t.season || null);
        return thisStart > bestStart ? (t.season || null) : best;
    }, null as string | null);

    if (latestSeason) {
        return {
            season: latestSeason,
            transfers: withSeason.filter((t) => t.season === latestSeason),
        };
    }

    return { season: currentSeason, transfers: withSeason };
}

async function fetchFplData(): Promise<{
    elements: FplElement[];
    teamMap: Map<number, string>;
    positionMap: Map<number, string>;
}> {
    try {
        const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)" },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            return { elements: [], teamMap: new Map(), positionMap: new Map() };
        }

        const data = await response.json();
        const elements = (data.elements || []) as FplElement[];
        const teamMap = new Map<number, string>((data.teams || []).map((t: any) => [t.id, t.short_name || t.name || ""]));
        const positionMap = new Map<number, string>((data.element_types || []).map((et: any) => [et.id, et.singular_name_short || ""]));
        return { elements, teamMap, positionMap };
    } catch {
        return { elements: [], teamMap: new Map(), positionMap: new Map() };
    }
}

function buildFplNameMap(players: FplElement[]): Map<string, FplElement> {
    const byName = new Map<string, FplElement>();
    for (const p of players) {
        byName.set(normalizeName(`${p.first_name} ${p.second_name}`), p);
        byName.set(normalizeName(p.web_name), p);
    }
    return byName;
}

function findFplPlayer(transfer: TransferRecord, byId: Map<number, FplElement>, byName: Map<string, FplElement>): FplElement | undefined {
    if (transfer.fpl_id && byId.has(transfer.fpl_id)) {
        return byId.get(transfer.fpl_id);
    }

    const normalizedName = normalizeName(transfer.player);
    const exact = byName.get(normalizedName);
    if (exact) return exact;

    for (const [name, player] of byName.entries()) {
        if (name.includes(normalizedName) || normalizedName.includes(name)) {
            return player;
        }
    }

    return undefined;
}

function buildLiveStats(player: FplElement, teamMap: Map<number, string>, positionMap: Map<number, string>): TransferStats {
    const formValue = Number.parseFloat(player.form);
    const form = Number.isFinite(formValue) ? Number(formValue.toFixed(1)) : undefined;

    const chunks: string[] = [];
    if (player.goals_scored > 0) chunks.push(`${player.goals_scored}G`);
    if (player.assists > 0) chunks.push(`${player.assists}A`);
    if (player.clean_sheets > 0 && player.element_type <= 2) chunks.push(`${player.clean_sheets}CS`);
    chunks.push(`${player.total_points} pts`);
    chunks.push(`${player.minutes} mins`);
    if (form !== undefined) chunks.push(`Form ${form}`);

    return {
        available: true,
        summary: `Live PL: ${chunks.join(" · ")}`,
        league: "Premier League",
        team: teamMap.get(player.team) || undefined,
        position: positionMap.get(player.element_type) || undefined,
        starts: player.starts,
        minutes: player.minutes,
        goals: player.goals_scored,
        assists: player.assists,
        cleanSheets: player.clean_sheets,
        points: player.total_points,
        form,
    };
}

function toNum(raw: string | number | undefined): number {
    if (typeof raw === "number") return raw;
    const n = Number.parseFloat(String(raw ?? ""));
    return Number.isFinite(n) ? n : 0;
}

function toInt(raw: string | number | undefined): number {
    if (typeof raw === "number") return Math.round(raw);
    const n = Number.parseInt(String(raw ?? ""), 10);
    return Number.isFinite(n) ? n : 0;
}

function normalizeUnderstatLeagueName(name: string): string {
    const compact = name.replace(/\s+/g, "").toLowerCase();
    if (compact === "laliga") return "La Liga";
    if (compact === "seriea") return "Serie A";
    return name;
}

async function fetchUnderstatLeagueData(leagueSlug: string, seasonStartYear: number): Promise<{
    leagueName: string;
    teams: Set<string>;
    players: UnderstatPlayer[];
}> {
    const url = `https://understat.com/getLeagueData/${encodeURIComponent(leagueSlug)}/${seasonStartYear}`;
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)",
                "X-Requested-With": "XMLHttpRequest",
                Referer: `https://understat.com/league/${leagueSlug.replace(/\s+/g, "_")}/${seasonStartYear}`,
            },
            signal: AbortSignal.timeout(6000),
        });

        if (!response.ok) return { leagueName: normalizeUnderstatLeagueName(leagueSlug), teams: new Set(), players: [] };

        const data = await response.json() as {
            teams?: Record<string, { title?: string }>;
            players?: UnderstatPlayer[];
        };

        const teams = new Set<string>();
        for (const team of Object.values(data.teams || {})) {
            if (team?.title) teams.add(normalizeName(team.title));
        }

        return {
            leagueName: normalizeUnderstatLeagueName(leagueSlug),
            teams,
            players: data.players || [],
        };
    } catch {
        return { leagueName: normalizeUnderstatLeagueName(leagueSlug), teams: new Set(), players: [] };
    }
}

function buildUnderstatPlayerMap(players: UnderstatPlayer[]): Map<string, UnderstatPlayer> {
    const byName = new Map<string, UnderstatPlayer>();
    for (const p of players) {
        const normalized = normalizeName(p.player_name);
        byName.set(normalized, p);
        // Also index a variant without the final surname token for cases like "Mbappe-Lottin"
        const parts = normalized.split(" ");
        if (parts.length >= 2) byName.set(parts.slice(0, 2).join(" "), p);
    }
    return byName;
}

function matchUnderstatPlayer(playerName: string, playerMap: Map<string, UnderstatPlayer>): UnderstatPlayer | undefined {
    const normalized = normalizeName(playerName);
    const exact = playerMap.get(normalized);
    if (exact) return exact;

    for (const [k, v] of playerMap.entries()) {
        if (k.includes(normalized) || normalized.includes(k)) {
            return v;
        }
    }
    return undefined;
}

function buildUnderstatStats(player: UnderstatPlayer, leagueName: string): TransferStats {
    const goals = toInt(player.goals);
    const assists = toInt(player.assists);
    const apps = toInt(player.games);
    const minutes = toInt(player.time);
    const xG = toNum(player.xG);
    const xA = toNum(player.xA);

    return {
        available: true,
        league: leagueName,
        team: player.team_title || undefined,
        position: player.position || undefined,
        starts: apps,
        minutes,
        goals,
        assists,
        summary: `Live ${leagueName}: ${apps} apps · ${goals}G · ${assists}A · xG ${xG.toFixed(1)} · xA ${xA.toFixed(1)}`,
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        const { season, transfers } = loadSeasonTransfers();
        const seasonStartYear = getSeasonStartYear(season);
        const [{ elements, teamMap, positionMap }, laLigaData, serieAData] = await Promise.all([
            fetchFplData(),
            fetchUnderstatLeagueData("La liga", seasonStartYear),
            fetchUnderstatLeagueData("Serie A", seasonStartYear),
        ]);

        const byId = new Map<number, FplElement>(elements.map((p) => [p.id, p]));
        const byName = buildFplNameMap(elements);
        const laLigaPlayers = buildUnderstatPlayerMap(laLigaData.players);
        const serieAPlayers = buildUnderstatPlayerMap(serieAData.players);

        const destinationLeagueByClub = new Map<string, "la_liga" | "serie_a">();
        laLigaData.teams.forEach((club) => destinationLeagueByClub.set(club, "la_liga"));
        serieAData.teams.forEach((club) => destinationLeagueByClub.set(club, "serie_a"));

        const summer: TransferResponseItem[] = [];
        const winter: TransferResponseItem[] = [];

        let withLiveStats = 0;

        const sortedTransfers = [...transfers].sort((a, b) => a.player.localeCompare(b.player));
        for (const t of sortedTransfers) {
            const destinationLeague = destinationLeagueByClub.get(normalizeName(t.to));
            let stats: TransferStats;

            // If the destination is La Liga or Serie A, prefer those league stats over PL matches.
            if (destinationLeague === "la_liga") {
                const understatPlayer = matchUnderstatPlayer(t.player, laLigaPlayers);
                stats = understatPlayer
                    ? buildUnderstatStats(understatPlayer, laLigaData.leagueName)
                    : {
                        available: false,
                        league: laLigaData.leagueName,
                        summary: t.performance || "Live La Liga stats unavailable for this player.",
                    };
            } else if (destinationLeague === "serie_a") {
                const understatPlayer = matchUnderstatPlayer(t.player, serieAPlayers);
                stats = understatPlayer
                    ? buildUnderstatStats(understatPlayer, serieAData.leagueName)
                    : {
                        available: false,
                        league: serieAData.leagueName,
                        summary: t.performance || "Live Serie A stats unavailable for this player.",
                    };
            } else {
                const matchedPlayer = findFplPlayer(t, byId, byName);
                if (matchedPlayer) {
                    stats = buildLiveStats(matchedPlayer, teamMap, positionMap);
                } else {
                    stats = {
                        available: false,
                        summary: t.performance || "Live league stats unavailable for this player.",
                    };
                }
            }

            if (stats.available) withLiveStats++;

            const item: TransferResponseItem = {
                player: t.player,
                from: t.from,
                to: t.to,
                fee: t.fee,
                window: t.window || "",
                windowType: classifyWindow(t, seasonStartYear),
                tm_url: t.tm_url || buildTransfermarktSearchUrl(t.player),
                stats,
            };

            if (item.windowType === "winter") winter.push(item);
            else summer.push(item);
        }

        const payload: TransfersPayload = {
            season,
            generatedAt: new Date().toISOString(),
            totals: {
                all: sortedTransfers.length,
                summer: summer.length,
                winter: winter.length,
                withLiveStats,
            },
            windows: { summer, winter },
        };

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        return res.status(200).json(payload);
    } catch (error: any) {
        console.error("Season transfers API error:", error);
        return res.status(500).json({ error: "Failed to fetch season transfers." });
    }
}
