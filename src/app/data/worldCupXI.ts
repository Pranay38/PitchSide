/**
 * Pitch XI — Reusable Team of the XI Data Model
 *
 * Supports both:
 *  • World Cup "Team of the Tournament"
 *  • Weekly "Team of the Week" across Top 5 leagues
 *
 * Each entry includes position, country, club, shirt number,
 * player headshot image, club badge, and an editorial reason.
 */

// ─── CORE TYPES ─────────────────────────────────────────────

export type PositionGroup = "GK" | "DEF" | "MID" | "FWD";

export interface XIPlayer {
  id: string;
  name: string;
  /** Shorter display name (used on pitch markers) */
  displayName: string;
  position: PositionGroup;
  country: string;
  /** ISO-3166-1 alpha-2 country code for flag */
  countryCode: string;
  club: string;
  /** Club badge/crest URL */
  clubLogo: string;
  number: number;
  /** Player headshot image URL */
  image: string;
  /** Short editorial rationale (shown on hover/tap) */
  reason: string;
  /** Key stats line */
  stats?: string;
  /** Player rating out of 10 */
  rating?: number;
}

export interface Formation {
  id: string;
  label: string;
  /** Rows bottom-up: GK → FWD. Each row is an array of player IDs. */
  rows: string[][];
}

/** League identifiers for TOTW context */
export type LeagueId =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "combined";

export interface LeagueMeta {
  id: LeagueId;
  name: string;
  shortName: string;
  color: string;
  gradient: string;
}

export type XIContext =
  | {
      type: "tournament";
      tournament: string;
      stage?: string;
    }
  | {
      type: "totw";
      matchweek: number;
      season: string;
      league: LeagueId;
      dateRange?: string;
    };

export interface TeamXI {
  id: string;
  title: string;
  subtitle?: string;
  context: XIContext;
  formationId: string;
  players: XIPlayer[];
  publishedAt: string;
  author?: string;
}

// ─── LEAGUE METADATA ────────────────────────────────────────

export const LEAGUES: Record<LeagueId, LeagueMeta> = {
  "premier-league": {
    id: "premier-league",
    name: "Premier League",
    shortName: "PL",
    color: "#3D195B",
    gradient: "linear-gradient(135deg, #3D195B, #00FF85)",
  },
  "la-liga": {
    id: "la-liga",
    name: "La Liga",
    shortName: "LL",
    color: "#EE8707",
    gradient: "linear-gradient(135deg, #EE8707, #FF2D2D)",
  },
  "serie-a": {
    id: "serie-a",
    name: "Serie A",
    shortName: "SA",
    color: "#024494",
    gradient: "linear-gradient(135deg, #024494, #009B3A)",
  },
  "bundesliga": {
    id: "bundesliga",
    name: "Bundesliga",
    shortName: "BL",
    color: "#D20515",
    gradient: "linear-gradient(135deg, #D20515, #000000)",
  },
  "ligue-1": {
    id: "ligue-1",
    name: "Ligue 1",
    shortName: "L1",
    color: "#DBC564",
    gradient: "linear-gradient(135deg, #1A1F36, #DBC564)",
  },
  combined: {
    id: "combined",
    name: "Top 5 Leagues",
    shortName: "T5",
    color: "#16A34A",
    gradient: "linear-gradient(135deg, #16A34A, #0F172A)",
  },
};

// ─── FORMATIONS ─────────────────────────────────────────────

export const FORMATIONS: Record<string, Formation> = {
  "4-3-3": {
    id: "4-3-3",
    label: "4–3–3",
    rows: [
      ["gk1"],
      ["def1", "def2", "def3", "def4"],
      ["mid1", "mid2", "mid3"],
      ["fwd1", "fwd2", "fwd3"],
    ],
  },
  "4-2-3-1": {
    id: "4-2-3-1",
    label: "4–2–3–1",
    rows: [
      ["gk1"],
      ["def1", "def2", "def3", "def4"],
      ["mid1", "mid2"],
      ["fwd1", "mid3", "fwd3"],
      ["fwd2"],
    ],
  },
  "3-5-2": {
    id: "3-5-2",
    label: "3–5–2",
    rows: [
      ["gk1"],
      ["def2", "def3", "def1"],
      ["def4", "mid1", "mid2", "mid3", "fwd3"],
      ["fwd1", "fwd2"],
    ],
  },
  "3-4-3": {
    id: "3-4-3",
    label: "3–4–3",
    rows: [
      ["gk1"],
      ["def2", "def3", "def1"],
      ["def4", "mid1", "mid2", "mid3"],
      ["fwd1", "fwd2", "fwd3"],
    ],
  },
};

