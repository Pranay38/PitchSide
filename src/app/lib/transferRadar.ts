import type { TransferReliabilityEntry } from "./transferReliability";
import { formatTransferWatchAmount, getTransferTierLabel } from "./transferWatch";

export interface TransferBoardStats {
  total: number;
  locked: number;
  strong: number;
  fresh: number;
  averageScore: number;
  topClub: string | null;
  biggestFeeLabel: string;
}

function getHoursSince(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  if (!Number.isFinite(diff)) return 9999;
  return diff / (1000 * 60 * 60);
}

function getTraitLabel(key: string): string {
  if (key === "finalThird") return "final-third punch";
  if (key === "defensiveIQ") return "defensive IQ";
  return key;
}

function pickTopTraits(entry: TransferReliabilityEntry): string[] {
  if (!entry.scoutGrades) return [];

  return Object.entries(entry.scoutGrades)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([key, value]) => `${getTraitLabel(key)} at ${value}/10`);
}

export function formatTransferUpdatedAt(updatedAt: string): string {
  const hours = getHoursSince(updatedAt);

  if (hours < 1) return "Updated just now";
  if (hours < 24) return `Updated ${Math.round(hours)}h ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return "Updated yesterday";
  if (days <= 7) return `Updated ${days}d ago`;

  return `Updated ${new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function buildTransferBoardStats(entries: TransferReliabilityEntry[]): TransferBoardStats {
  if (entries.length === 0) {
    return {
      total: 0,
      locked: 0,
      strong: 0,
      fresh: 0,
      averageScore: 0,
      topClub: null,
      biggestFeeLabel: "No fee disclosed",
    };
  }

  const locked = entries.filter((entry) => entry.status === "confirmed" || entry.reliabilityScore >= 90).length;
  const strong = entries.filter((entry) => entry.reliabilityScore >= 75).length;
  const fresh = entries.filter((entry) => getHoursSince(entry.updatedAt) <= 72).length;
  const averageScore = Math.round(entries.reduce((sum, entry) => sum + entry.reliabilityScore, 0) / entries.length);

  const clubCounts = new Map<string, number>();
  entries.forEach((entry) => {
    clubCounts.set(entry.club, (clubCounts.get(entry.club) || 0) + 1);
  });

  const topClub = Array.from(clubCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([club]) => club)[0] || null;

  const biggestFeeEntry = entries
    .filter((entry) => entry.feeMode !== "not-disclosed")
    .sort((left, right) => right.feeMillions - left.feeMillions)[0];

  return {
    total: entries.length,
    locked,
    strong,
    fresh,
    averageScore,
    topClub,
    biggestFeeLabel: biggestFeeEntry ? `${biggestFeeEntry.player} at ${formatTransferWatchAmount(biggestFeeEntry)}` : "No fee disclosed",
  };
}

export function buildTransferBoardBrief(entries: TransferReliabilityEntry[]): string {
  if (entries.length === 0) {
    return "Transfer Radar Pro is quiet right now. No active dossiers match the current filters, so the board is waiting for the next real market signal.";
  }

  const stats = buildTransferBoardStats(entries);
  const topEntries = entries.slice(0, 3).map((entry) => (
    `${entry.player} to ${entry.club} at ${entry.reliabilityScore} out of 99`
  ));
  const freshestEntry = [...entries].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )[0];

  return [
    `Transfer Radar Pro is tracking ${stats.total} active dossier${stats.total === 1 ? "" : "s"}.`,
    `${stats.locked} ${stats.locked === 1 ? "link is" : "links are"} locked or confirmed, and ${stats.fresh} ${stats.fresh === 1 ? "entry has" : "entries have"} been refreshed inside the last seventy two hours.`,
    `The strongest signals right now are ${topEntries.join(", ")}.`,
    stats.topClub ? `${stats.topClub} owns the busiest lane on the board.` : "",
    freshestEntry ? `${freshestEntry.player} to ${freshestEntry.club} is the freshest update on the radar.` : "",
  ].filter(Boolean).join(" ");
}

export function buildTransferDossierBrief(entry: TransferReliabilityEntry): string {
  const topTraits = pickTopTraits(entry);
  const latestContext = formatTransferUpdatedAt(entry.updatedAt).replace(/^Updated\s+/i, "").replace(/^\w/, (value) => value.toLowerCase());

  return [
    `${entry.player} to ${entry.club} is currently logged as ${getTransferTierLabel(entry.tier, entry.status).toLowerCase()}, carrying a ${entry.reliabilityScore} out of 99 board score and a ${entry.reliabilityLabel.toLowerCase()} read.`,
    entry.fromClub ? `The move would send ${entry.player} away from ${entry.fromClub} and into ${entry.club}.` : `${entry.club} is the club currently being linked most strongly.`,
    `The financial signal reads ${formatTransferWatchAmount(entry)}, and the dossier was ${latestContext}.`,
    topTraits.length > 0 ? `From the scouting profile, the strongest traits are ${topTraits.join(" and ")}.` : "",
    entry.myTake ? `Editorial take: ${entry.myTake}` : "",
    !entry.myTake && entry.aiTake ? `Model take: ${entry.aiTake}` : "",
    entry.punchyLine ? `Headline note: ${entry.punchyLine}` : "",
  ].filter(Boolean).join(" ");
}
