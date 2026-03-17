export type TransferWatchStatus = "confirmed" | "rumor";
export type TransferFeeMode = "million-usd" | "not-disclosed";

export interface TransferWatchEntry {
  id: string;
  player: string;
  club: string;
  feeMode: TransferFeeMode;
  feeMillions: number;
  status: TransferWatchStatus;
  updatedAt: string;
}

const TRANSFER_STATUSES: TransferWatchStatus[] = ["confirmed", "rumor"];
const TRANSFER_FEE_MODES: TransferFeeMode[] = ["million-usd", "not-disclosed"];

function normalizeClubName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function clampFee(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Number(parsed.toFixed(1));
}

export function buildTransferWatchId(player: string, club: string, updatedAt: string): string {
  return `${slugify(player)}-${slugify(club)}-${updatedAt.replace(/[^0-9]/g, "").slice(0, 14)}`;
}

export function buildTransferTopic(player: string, club: string): string {
  return `${slugify(player)}:${slugify(club)}`;
}

export function getTransferTopicLabel(entry: Pick<TransferWatchEntry, "player" | "club">): string {
  return `${entry.player} -> ${entry.club}`;
}

export function normalizeTransferWatchEntry(
  input?: Partial<TransferWatchEntry> | null,
): TransferWatchEntry | null {
  if (!input) return null;

  const player = String(input.player || "").trim();
  const club = String(input.club || "").trim();

  if (!player || !club) return null;

  const status = TRANSFER_STATUSES.includes(input.status as TransferWatchStatus)
    ? (input.status as TransferWatchStatus)
    : "rumor";
  const feeMode = TRANSFER_FEE_MODES.includes(input.feeMode as TransferFeeMode)
    ? (input.feeMode as TransferFeeMode)
    : "not-disclosed";
  const updatedAt = String(input.updatedAt || new Date().toISOString());
  const feeMillions = feeMode === "million-usd" ? clampFee(input.feeMillions) : 0;
  const id = String(input.id || buildTransferWatchId(player, club, updatedAt));

  return {
    id,
    player,
    club,
    feeMode,
    feeMillions,
    status,
    updatedAt,
  };
}

export function normalizeTransferWatchEntries(
  input?: Array<Partial<TransferWatchEntry>> | null,
): TransferWatchEntry[] {
  if (!Array.isArray(input)) return [];

  const deduped = new Map<string, TransferWatchEntry>();
  for (const item of input) {
    const normalized = normalizeTransferWatchEntry(item);
    if (!normalized) continue;
    deduped.set(normalized.id, normalized);
  }

  return Array.from(deduped.values()).sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function matchesTransferClub(entry: Pick<TransferWatchEntry, "club">, club: string): boolean {
  return normalizeClubName(entry.club) === normalizeClubName(club);
}

export function formatTransferWatchAmount(entry: Pick<TransferWatchEntry, "feeMode" | "feeMillions">): string {
  if (entry.feeMode === "not-disclosed") {
    return "Not disclosed";
  }

  return `$${entry.feeMillions}m`;
}
