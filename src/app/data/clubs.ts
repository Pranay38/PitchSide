export interface Club {
  name: string;
  league: string;
  logo: string;
}

// Default clubs (shipped with the app)
const DEFAULT_CLUBS: Club[] = [
  // Premier League
  { name: "Manchester United", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t1.png" },
  { name: "Arsenal", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t3.png" },
  { name: "Liverpool", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t14.png" },
  { name: "Chelsea", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t8.png" },
  { name: "Manchester City", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t43.png" },
  { name: "Tottenham Hotspur", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t6.png" },
  { name: "Newcastle United", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t4.png" },
  { name: "Aston Villa", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t7.png" },
  { name: "West Ham United", league: "Premier League", logo: "https://resources.premierleague.com/premierleague/badges/50/t21.png" },

  // La Liga
  { name: "Real Madrid", league: "La Liga", logo: "https://crests.football-data.org/86.png" },
  { name: "Barcelona", league: "La Liga", logo: "https://crests.football-data.org/81.png" },
  { name: "Atletico Madrid", league: "La Liga", logo: "https://crests.football-data.org/78.png" },

  // Bundesliga
  { name: "Bayern Munich", league: "Bundesliga", logo: "https://crests.football-data.org/5.png" },
  { name: "Borussia Dortmund", league: "Bundesliga", logo: "https://crests.football-data.org/4.png" },
  { name: "RB Leipzig", league: "Bundesliga", logo: "https://crests.football-data.org/721.png" },

  // Serie A
  { name: "AC Milan", league: "Serie A", logo: "https://crests.football-data.org/98.png" },
  { name: "Inter Milan", league: "Serie A", logo: "https://crests.football-data.org/108.png" },
  { name: "Juventus", league: "Serie A", logo: "https://crests.football-data.org/109.png" },
  { name: "Napoli", league: "Serie A", logo: "https://crests.football-data.org/113.png" },

  // Ligue 1
  { name: "PSG", league: "Ligue 1", logo: "https://crests.football-data.org/524.png" },
  { name: "Marseille", league: "Ligue 1", logo: "https://crests.football-data.org/516.png" },
  { name: "Lyon", league: "Ligue 1", logo: "https://crests.football-data.org/523.png" },

  // World Cup 2026 — National Teams
  { name: "Argentina", league: "World Cup 2026", logo: "https://crests.football-data.org/762.png" },
  { name: "France", league: "World Cup 2026", logo: "https://crests.football-data.org/773.png" },
  { name: "Brazil", league: "World Cup 2026", logo: "https://crests.football-data.org/764.png" },
  { name: "Germany", league: "World Cup 2026", logo: "https://crests.football-data.org/759.png" },
  { name: "England", league: "World Cup 2026", logo: "https://crests.football-data.org/770.png" },
  { name: "Spain", league: "World Cup 2026", logo: "https://crests.football-data.org/760.png" },
  { name: "Portugal", league: "World Cup 2026", logo: "https://crests.football-data.org/765.png" },
  { name: "Netherlands", league: "World Cup 2026", logo: "https://crests.football-data.org/8601.png" },
  { name: "Italy", league: "World Cup 2026", logo: "https://crests.football-data.org/784.png" },
  { name: "USA", league: "World Cup 2026", logo: "https://crests.football-data.org/771.png" },
  { name: "Mexico", league: "World Cup 2026", logo: "https://crests.football-data.org/769.png" },
  { name: "Canada", league: "World Cup 2026", logo: "https://crests.football-data.org/CAN.png" },
  { name: "Uruguay", league: "World Cup 2026", logo: "https://crests.football-data.org/URU.png" },
  { name: "Colombia", league: "World Cup 2026", logo: "https://crests.football-data.org/COL.png" },
  { name: "Japan", league: "World Cup 2026", logo: "https://crests.football-data.org/766.png" },
  { name: "South Korea", league: "World Cup 2026", logo: "https://crests.football-data.org/KOR.png" },
  { name: "Morocco", league: "World Cup 2026", logo: "https://crests.football-data.org/MAR.png" },
  { name: "Nigeria", league: "World Cup 2026", logo: "https://crests.football-data.org/NGA.png" },
  { name: "Croatia", league: "World Cup 2026", logo: "https://crests.football-data.org/799.png" },
  { name: "Belgium", league: "World Cup 2026", logo: "https://crests.football-data.org/805.png" },
];

const CUSTOM_CLUBS_KEY = "pitchside_custom_clubs";

// ──────────────────────────────────────────
// Dynamic clubs: defaults + user-added clubs
// ──────────────────────────────────────────

function getCustomClubs(): Club[] {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CUSTOM_CLUBS_KEY);
      if (stored) return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveCustomClubs(custom: Club[]): void {
  try {
    localStorage.setItem(CUSTOM_CLUBS_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

/**
 * Get ALL clubs (defaults + custom user-added ones).
 */
export function getAllClubs(): Club[] {
  const custom = getCustomClubs();
  const defaultNames = new Set(DEFAULT_CLUBS.map((c) => c.name.toLowerCase()));
  // Merge: defaults first, then custom clubs that aren't duplicates
  const uniqueCustom = custom.filter((c) => !defaultNames.has(c.name.toLowerCase()));
  return [...DEFAULT_CLUBS, ...uniqueCustom];
}

/**
 * Add a new club to the persistent list.
 */
export function addCustomClub(club: Club): void {
  const existing = getAllClubs();
  if (existing.some((c) => c.name.toLowerCase() === club.name.toLowerCase())) return;
  const custom = getCustomClubs();
  custom.push(club);
  saveCustomClubs(custom);
}

/**
 * Remove a custom club from the persistent list.
 */
export function deleteCustomClub(name: string): void {
  const custom = getCustomClubs();
  const filtered = custom.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
  saveCustomClubs(filtered);
}

/**
 * Check if a club is a custom club.
 */
export function isCustomClub(name: string): boolean {
  const defaultNames = new Set(DEFAULT_CLUBS.map((c) => c.name.toLowerCase()));
  return !defaultNames.has(name.toLowerCase());
}

/**
 * Get all club names as a flat array (defaults + custom).
 */
export function getAllClubNames(): string[] {
  return getAllClubs().map((c) => c.name);
}

// Keep a backward-compatible export
export const clubs = DEFAULT_CLUBS;
export const allClubNames = DEFAULT_CLUBS.map((c) => c.name);

/**
 * Get clubs grouped by league.
 */
export function clubsByLeague(): Record<string, Club[]> {
  return getAllClubs().reduce(
    (acc, club) => {
      if (!acc[club.league]) acc[club.league] = [];
      acc[club.league].push(club);
      return acc;
    },
    {} as Record<string, Club[]>
  );
}

/**
 * Get a club by name (searches all clubs including custom).
 */
export function getClubByName(name: string): Club | undefined {
  return getAllClubs().find((c) => c.name.toLowerCase() === name.toLowerCase());
}

// ──────────────────────────────────────────
// TheSportsDB API: search any club in the world
// ──────────────────────────────────────────

export interface SearchResult {
  name: string;
  league: string;
  logo: string;
}

/**
 * Search for clubs worldwide using TheSportsDB free API.
 * Returns matching teams with their logos.
 */
export async function searchClubsOnline(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.teams) return [];

    return data.teams
      .filter((t: any) => t.strSport === "Soccer")
      .slice(0, 10)
      .map((t: any) => ({
        name: t.strTeam,
        league: t.strLeague || "Unknown League",
        logo: t.strBadge || t.strTeamBadge || "",
      }));
  } catch {
    return [];
  }
}
