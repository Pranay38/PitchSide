export interface ClubFixture {
  id: number;
  utcDate: string;
  status: string;
  competition?: { name?: string; emblem?: string };
  homeTeam: { name: string; crest?: string };
  awayTeam: { name: string; crest?: string };
  score: { home: number | null; away: number | null };
}

interface ClubFixtureWindow {
  daysBack?: number;
  daysForward?: number;
}

const LEAGUE_CODE_MAP: Record<string, string> = {
  "Premier League": "PL",
  "English Premier League": "PL",
  "La Liga": "PD",
  "Spanish La Liga": "PD",
  "Primera Division": "PD",
  Bundesliga: "BL1",
  "German Bundesliga": "BL1",
  "Serie A": "SA",
  "Italian Serie A": "SA",
  "Ligue 1": "FL1",
  "French Ligue 1": "FL1",
};

const CLUB_ALIASES: Record<string, string[]> = {
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

function normalizeClubName(value: string): string {
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

function expandClubTokens(value: string): string {
  const normalized = normalizeClubName(value);
  const expandedTokens = normalized
    .split(" ")
    .flatMap((token) => TOKEN_REPLACEMENTS[token] || [token]);

  return expandedTokens.join(" ").trim().replace(/\s+/g, " ");
}

function canonicalClubName(value: string): string {
  const normalized = expandClubTokens(value);
  const canonicalEntry = Object.entries(CLUB_ALIASES).find(([canonical, aliases]) => {
    const allNames = [canonical, ...aliases].map(expandClubTokens);
    return allNames.includes(normalized);
  });

  return canonicalEntry ? expandClubTokens(canonicalEntry[0]) : normalized;
}

function clubTokens(value: string): string[] {
  return canonicalClubName(value)
    .split(" ")
    .filter(Boolean);
}

export function getLeagueCodeForClubLeague(league?: string | null): string {
  const rawLeague = String(league || "").trim();
  if (LEAGUE_CODE_MAP[rawLeague]) {
    return LEAGUE_CODE_MAP[rawLeague];
  }

  const normalizedLeague = normalizeClubName(rawLeague);
  if (normalizedLeague.includes("premier") || normalizedLeague.includes("english")) return "PL";
  if (normalizedLeague.includes("la liga") || normalizedLeague.includes("spanish") || normalizedLeague.includes("primera")) return "PD";
  if (normalizedLeague.includes("bundesliga") || normalizedLeague.includes("german")) return "BL1";
  if (normalizedLeague.includes("serie a") || normalizedLeague.includes("italian")) return "SA";
  if (normalizedLeague.includes("ligue 1") || normalizedLeague.includes("french")) return "FL1";

  return "PL";
}

export function clubsMatch(left: string, right: string): boolean {
  const normalizedLeft = canonicalClubName(left);
  const normalizedRight = canonicalClubName(right);
  const leftTokens = clubTokens(left);
  const rightTokens = clubTokens(right);
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

async function getClubFixturesForWindow(
  clubName: string,
  league: string,
  window: ClubFixtureWindow,
  signal?: AbortSignal,
): Promise<ClubFixture[]> {
  const leagueCode = getLeagueCodeForClubLeague(league);
  const dateFrom = new Date();
  const dateTo = new Date();
  const daysBack = Math.max(0, window.daysBack || 0);
  const daysForward = Math.max(0, window.daysForward || 0);
  dateFrom.setDate(dateFrom.getDate() - daysBack);
  dateTo.setDate(dateTo.getDate() + daysForward);

  const params = new URLSearchParams({
    competition: leagueCode,
    team: clubName,
    mode: "custom",
    dateFrom: dateFrom.toISOString().split("T")[0],
    dateTo: dateTo.toISOString().split("T")[0],
  });

  const res = await fetch(`/api/fixtures?${params.toString()}`, { signal });

  if (!res.ok) {
    throw new Error("Failed to fetch club fixtures");
  }

  const data = await res.json();
  const matches = Array.isArray(data.matches) ? (data.matches as ClubFixture[]) : [];

  return matches
    .filter((match) => clubsMatch(match.homeTeam.name, clubName) || clubsMatch(match.awayTeam.name, clubName))
    .sort((left, right) => new Date(left.utcDate).getTime() - new Date(right.utcDate).getTime());
}

export async function getUpcomingFixturesForClub(
  clubName: string,
  league: string,
  signal?: AbortSignal,
): Promise<ClubFixture[]> {
  const now = Date.now();
  const matches = await getClubFixturesForWindow(
    clubName,
    league,
    { daysBack: 0, daysForward: 21 },
    signal,
  );

  return matches.filter((match) => new Date(match.utcDate).getTime() >= now);
}

export async function getRecentFixturesForClub(
  clubName: string,
  league: string,
  signal?: AbortSignal,
): Promise<ClubFixture[]> {
  const now = Date.now();
  const matches = await getClubFixturesForWindow(
    clubName,
    league,
    { daysBack: 7, daysForward: 0 },
    signal,
  );

  return matches
    .filter((match) => new Date(match.utcDate).getTime() <= now)
    .sort((left, right) => new Date(right.utcDate).getTime() - new Date(left.utcDate).getTime());
}

export async function getLiveFixturesForClub(
  clubName: string,
  league: string,
  signal?: AbortSignal,
): Promise<ClubFixture[]> {
  const liveStatuses = new Set(["LIVE", "IN_PLAY", "PAUSED"]);
  const matches = await getClubFixturesForWindow(
    clubName,
    league,
    { daysBack: 1, daysForward: 1 },
    signal,
  );

  return matches.filter((match) => liveStatuses.has(String(match.status || "").toUpperCase()));
}
