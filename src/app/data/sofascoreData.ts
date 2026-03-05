/**
 * SofaScore widget data — IDs for clubs, tournaments, and common players.
 * These IDs are used to construct official widget embed URLs.
 * Source: sofascore.com (inspect embed URLs on match/team/player pages)
 */

// ── Tournament IDs ────────────────────────────────────────────────
export interface TournamentInfo {
    tournamentId: number;
    seasonId: number; // Current season — update each year
    name: string;
}

export const TOURNAMENTS: Record<string, TournamentInfo> = {
    // Verified 25/26 Season IDs for the V2 Widget API
    "Premier League": { tournamentId: 1, seasonId: 76986, name: "Premier League" },
    "La Liga": { tournamentId: 8, seasonId: 77051, name: "La Liga" },
    "Bundesliga": { tournamentId: 35, seasonId: 77053, name: "Bundesliga" },
    "Serie A": { tournamentId: 23, seasonId: 77055, name: "Serie A" },
    "Ligue 1": { tournamentId: 34, seasonId: 77061, name: "Ligue 1" },
    "Champions League": { tournamentId: 7, seasonId: 77059, name: "Champions League" },
    "Europa League": { tournamentId: 679, seasonId: 77060, name: "Europa League" },
    "FA Cup": { tournamentId: 29, seasonId: 77114, name: "FA Cup" },
    "Carabao Cup": { tournamentId: 21, seasonId: 77109, name: "Carabao Cup" },
};

// ── Team IDs (Premier League 2024-25) ─────────────────────────────
export const TEAMS: Record<string, number> = {
    "Arsenal": 42,
    "Aston Villa": 40,
    "AFC Bournemouth": 60,
    "Bournemouth": 60,
    "Brentford": 50,
    "Brighton": 30,
    "Brighton & Hove Albion": 30,
    "Chelsea": 38,
    "Crystal Palace": 24,
    "Everton": 48,
    "Fulham": 43,
    "Ipswich": 32,
    "Ipswich Town": 32,
    "Leicester": 31,
    "Leicester City": 31,
    "Liverpool": 44,
    "Manchester City": 17,
    "Manchester United": 35,
    "Newcastle": 39,
    "Newcastle United": 39,
    "Nottingham Forest": 14,
    "Southampton": 45,
    "Tottenham": 33,
    "Tottenham Hotspur": 33,
    "West Ham": 37,
    "West Ham United": 37,
    "Wolverhampton": 3,
    "Wolves": 3,
    // La Liga
    "Real Madrid": 2829,
    "Barcelona": 2817,
    "Atlético Madrid": 2836,
    "Athletic Bilbao": 2825,
    "Real Sociedad": 2824,
    "Villarreal": 2819,
    "Real Betis": 2816,
    "Sevilla": 2833,
    // Bundesliga
    "Bayern Munich": 2672,
    "Borussia Dortmund": 2673,
    "RB Leipzig": 36360,
    "Bayer Leverkusen": 2681,
    // Serie A
    "Inter Milan": 2697,
    "AC Milan": 2692,
    "Juventus": 2687,
    "Napoli": 2714,
    "Roma": 2702,
    // Ligue 1
    "PSG": 1644,
    "Paris Saint-Germain": 1644,
    "Marseille": 1641,
    "Lyon": 1649,
    "Monaco": 1661,
};

// ── Common Player IDs ──────────────────────────────────────────────
export const PLAYERS: Record<string, number> = {
    // Arsenal
    "Bukayo Saka": 934235,
    "Martin Ødegaard": 381903,
    "William Saliba": 862107,
    "Declan Rice": 832745,
    "Gabriel Jesus": 814015,
    "Kai Havertz": 792498,
    // Liverpool
    "Mohamed Salah": 159665,
    "Virgil van Dijk": 115462,
    "Trent Alexander-Arnold": 820922,
    // Man City
    "Erling Haaland": 839956,
    "Kevin De Bruyne": 70996,
    "Phil Foden": 895734,
    // Chelsea
    "Cole Palmer": 985498,
    "Enzo Fernández": 975743,
    // Man United
    "Bruno Fernandes": 240534,
    "Marcus Rashford": 839446,
    "Rasmus Højlund": 1014880,
    // Tottenham
    "Son Heung-min": 135086,
    "James Maddison": 817212,
    // Others
    "Ollie Watkins": 849724,
    "Alexander Isak": 835400,
    // La Liga
    "Vinícius Jr": 906498,
    "Jude Bellingham": 951937,
    "Lamine Yamal": 1182879,
    "Robert Lewandowski": 40680,
    // Bundesliga
    "Harry Kane": 202153,
    "Florian Wirtz": 1048294,
    "Jamal Musiala": 992437,
    // Serie A
    "Lautaro Martínez": 826056,
    "Victor Osimhen": 870878,
    // Ligue 1
    "Kylian Mbappé": 901211,
};

