import {
  buildTransferTopic,
  getTransferTopicLabel,
  type TransferWatchEntry,
} from "./transferWatch";

export interface TransferReliabilityEntry extends TransferWatchEntry {
  topic: string;
  topicLabel: string;
  reliabilityScore: number;
  reliabilityLabel: string;
  boardLabel: string;
  rationale: string[];
}

function hoursSince(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  if (!Number.isFinite(diff)) return 9999;
  return diff / (1000 * 60 * 60);
}

export function scoreTransferReliability(entry: TransferWatchEntry): TransferReliabilityEntry {
  const ageHours = hoursSince(entry.updatedAt);
  let score = entry.status === "confirmed" ? 96 : 54;

  if (entry.feeMode === "million-usd") score += 8;
  if (ageHours <= 24) score += 8;
  else if (ageHours <= 72) score += 4;
  else if (ageHours >= 14 * 24) score -= 6;

  score = Math.max(20, Math.min(99, score));

  const reliabilityLabel = score >= 90
    ? "Locked"
    : score >= 75
      ? "Strong"
      : score >= 60
        ? "Watch"
        : "Thin";

  const boardLabel = entry.status === "confirmed"
    ? "Official move"
    : score >= 70
      ? "Rumor with traction"
      : "Early rumor";

  const rationale = [
    entry.status === "confirmed" ? "Marked as confirmed in admin." : "Still tagged as a rumor.",
    entry.feeMode === "million-usd" ? "A fee is attached, which makes the signal stronger." : "Fee not disclosed, so the signal is softer.",
    ageHours <= 72 ? "Updated recently." : "This item is getting older and needs refreshing.",
  ];

  return {
    ...entry,
    topic: buildTransferTopic(entry.player, entry.club),
    topicLabel: getTransferTopicLabel(entry),
    reliabilityScore: score,
    reliabilityLabel,
    boardLabel,
    rationale,
  };
}

export function buildTransferReliabilityBoard(entries: TransferWatchEntry[]): TransferReliabilityEntry[] {
  return entries
    .map((entry) => scoreTransferReliability(entry))
    .sort((left, right) => right.reliabilityScore - left.reliabilityScore);
}
