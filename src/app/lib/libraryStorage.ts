const SAVED_POSTS_KEY = "pitchside_saved_posts";
const FOLLOWED_CLUBS_KEY = "pitchside_followed_clubs";
const FOLLOWED_PLAYERS_KEY = "pitchside_followed_players";
const FOLLOWED_TRANSFERS_KEY = "pitchside_followed_transfers";
const SEEN_ALERTS_KEY = "pitchside_seen_alerts";

function normalizeValue(value: string): string {
  return value.trim();
}

function equalsIgnoreCase(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").map(normalizeValue).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]): void {
  try {
    const unique: string[] = [];
    for (const value of values.map(normalizeValue).filter(Boolean)) {
      if (!unique.some((item) => equalsIgnoreCase(item, value))) {
        unique.push(value);
      }
    }
    localStorage.setItem(key, JSON.stringify(unique));
  } catch {
    // Ignore localStorage failures.
  }
}

function toggleListValue(key: string, value: string): boolean {
  const normalized = normalizeValue(value);
  if (!normalized) return false;

  const current = readList(key);
  const exists = current.some((item) => equalsIgnoreCase(item, normalized));
  const next = exists
    ? current.filter((item) => !equalsIgnoreCase(item, normalized))
    : [normalized, ...current];
  writeList(key, next);
  return next.some((item) => equalsIgnoreCase(item, normalized));
}

export function getSavedPosts(): string[] {
  return readList(SAVED_POSTS_KEY);
}

export function isPostSaved(postId: string): boolean {
  return getSavedPosts().includes(postId);
}

export function toggleSavedPost(postId: string): boolean {
  const saved = getSavedPosts();
  const nextSaved = saved.includes(postId)
    ? saved.filter((id) => id !== postId)
    : [postId, ...saved];
  writeList(SAVED_POSTS_KEY, nextSaved);
  return nextSaved.includes(postId);
}

export function getFollowedClubs(): string[] {
  return readList(FOLLOWED_CLUBS_KEY);
}

export function isClubFollowed(club: string): boolean {
  return getFollowedClubs().some((item) => equalsIgnoreCase(item, club));
}

export function toggleFollowedClub(club: string): boolean {
  return toggleListValue(FOLLOWED_CLUBS_KEY, club);
}

export function getFollowedPlayers(): string[] {
  return readList(FOLLOWED_PLAYERS_KEY);
}

export function isPlayerFollowed(player: string): boolean {
  return getFollowedPlayers().some((item) => equalsIgnoreCase(item, player));
}

export function toggleFollowedPlayer(player: string): boolean {
  return toggleListValue(FOLLOWED_PLAYERS_KEY, player);
}

export function getFollowedTransfers(): string[] {
  return readList(FOLLOWED_TRANSFERS_KEY);
}

export function isTransferFollowed(transferTopic: string): boolean {
  return getFollowedTransfers().some((item) => equalsIgnoreCase(item, transferTopic));
}

export function toggleFollowedTransfer(transferTopic: string): boolean {
  return toggleListValue(FOLLOWED_TRANSFERS_KEY, transferTopic);
}

export function getSeenAlertIds(): string[] {
  return readList(SEEN_ALERTS_KEY);
}

export function hasSeenAlert(alertId: string): boolean {
  return getSeenAlertIds().includes(alertId);
}

export function markAlertsSeen(alertIds: string[]): void {
  writeList(SEEN_ALERTS_KEY, [...getSeenAlertIds(), ...alertIds]);
}
