import { buildTransferDossierSlug, buildTransferTopic } from "./transferWatch";

export type TransferSourceOutlet =
  | "bbc"
  | "espn"
  | "the-athletic"
  | "sky-sports"
  | "guardian"
  | "club-official"
  | "reporter"
  | "other";

export type TransferSourceStance =
  | "advances"
  | "confirms"
  | "analysis"
  | "contradicts"
  | "official";

export interface TransferSourceArticle {
  id: string;
  dossierSlug: string;
  topic: string;
  player: string;
  club: string;
  sourceOutlet: TransferSourceOutlet;
  sourceLabel: string;
  url: string;
  canonicalUrl: string;
  title: string;
  reporter?: string;
  publishedAt: string;
  discoveredAt: string;
  stance: TransferSourceStance;
  claimSummary: string;
  sourceTier?: 1 | 2 | 3 | 4 | 5;
  paywalled?: boolean;
  isPrimaryReport?: boolean;
  notes?: string;
}

export interface TransferSourceSnapshot {
  coverageCount: number;
  lastExternalUpdateAt?: string;
  consensusLabel: "Low" | "Mixed" | "Strong";
  confirmingCount: number;
  contradictingCount: number;
  officialCount: number;
  primarySource?: string;
}

export interface TransferSourcePreview {
  url: string;
  canonicalUrl: string;
  title: string;
  sourceOutlet: TransferSourceOutlet;
  sourceLabel: string;
  reporter?: string;
  publishedAt?: string;
  paywalled?: boolean;
}

const SOURCE_OUTLETS: TransferSourceOutlet[] = [
  "bbc",
  "espn",
  "the-athletic",
  "sky-sports",
  "guardian",
  "club-official",
  "reporter",
  "other",
];

const SOURCE_STANCES: TransferSourceStance[] = [
  "advances",
  "confirms",
  "analysis",
  "contradicts",
  "official",
];

const SOURCE_LABELS: Record<TransferSourceOutlet, string> = {
  bbc: "BBC Sport",
  espn: "ESPN",
  "the-athletic": "The Athletic",
  "sky-sports": "Sky Sports",
  guardian: "The Guardian",
  "club-official": "Official Club",
  reporter: "Reporter",
  other: "Other Source",
};