export const DEFAULT_FORMATION = "4-3-3";

// ─── WORLD CUP 2026 — TEAM OF THE TOURNAMENT ───────────────

const wcPlayers: XIPlayer[] = [
  {
    id: "gk1",
    name: "Emiliano Martínez",
    displayName: "E. Martínez",
    position: "GK",
    country: "Argentina",
    countryCode: "AR",
    club: "Aston Villa",
    clubLogo: "https://resources.premierleague.com/premierleague/badges/50/t7.png",
    number: 23,
    image: "https://img.a.transfermarkt.technology/portrait/header/196256-1701542749.jpg",
    rating: 8.4,
    reason:
      "The tournament's most commanding presence between the posts. His penalty shootout heroics and sweeper-keeper range made Argentina's defense almost unbreakable.",
    stats: "7 clean sheets · 28 saves · 2 penalty saves",
  },
  {
    id: "def1",
    name: "Achraf Hakimi",
    displayName: "Hakimi",
    position: "DEF",
    country: "Morocco",
    countryCode: "MA",
    club: "PSG",
    clubLogo: "https://crests.football-data.org/524.png",
    number: 2,
    image: "https://img.a.transfermarkt.technology/portrait/header/398073-1702295498.jpg",
    rating: 8.1,
    reason:
      "Electric going forward — his overlapping runs and whipped crosses created more chances than most midfielders. Defensively disciplined on the counter too.",
    stats: "3 assists · 87% pass accuracy · 12 tackles won",
  },
  {
    id: "def2",
    name: "William Saliba",
    displayName: "Saliba",
    position: "DEF",
    country: "France",
    countryCode: "FR",
    club: "Arsenal",
    clubLogo: "https://resources.premierleague.com/premierleague/badges/50/t3.png",
    number: 4,
    image: "https://img.a.transfermarkt.technology/portrait/header/516854-1694609670.jpg",
    rating: 8.5,
    reason:
      "An absolute wall. Won nearly every aerial duel and read the game two steps ahead. Showed the composure of a veteran at 25.",
    stats: "92% aerial duels won · 7 interceptions/match · 0 errors leading to goals",
  },
  {
    id: "def3",
    name: "Virgil van Dijk",
    displayName: "Van Dijk",
    position: "DEF",
    country: "Netherlands",
    countryCode: "NL",
    club: "Liverpool",
    clubLogo: "https://resources.premierleague.com/premierleague/badges/50/t14.png",
    number: 4,
    image: "https://img.a.transfermarkt.technology/portrait/header/139208-1689070548.jpg",
    rating: 8.3,
    reason:
      "Captain of the backline. Organized every defensive shape and still had the quality to step up and play those trademark diagonal switches to the wing.",
    stats: "89% passing · 4 clearances/game · 1 goal",
  },
  {
    id: "def4",
    name: "Alphonso Davies",
    displayName: "Davies",
    position: "DEF",
    country: "Canada",
    countryCode: "CA",
    club: "Real Madrid",
    clubLogo: "https://crests.football-data.org/86.png",
    number: 19,
    image: "https://img.a.transfermarkt.technology/portrait/header/424204-1701285687.jpg",
    rating: 8.2,
    reason:
      "The home-crowd hero. His blistering pace and direct dribbling from left-back terrorized opposition right-wingers all tournament. Canada's heartbeat.",
    stats: "2 assists · 14 dribbles completed · 9 tackles",
  },
  {
    id: "mid1",
    name: "Jude Bellingham",
    displayName: "Bellingham",
    position: "MID",
    country: "England",
    countryCode: "GB",
    club: "Real Madrid",
    clubLogo: "https://crests.football-data.org/86.png",
    number: 5,
    image: "https://img.a.transfermarkt.technology/portrait/header/581678-1693899498.jpg",
    rating: 9.0,
    reason:
      "Box-to-box dominance redefined. Bellingham covered every blade of grass — winning the ball deep and then driving into the final third to score or create. The engine room of England's run.",
    stats: "4 goals · 3 assists · 58 km covered",
  },
  {
    id: "mid2",
    name: "Pedri",
    displayName: "Pedri",
    position: "MID",
    country: "Spain",
    countryCode: "ES",
    club: "Barcelona",
    clubLogo: "https://crests.football-data.org/81.png",
    number: 8,
    image: "https://img.a.transfermarkt.technology/portrait/header/901307-1714042558.jpg",
    rating: 8.7,
    reason:
      "The metronome. His press resistance and spatial awareness dictated Spain's tempo — nobody completed more progressive passes in the tournament.",
    stats: "94% pass accuracy · 48 progressive passes · 2 assists",
  },
  {
    id: "mid3",
    name: "Bruno Fernandes",
    displayName: "Bruno",
    position: "MID",
    country: "Portugal",
    countryCode: "PT",
    club: "Man United",
    clubLogo: "https://resources.premierleague.com/premierleague/badges/50/t1.png",
    number: 8,
    image: "https://img.a.transfermarkt.technology/portrait/header/240306-1695021857.jpg",
    rating: 8.4,
    reason:
      "Set-piece wizard and creative fulcrum. Fernandes delivered when it mattered — his vision unlocked defenses and his work-rate off the ball surprised the doubters.",
    stats: "2 goals · 5 assists · 3 MOTM awards",
  },
  {
    id: "fwd1",
    name: "Vinícius Júnior",
    displayName: "Vinícius Jr",
    position: "FWD",
    country: "Brazil",
    countryCode: "BR",
    club: "Real Madrid",
    clubLogo: "https://crests.football-data.org/86.png",
    number: 7,
    image: "https://img.a.transfermarkt.technology/portrait/header/371998-1696838601.jpg",
    rating: 9.1,
    reason:
      "Unplayable on his day — and every day was his day this tournament. His explosive dribbling and finishing made him the most feared attacker in the competition.",
    stats: "5 goals · 3 assists · 24 successful dribbles",
  },
  {
    id: "fwd2",
    name: "Kylian Mbappé",
    displayName: "Mbappé",
    position: "FWD",
    country: "France",
    countryCode: "FR",
    club: "Real Madrid",
    clubLogo: "https://crests.football-data.org/86.png",
    number: 10,
    image: "https://img.a.transfermarkt.technology/portrait/header/342229-1694440528.jpg",
    rating: 9.3,
    reason:
      "The tournament's top scorer. His devastating pace on the counter and clinical finishing in big moments proved he's the heir to the throne.",
    stats: "8 goals · 2 assists · Golden Boot winner",
  },
  {
    id: "fwd3",
    name: "Lamine Yamal",
    displayName: "Yamal",
    position: "FWD",
    country: "Spain",
    countryCode: "ES",
    club: "Barcelona",
    clubLogo: "https://crests.football-data.org/81.png",
    number: 19,
    image: "https://img.a.transfermarkt.technology/portrait/header/766538-1701285552.jpg",
    rating: 8.9,
    reason:
      "Just 18, and already the most exciting talent on the planet. His inverted-winger craft from the right flank — curling assists and wonder-goals — made Spain tick in the final third.",
    stats: "3 goals · 4 assists · Young Player of the Tournament",
  },
];

