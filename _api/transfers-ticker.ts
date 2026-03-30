import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

interface StaticTransfer {
    player: string;
    from: string;
    to: string;
    fee: string;
    window?: string;
    season?: string;
    tm_url?: string;
    performance?: string;
    fpl_id?: number;
}

interface FplPlayer {
    id: number;
    first_name: string;
    second_name: string;
    web_name: string;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    total_points: number;
    form: string;
    starts: number;
    element_type: number;
}

interface TickerItem {
    type: "transfer" | "rumor";
    player?: string;
    move?: string;
    fee?: string;
    performance?: string;
    window?: string;
    text?: string;
    link?: string;
    tm_url?: string;
}

interface TransferCachePayload {
    transfers?: StaticTransfer[];
}

const TRANSFERMARKT_BASE = "https://www.transfermarkt.com";
const TRANSFERMARKT_SEARCH = `${TRANSFERMARKT_BASE}/schnellsuche/ergebnis/schnellsuche?query=`;

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").trim();
}

function extractFromXML(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?\\s*</${tag}>`, "s"));
    return match ? match[1].trim() : "";
}

function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getCurrentSeasonLabel(now: Date = new Date()): string {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth(); // 0-indexed
    const startYear = month >= 6 ? year : year - 1; // Season starts in July
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

function buildTransfermarktSearchUrl(query: string): string {
    return `${TRANSFERMARKT_SEARCH}${encodeURIComponent(query)}`;
}

function extractLikelyPlayerName(text: string): string | null {
    const cleaned = text
        .replace(/^Gossip:\s*/i, "")
        .replace(/[“”"()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const candidates = cleaned.match(/\b([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'`-]+(?:\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'`-]+){1,2})\b/g) || [];
    const bannedTokens = new Set([
        "AFC", "Ajax", "Arsenal", "Barcelona", "Bayern", "Borussia", "Brighton", "Chelsea", "City", "Club",
        "Everton", "Forest", "Juventus", "Leeds", "Liverpool", "Madrid", "Milan", "Napoli", "Newcastle",
        "Palace", "PSG", "Real", "Roma", "Spurs", "Tottenham", "United", "Villa", "West", "Wolves"
    ]);

    for (const candidate of candidates) {
        const words = candidate.split(" ");
        if (words.length < 2 || words.length > 3) continue;
        if (words.some((w) => bannedTokens.has(w))) continue;
        return candidate;
    }
    return null;
}

async function resolveTransfermarktPlayerUrl(query: string, cache: Map<string, string>): Promise<string> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return buildTransfermarktSearchUrl(query);
    const cached = cache.get(normalized);
    if (cached) return cached;

    const searchUrl = buildTransfermarktSearchUrl(query);

    try {
        const res = await fetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)",
                "Accept-Language": "en-US,en;q=0.9",
            },
            signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
            const html = await res.text();
            const playerMatch = html.match(/href="(\/[^"]+\/profil\/spieler\/\d+)"/i);
            if (playerMatch?.[1]) {
                const profileUrl = `${TRANSFERMARKT_BASE}${playerMatch[1]}`;
                cache.set(normalized, profileUrl);
                return profileUrl;
            }
        }
    } catch {
        // Fall through to search URL
    }

    cache.set(normalized, searchUrl);
    return searchUrl;
}

function readTransferEntriesFromFile(filePath: string): StaticTransfer[] {
    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as StaticTransfer[] | TransferCachePayload;
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.transfers)) return parsed.transfers;
    } catch {
        // Fall through to empty list.
    }
    return [];
}

function loadTransferRecords(): StaticTransfer[] {
    const dataDir = path.join(process.cwd(), "public", "data");
    const scrapedPath = path.join(dataDir, "transfers_scraped.json");
    const staticPath = path.join(dataDir, "transfers.json");

    const scrapedTransfers = readTransferEntriesFromFile(scrapedPath);
    if (scrapedTransfers.length > 0) return scrapedTransfers;

    return readTransferEntriesFromFile(staticPath);
}

function loadCurrentSeasonStaticTransfers(currentSeason: string): StaticTransfer[] {
    const rawTransfers = loadTransferRecords();

    const withSeason = rawTransfers.map((t) => {
        const season = t.season || getSeasonFromWindow(t.window) || "";
        return { ...t, season };
    });

    const currentSeasonTransfers = withSeason.filter((t) => t.season === currentSeason);
    if (currentSeasonTransfers.length > 0) return currentSeasonTransfers;

    // Fallback to latest known season if current season isn't in static file.
    const latestSeason = withSeason.reduce((best, t) => {
        const bestStart = getSeasonStartYear(best);
        const currentStart = getSeasonStartYear(t.season || null);
        return currentStart > bestStart ? (t.season || null) : best;
    }, null as string | null);

    return latestSeason ? withSeason.filter((t) => t.season === latestSeason) : withSeason;
}

function buildFplNameMap(players: FplPlayer[]): Map<string, FplPlayer> {
    const byName = new Map<string, FplPlayer>();
    for (const p of players) {
        const fullName = normalizeName(`${p.first_name} ${p.second_name}`);
        byName.set(fullName, p);
        if (p.web_name) byName.set(normalizeName(p.web_name), p);
    }
    return byName;
}

