import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = process.env.FOOTBALL_API_KEY || "";
const BASE_URL = "https://v3.football.api-sports.io";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    if (!API_KEY) {
        return res.status(500).json({
            error: "FOOTBALL_API_KEY not configured",
            message: "Add your API-Football key as FOOTBALL_API_KEY in Vercel Environment Variables",
        });
    }

    try {
        const action = req.query.action as string;

        // ─── Search players by name ───
        if (action === "search") {
            const name = req.query.name as string;
            if (!name) return res.status(400).json({ error: "Missing name parameter" });

            // API-Football requires league or team with search. Search top leagues in parallel.
            const TOP_LEAGUES = [39, 140, 135, 78, 61]; // PL, La Liga, Serie A, Bundesliga, Ligue 1
            const leagueParam = req.query.league as string;
            const leagues = leagueParam ? [parseInt(leagueParam)] : TOP_LEAGUES;

            const results = await Promise.all(
                leagues.map(async (leagueId) => {
                    try {
                        const r = await fetch(
                            `${BASE_URL}/players?search=${encodeURIComponent(name)}&league=${leagueId}&season=2024`,
                            { headers: { "x-apisports-key": API_KEY } }
                        );
                        const d = await r.json();
                        if (d.errors && Object.keys(d.errors).length > 0) return [];
                        return (d.response || []).slice(0, 5);
                    } catch {
                        return [];
                    }
                })
            );

            // Flatten, deduplicate by player ID, take top 15
            const seen = new Set<number>();
            const allPlayers: any[] = [];
            for (const batch of results) {
                for (const item of batch) {
                    if (!seen.has(item.player.id)) {
                        seen.add(item.player.id);
                        allPlayers.push(item);
                    }
                }
            }

            const players = allPlayers.slice(0, 15).map((item: any) => ({
                id: item.player.id,
                name: item.player.name,
                firstName: item.player.firstname,
                lastName: item.player.lastname,
                age: item.player.age,
                nationality: item.player.nationality,
                photo: item.player.photo,
                team: item.statistics?.[0]?.team?.name || "Unknown",
                teamLogo: item.statistics?.[0]?.team?.logo || "",
                league: item.statistics?.[0]?.league?.name || "Unknown",
                position: item.statistics?.[0]?.games?.position || "Unknown",
                stats: normalizeStats(item.statistics?.[0]),
            }));

            return res.status(200).json({ players });
        }

        // ─── Get player by ID ───
        if (action === "player") {
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing id parameter" });

            const response = await fetch(`${BASE_URL}/players?id=${id}&season=2024`, {
                headers: { "x-apisports-key": API_KEY },
            });
            const data = await response.json();

            if (data.errors && Object.keys(data.errors).length > 0) {
                return res.status(429).json({ error: "API rate limit reached", details: data.errors });
            }

            const item = data.response?.[0];
            if (!item) return res.status(404).json({ error: "Player not found" });

            const player = {
                id: item.player.id,
                name: item.player.name,
                firstName: item.player.firstname,
                lastName: item.player.lastname,
                age: item.player.age,
                nationality: item.player.nationality,
                photo: item.player.photo,
                team: item.statistics?.[0]?.team?.name || "Unknown",
                teamLogo: item.statistics?.[0]?.team?.logo || "",
                league: item.statistics?.[0]?.league?.name || "Unknown",
                position: item.statistics?.[0]?.games?.position || "Unknown",
                stats: normalizeStats(item.statistics?.[0]),
            };

            return res.status(200).json({ player });
        }

        return res.status(400).json({ error: "Invalid action. Use ?action=search&name=... or ?action=player&id=..." });
    } catch (error: any) {
        console.error("Football API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}

/**
 * Normalize raw API-Football statistics into 0-100 radar chart values
 */
function normalizeStats(stats: any) {
    if (!stats) {
        return { pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50, vision: 50, positioning: 50 };
    }

    const games = stats.games || {};
    const goals = stats.goals || {};
    const passes = stats.passes || {};
    const tackles = stats.tackles || {};
    const dribbles = stats.dribbles || {};
    const duels = stats.duels || {};

    const rating = parseFloat(games.rating) || 6.5;
    const appearances = games.appearences || 1;

    // Clamp between 30 and 99
    const clamp = (val: number) => Math.max(30, Math.min(99, Math.round(val)));

    // Shooting: based on goals, shots accuracy, goals-per-game ratio
    const goalsTotal = goals.total || 0;
    const goalsPerGame = (goalsTotal / Math.max(appearances, 1)) * 100;
    const shooting = clamp(55 + goalsPerGame * 40 + (rating - 6.5) * 10);

    // Passing: based on pass accuracy and key passes
    const passAccuracy = passes.accuracy ? parseInt(passes.accuracy) : 70;
    const keyPasses = passes.key || 0;
    const keyPassesPerGame = (keyPasses / Math.max(appearances, 1)) * 100;
    const passing = clamp(passAccuracy * 0.7 + keyPassesPerGame * 15 + (rating - 6.5) * 5);

    // Dribbling: based on dribble success rate
    const dribblesAttempted = dribbles.attempts || 0;
    const dribblesSucceeded = dribbles.success || 0;
    const dribbleRate = dribblesAttempted > 0 ? (dribblesSucceeded / dribblesAttempted) * 100 : 50;
    const dribblesPerGame = (dribblesSucceeded / Math.max(appearances, 1)) * 100;
    const dribblingScore = clamp(40 + dribbleRate * 0.3 + dribblesPerGame * 15 + (rating - 6.5) * 8);

    // Defending: based on tackles, interceptions, blocks
    const tacklesTotal = tackles.total || 0;
    const interceptions = tackles.interceptions || 0;
    const tacklesPerGame = ((tacklesTotal + interceptions) / Math.max(appearances, 1)) * 100;
    const defending = clamp(35 + tacklesPerGame * 8 + (rating - 6.5) * 5);

    // Physical: based on duels won
    const duelsTotal = duels.total || 0;
    const duelsWon = duels.won || 0;
    const duelRate = duelsTotal > 0 ? (duelsWon / duelsTotal) * 100 : 50;
    const physical = clamp(40 + duelRate * 0.4 + (rating - 6.5) * 8);

    // Vision: based on assists and key passes
    const assists = goals.assists || 0;
    const assistsPerGame = (assists / Math.max(appearances, 1)) * 100;
    const vision = clamp(50 + assistsPerGame * 50 + keyPassesPerGame * 10 + (rating - 6.5) * 8);

    // Positioning: based on overall rating
    const positioning = clamp(rating * 12 - 5);

    // Pace: harder to derive from stats, approximate from position and dribbles
    const position = games.position || "";
    let paceBase = 65;
    if (position === "Attacker") paceBase = 78;
    else if (position === "Midfielder") paceBase = 72;
    else if (position === "Defender") paceBase = 65;
    else if (position === "Goalkeeper") paceBase = 45;
    const pace = clamp(paceBase + dribblesPerGame * 5 + (rating - 6.5) * 5);

    return { pace, shooting, passing, dribbling: dribblingScore, defending, physical, vision, positioning };
}
