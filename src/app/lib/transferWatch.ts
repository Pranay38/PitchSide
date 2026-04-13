export type TransferWatchStatus = "confirmed" | "rumor";
export type TransferFeeMode = "million-usd" | "million-eur" | "million-gbp" | "not-disclosed" | "free";
export type TransferRumorTier = 1 | 2 | 3 | 4 | 5 | null;

export interface TransferWatchEntry {
  id: string;
  player: string;
  playerImageUrl?: string;
  club: string;
  fromClub?: string;
  feeMode: TransferFeeMode;
  feeMillions: number;
  status: TransferWatchStatus;
  tier: TransferRumorTier;
  punchyLine?: string;
  myTake?: string;
  aiScore?: number;
  aiTake?: string;
  updatedAt: string;
}

const TRANSFER_STATUSES: TransferWatchStatus[] = ["confirmed", "rumor"];
const TRANSFER_FEE_MODES: TransferFeeMode[] = ["million-usd", "million-eur", "million-gbp", "not-disclosed", "free"];

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

function normalizeRumorTier(value: unknown, status: TransferWatchStatus): TransferRumorTier {
  if (status === "confirmed") return null;

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.max(1, Math.min(5, Math.round(parsed))) as 1 | 2 | 3 | 4 | 5;
}

export function buildTransferWatchId(player: string, club: string, updatedAt: string): string {
  return `${slugify(player)}-${slugify(club)}-${updatedAt.replace(/[^0-9]/g, "").slice(0, 14)}`;
}

export function buildTransferDossierSlug(entry: Pick<TransferWatchEntry, "player" | "club">): string {
  return `${slugify(entry.player)}-to-${slugify(entry.club)}`;
}

export function matchesTransferDossierSlug(
  entry: Pick<TransferWatchEntry, "player" | "club">,
  slug: string,
): boolean {
  return buildTransferDossierSlug(entry) === slug;
}

export function buildTransferTopic(player: string, club: string): string {
  return `${slugify(player)}:${slugify(club)}`;
}

export function getTransferTopicLabel(entry: Pick<TransferWatchEntry, "player" | "club">): string {
  return `${entry.player} -> ${entry.club}`;
}

export function getTransferTierLabel(tier: TransferRumorTier, status?: TransferWatchStatus): string {
  if (status === "confirmed") return "Confirmed";
  if (!tier) return "Tiered rumor";
  return `Tier ${tier}`;
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
  const tier = normalizeRumorTier(input.tier, status);
  const updatedAt = String(input.updatedAt || new Date().toISOString());
  const feeMillions = feeMode !== "not-disclosed" ? clampFee(input.feeMillions) : 0;
  const id = String(input.id || buildTransferWatchId(player, club, updatedAt));

  return {
    id,
    player,
    playerImageUrl: input.playerImageUrl ? String(input.playerImageUrl).trim() : undefined,
    club,
    fromClub: input.fromClub ? String(input.fromClub).trim() : undefined,
    feeMode,
    feeMillions,
    status,
    tier,
    punchyLine: typeof input.punchyLine === "string" ? input.punchyLine.trim() : undefined,
    myTake: typeof input.myTake === "string" ? input.myTake.trim() : undefined,
    aiScore: typeof input.aiScore === "number" ? input.aiScore : undefined,
    aiTake: typeof input.aiTake === "string" ? input.aiTake.trim() : undefined,
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
  if (entry.feeMode === "free") {
    return "Free Transfer";
  }

  if (entry.feeMode === "not-disclosed") {
    return "Not disclosed";
  }

  if (entry.feeMode === "million-eur") {
    return `€${entry.feeMillions}m`;
  }

  if (entry.feeMode === "million-gbp") {
    return `£${entry.feeMillions}m`;
  }

  return `$${entry.feeMillions}m`;
}