export const WORLD_CUP_XI: TeamXI = {
  id: "wc-2026-tott",
  title: "Team of the Tournament",
  subtitle: "The Touchline Dribble's XI of the 2026 FIFA World Cup",
  context: {
    type: "tournament",
    tournament: "FIFA World Cup 2026",
    stage: "Full Tournament",
  },
  formationId: "4-3-3",
  players: wcPlayers,
  publishedAt: new Date().toISOString(),
  author: "The Touchline Dribble",
};

// ─── TOTW FACTORY ───────────────────────────────────────────

export function createTOTW(opts: {
  matchweek: number;
  season: string;
  league: LeagueId;
  dateRange?: string;
  formationId?: string;
  players: Omit<XIPlayer, "id" | "image" | "clubLogo">[];
  author?: string;
}): TeamXI {
  const leagueMeta = LEAGUES[opts.league];
  return {
    id: `totw-${opts.league}-mw${opts.matchweek}-${opts.season}`,
    title: `Team of the Week — MW${opts.matchweek}`,
    subtitle: `${leagueMeta.name} ${opts.season}${opts.dateRange ? ` · ${opts.dateRange}` : ""}`,
    context: {
      type: "totw",
      matchweek: opts.matchweek,
      season: opts.season,
      league: opts.league,
      dateRange: opts.dateRange,
    },
    formationId: opts.formationId ?? DEFAULT_FORMATION,
    players: opts.players.map((p) => ({
      ...p,
      id: `${opts.league}-mw${opts.matchweek}-${p.name.replace(/\\s+/g, "-").toLowerCase()}`,
      image: `/api/player-image?name=${encodeURIComponent(p.name)}`,
      clubLogo: `/api/club-logo?name=${encodeURIComponent(p.club)}`,
    })),
    publishedAt: new Date().toISOString(),
    author: opts.author ?? "The Touchline Dribble",
  };
}