// ── Widget Types ──────────────────────────────────────────────────
export type SofaScoreWidgetType = "match" | "standings" | "team" | "player";

export interface WidgetConfig {
    type: SofaScoreWidgetType;
    id?: number;
    eventUrl?: string; // For match widgets, user can paste the match URL
    tournamentId?: number;
    seasonId?: number;
}

// ── Widget URL Builder ──────────────────────────────────────────────
const WIDGET_BASE = "https://widgets.sofascore.com/embed";
const DEFAULT_PARAMS = "widgetTheme=dark&color=16A34A";

export function buildWidgetEmbedUrl(config: WidgetConfig): string {
    switch (config.type) {
        case "match":
            if (config.eventUrl) {
                // Extract event ID from a SofaScore match URL
                const match = config.eventUrl.match(/\/(\d+)$/);
                const eventId = match ? match[1] : config.id;
                return `${WIDGET_BASE}/match/${eventId}?${DEFAULT_PARAMS}`;
            }
            return config.id ? `${WIDGET_BASE}/match/${config.id}?${DEFAULT_PARAMS}` : "";

        case "standings":
            const tId = config.tournamentId || config.id;
            const sId = config.seasonId;
            if (!tId || !sId) return "";
            // New V2 API format
            return `${WIDGET_BASE}/tournament/${tId}/season/${sId}/standings?${DEFAULT_PARAMS}`;

        case "team":
            return config.id ? `${WIDGET_BASE}/team/${config.id}?${DEFAULT_PARAMS}` : "";

        case "player":
            return config.id ? `${WIDGET_BASE}/player/${config.id}?${DEFAULT_PARAMS}` : "";

        default:
            return "";
    }
}

/** Get the recommended iframe height for a widget type */
export function getWidgetHeight(type: SofaScoreWidgetType): number {
    switch (type) {
        case "match": return 500;
        case "standings": return 600;
        case "team": return 400;
        case "player": return 400;
        default: return 400;
    }
}

/** Look up a team ID by club name (case-insensitive, partial match) */
export function findTeamId(clubName: string): number | undefined {
    const q = clubName.toLowerCase();
    const entry = Object.entries(TEAMS).find(([name]) => name.toLowerCase() === q);
    if (entry) return entry[1];
    // Partial match
    const partial = Object.entries(TEAMS).find(([name]) => name.toLowerCase().includes(q) || q.includes(name.toLowerCase()));
    return partial?.[1];
}

/** Look up a player ID by name (case-insensitive) */
export function findPlayerId(playerName: string): number | undefined {
    const q = playerName.toLowerCase();
    const entry = Object.entries(PLAYERS).find(([name]) => name.toLowerCase() === q);
    if (entry) return entry[1];
    const partial = Object.entries(PLAYERS).find(([name]) => name.toLowerCase().includes(q) || q.includes(name.toLowerCase()));
    return partial?.[1];
}

/** Get all club names for dropdown */
export function getAllClubNamesForWidgets(): string[] {
    // Deduplicate by ID
    const seen = new Set<number>();
    return Object.entries(TEAMS)
        .filter(([, id]) => {
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        })
        .map(([name]) => name)
        .sort();
}

/** Get all player names for dropdown */
export function getAllPlayerNames(): string[] {
    return Object.keys(PLAYERS).sort();
}

/** Get all tournament names for dropdown */
export function getAllTournamentNames(): string[] {
    return Object.keys(TOURNAMENTS).sort();
}