const SOURCE_STANCE_LABELS: Record<TransferSourceStance, string> = {
  advances: "Advances",
  confirms: "Confirms",
  analysis: "Analysis",
  contradicts: "Contradicts",
  official: "Official",
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function inferTransferSourceOutlet(url: string, label?: string): TransferSourceOutlet {
  const host = getHostname(url);
  const normalizedLabel = trimString(label).toLowerCase();

  if (host.includes("bbc.") || normalizedLabel.includes("bbc")) return "bbc";
  if (host.includes("espn.") || normalizedLabel.includes("espn")) return "espn";
  if (host.includes("theathletic.") || normalizedLabel.includes("athletic")) return "the-athletic";
  if (host.includes("skysports.") || normalizedLabel.includes("sky sports")) return "sky-sports";
  if (host.includes("theguardian.") || host.includes("guardian.") || normalizedLabel.includes("guardian")) return "guardian";
  if (host.includes("fc.") || host.includes("club") || normalizedLabel.includes("official")) return "club-official";
  return "other";
}

export function getTransferSourceLabel(outlet: TransferSourceOutlet): string {
  return SOURCE_LABELS[outlet];
}

export function getTransferSourceStanceLabel(stance: TransferSourceStance): string {
  return SOURCE_STANCE_LABELS[stance];
}

export function inferTransferSourceStance(title: string, summary = ""): TransferSourceStance {
  const haystack = `${title} ${summary}`.toLowerCase();
  if (/\bofficial\b|\bannounce|\bannounced\b|\bconfirmed by\b/.test(haystack)) return "official";
  if (/\bconfirm|\bhere we go\b|\bagreement\b|\bagreed\b/.test(haystack)) return "confirms";
  if (/\bunlikely\b|\bends\b|\bcools\b|\bnot interested\b|\bno move\b|\bwon't\b|\bwill not\b/.test(haystack)) return "contradicts";
  if (/\bclose\b|\btalks\b|\bset to\b|\bleading\b|\btarget\b|\blinked\b|\brace\b/.test(haystack)) return "advances";
  return "analysis";
}

export function buildTransferSourceId(input: {
  dossierSlug: string;
  sourceOutlet: TransferSourceOutlet;
  title: string;
  canonicalUrl: string;
}): string {
  const urlToken = slugify(input.canonicalUrl).slice(0, 24);
  const titleToken = slugify(input.title).slice(0, 40);
  return `${input.dossierSlug}-${input.sourceOutlet}-${titleToken || urlToken || "source"}`;
}

function normalizeTier(value: unknown): 1 | 2 | 3 | 4 | 5 | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const tier = Math.max(1, Math.min(5, Math.round(parsed))) as 1 | 2 | 3 | 4 | 5;
  return tier;
}

function normalizePublishedAt(value: unknown): string {
  const raw = trimString(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function normalizeOutlet(value: unknown, url: string, label?: string): TransferSourceOutlet {
  const raw = trimString(value) as TransferSourceOutlet;
  if (SOURCE_OUTLETS.includes(raw)) return raw;
  return inferTransferSourceOutlet(url, label);
}

function normalizeStance(value: unknown): TransferSourceStance {
  const raw = trimString(value) as TransferSourceStance;
  if (SOURCE_STANCES.includes(raw)) return raw;
  return "analysis";
}

export function normalizeTransferSourceArticle(
  input?: Partial<TransferSourceArticle> | null,
): TransferSourceArticle | null {
  if (!input) return null;

  const player = trimString(input.player);
  const club = trimString(input.club);
  const rawUrl = trimString(input.canonicalUrl) || trimString(input.url);
  if (!player || !club || !rawUrl) return null;

  const canonicalUrl = rawUrl;
  const url = trimString(input.url) || canonicalUrl;
  const sourceOutlet = normalizeOutlet(input.sourceOutlet, canonicalUrl, input.sourceLabel);
  const sourceLabel = trimString(input.sourceLabel) || getTransferSourceLabel(sourceOutlet);
  const dossierSlug = trimString(input.dossierSlug) || buildTransferDossierSlug({ player, club });
  const topic = trimString(input.topic) || buildTransferTopic(player, club);
  const title = trimString(input.title) || sourceLabel;
  const publishedAt = normalizePublishedAt(input.publishedAt);
  const discoveredAt = normalizePublishedAt(input.discoveredAt) || new Date().toISOString();

  return {
    id: trimString(input.id) || buildTransferSourceId({ dossierSlug, sourceOutlet, title, canonicalUrl }),
    dossierSlug,
    topic,
    player,
    club,
    sourceOutlet,
    sourceLabel,
    url,
    canonicalUrl,
    title,
    reporter: trimString(input.reporter) || undefined,
    publishedAt,
    discoveredAt,
    stance: normalizeStance(input.stance),
    claimSummary: trimString(input.claimSummary),
    sourceTier: normalizeTier(input.sourceTier),
    paywalled: input.paywalled === true,
    isPrimaryReport: input.isPrimaryReport === true,
    notes: trimString(input.notes) || undefined,
  };
}

export function normalizeTransferSourceArticles(
  input?: Array<Partial<TransferSourceArticle>> | null,
): TransferSourceArticle[] {
  if (!Array.isArray(input)) return [];

  const deduped = new Map<string, TransferSourceArticle>();
  for (const item of input) {
    const normalized = normalizeTransferSourceArticle(item);
    if (!normalized) continue;
    deduped.set(normalized.id, normalized);
  }

  return Array.from(deduped.values()).sort((left, right) => {
    const rightTime = new Date(right.publishedAt || right.discoveredAt).getTime();
    const leftTime = new Date(left.publishedAt || left.discoveredAt).getTime();
    return rightTime - leftTime;
  });
}

export function getTransferSourcesForDossier(
  sources: TransferSourceArticle[],
  dossier: Pick<TransferSourceArticle, "dossierSlug" | "topic" | "player" | "club">,
): TransferSourceArticle[] {
  const dossierSlug = trimString(dossier.dossierSlug);
  const topic = trimString(dossier.topic);
  const player = trimString(dossier.player).toLowerCase();
  const club = trimString(dossier.club).toLowerCase();

  return sources.filter((source) => {
    if (source.dossierSlug === dossierSlug) return true;
    if (topic && source.topic === topic) return true;
    return source.player.toLowerCase() === player && source.club.toLowerCase() === club;
  });
}

export function buildTransferSourceSnapshot(sources: TransferSourceArticle[]): TransferSourceSnapshot {
  if (sources.length === 0) {
    return {
      coverageCount: 0,
      consensusLabel: "Low",
      confirmingCount: 0,
      contradictingCount: 0,
      officialCount: 0,
    };
  }

  const confirmingCount = sources.filter((source) => source.stance === "confirms" || source.stance === "advances").length;
  const contradictingCount = sources.filter((source) => source.stance === "contradicts").length;
  const officialCount = sources.filter((source) => source.stance === "official").length;
  const lastExternalUpdateAt = sources
    .map((source) => source.publishedAt || source.discoveredAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  let consensusLabel: TransferSourceSnapshot["consensusLabel"] = "Low";
  if (officialCount > 0 || (confirmingCount >= 3 && contradictingCount === 0)) {
    consensusLabel = "Strong";
  } else if (confirmingCount >= 2 || contradictingCount > 0) {
    consensusLabel = "Mixed";
  }

  const primarySource =
    sources.find((source) => source.isPrimaryReport)?.sourceLabel ||
    sources.find((source) => source.stance === "official")?.sourceLabel ||
    sources[0]?.sourceLabel;

  return {
    coverageCount: sources.length,
    lastExternalUpdateAt,
    consensusLabel,
    confirmingCount,
    contradictingCount,
    officialCount,
    primarySource,
  };
}

export function formatTransferSourceDate(value?: string): string {
  if (!value) return "Date not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date not available";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