function formatFplPerformance(player: FplPlayer): string {
    if (player.minutes === 0) return "Live: no minutes yet this season.";

    const statChunks: string[] = [];
    if (player.goals_scored > 0) statChunks.push(`${player.goals_scored}G`);
    if (player.assists > 0) statChunks.push(`${player.assists}A`);
    if (player.clean_sheets > 0 && player.element_type <= 2) statChunks.push(`${player.clean_sheets}CS`);

    const startsOrApps = player.starts > 0 ? `${player.starts} starts` : `${Math.max(1, Math.round(player.minutes / 90))} apps`;
    const form = Number.parseFloat(player.form);
    const formChunk = Number.isFinite(form) ? `Form ${form.toFixed(1)}` : "";

    if (statChunks.length > 0) {
        return `Live: ${statChunks.join(" · ")} | ${player.total_points} pts | ${startsOrApps}${formChunk ? ` | ${formChunk}` : ""}`;
    }

    return `Live: ${player.total_points} pts | ${startsOrApps}${formChunk ? ` | ${formChunk}` : ""}`;
}

function findFplPlayer(transfer: StaticTransfer, byId: Map<number, FplPlayer>, byName: Map<string, FplPlayer>): FplPlayer | undefined {
    if (transfer.fpl_id && byId.has(transfer.fpl_id)) {
        return byId.get(transfer.fpl_id);
    }

    const normalizedTransferName = normalizeName(transfer.player);
    const exact = byName.get(normalizedTransferName);
    if (exact) return exact;

    // Small fuzzy fallback for partial-name matches
    for (const [key, player] of byName.entries()) {
        if (key.includes(normalizedTransferName) || normalizedTransferName.includes(key)) {
            return player;
        }
    }

    return undefined;
}

async function fetchGossipRss(nameToTmUrl: Map<string, string>): Promise<TickerItem[]> {
    try {
        const res = await fetch("https://feeds.bbci.co.uk/sport/football/gossip/rss.xml", {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)" },
            signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) return [];
        const xml = await res.text();

        const items: TickerItem[] = [];
        const resolveQueue: Array<{ index: number; query: string }> = [];
        const tmSearchCache = new Map<string, string>();

        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 6) {
            const itemXml = match[1];
            const title = stripHtml(extractFromXML(itemXml, "title"));
            if (title && !title.toLowerCase().includes("video")) {
                const rumorText = title.replace(/^Gossip: /, "");
                const likelyPlayer = extractLikelyPlayerName(rumorText);
                const knownPlayerUrl = likelyPlayer ? nameToTmUrl.get(normalizeName(likelyPlayer)) : undefined;

                const idx = items.length;
                items.push({
                    type: "rumor",
                    text: rumorText,
                    link: knownPlayerUrl || "",
                });

                if (!knownPlayerUrl) {
                    resolveQueue.push({
                        index: idx,
                        query: likelyPlayer || rumorText,
                    });
                }
                count++;
            }
        }

        await Promise.all(resolveQueue.map(async (job) => {
            const playerUrl = await resolveTransfermarktPlayerUrl(job.query, tmSearchCache);
            items[job.index].link = playerUrl;
        }));

        return items;
    } catch {
        return [];
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        const currentSeason = getCurrentSeasonLabel();
        const staticTransfers = loadCurrentSeasonStaticTransfers(currentSeason);

        const fplRes = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(5000)
        }).catch(() => null);

        let fplElements: FplPlayer[] = [];
        if (fplRes && fplRes.ok) {
            const fplData = await fplRes.json();
            fplElements = fplData.elements || [];
        }

        const fplById = new Map<number, FplPlayer>(fplElements.map((p) => [p.id, p]));
        const fplByName = buildFplNameMap(fplElements);

        const transferPool = staticTransfers.slice(0, 16);
        const nameToTmUrl = new Map<string, string>();
        for (const t of transferPool) {
            if (t.tm_url) nameToTmUrl.set(normalizeName(t.player), t.tm_url);
        }
        for (const t of staticTransfers) {
            if (t.tm_url) nameToTmUrl.set(normalizeName(t.player), t.tm_url);
        }

        const rumors = await fetchGossipRss(nameToTmUrl);

        const verifiedTransfers: TickerItem[] = transferPool.map((t) => {
            const matchedFplPlayer = findFplPlayer(t, fplById, fplByName);
            const perf = matchedFplPlayer
                ? formatFplPerformance(matchedFplPlayer)
                : "Live: current-season feed active. Detailed stats unavailable for this league.";

            return {
                type: "transfer",
                player: t.player,
                move: `${t.from} → ${t.to}`,
                fee: t.fee,
                performance: perf,
                window: t.window || `Season ${currentSeason}`,
                tm_url: t.tm_url || buildTransfermarktSearchUrl(t.player),
            };
        });

        // Interleave confirmed transfers with rumors.
        const tickerItems: TickerItem[] = [];
        let tIdx = 0;
        let rIdx = 0;

        while (tIdx < verifiedTransfers.length || rIdx < rumors.length) {
            if (tIdx < verifiedTransfers.length) {
                tickerItems.push(verifiedTransfers[tIdx++]);
                if (tIdx < verifiedTransfers.length) tickerItems.push(verifiedTransfers[tIdx++]);
            }
            if (rIdx < rumors.length) {
                tickerItems.push(rumors[rIdx++]);
            }
        }

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        return res.status(200).json(tickerItems);

    } catch (error: any) {
        console.error("Transfers API Error:", error);
        return res.status(500).json({ error: "Failed to fetch ticker data" });
    }
}
