import {
  type ClubIntelligence,
  getClubIntelligenceKey,
  normalizeClubIntelligence,
} from "./clubIntelligence";
import {
  type TransferWatchEntry,
  matchesTransferClub,
  normalizeTransferWatchEntries,
} from "./transferWatch";
import {
  type TransferSourceArticle,
  getTransferSourcesForDossier,
  normalizeTransferSourceArticles,
} from "./transferSources";
import {
  createDefaultPollOfWeek,
  normalizePollOfWeek,
  type PollOfWeek,
} from "./pollOfWeek";
import {
  type POTSSettings,
  createDefaultPOTSSettings,
  normalizePOTSSettings,
} from "./pots";

export interface SupplementalEvent {
  id: string;
  dateMMDD: string;
  year: number;
  text: string;
  category: "birthday" | "death" | "event" | "selected";
  thumbnail: string;
  articleUrl: string;
  updatedAt: string;
}

export interface HomepageHeroSelection {
  type: "post" | "story";
  id: string;
}

export interface HomepageCuration {
  hero: HomepageHeroSelection;
  latestPostIds: string[];
  editorPickIds: string[];
  featuredStoryIds: string[];
  transferSpotlightIds: string[];
}

export interface AuthorsTake {
  headline: string;
  body: string;
  enabled: boolean;
  updatedAt: string;
}

export interface FantasyPick {
  name: string;
  club: string;
  reason: string;
  imageUrl?: string;
}

export interface FantasyCorner {
  enabled: boolean;
  gameweek: number;
  deadline: string;
  captainPick: FantasyPick;
  differentialPick: FantasyPick;
}

export interface SiteSettings {
  socialWallEnabled: boolean;
  socialWallTitle: string;
  socialWallEmbedCode: string;
  pollOfWeek: PollOfWeek;
  pots: POTSSettings;
  clubIntelligence: Record<string, ClubIntelligence>;
  transferWatch: TransferWatchEntry[];
  transferSources: TransferSourceArticle[];
  homepageCuration: HomepageCuration;
  supplementalEvents: SupplementalEvent[];
  authorsTake: AuthorsTake;
  fantasyCorner: FantasyCorner;
  updatedAt: string;
}

const SETTINGS_KEY = "pitchside_site_settings";
const API_BASE = "/api";
const ADMIN_KEY = "pitchside_admin_auth";

const DEFAULT_SETTINGS: SiteSettings = {
  socialWallEnabled: false,
  socialWallTitle: "Social Wall",
  socialWallEmbedCode: "",
  pollOfWeek: createDefaultPollOfWeek(),
  pots: createDefaultPOTSSettings(),
  clubIntelligence: {},
  transferWatch: [],
  transferSources: [],
  homepageCuration: {
    hero: { type: "post", id: "" },
    latestPostIds: [],
    editorPickIds: [],
    featuredStoryIds: [],
    transferSpotlightIds: [],
  },
  supplementalEvents: [],
  authorsTake: {
    headline: "",
    body: "",
    enabled: false,
    updatedAt: "",
  },
  fantasyCorner: {
    enabled: false,
    gameweek: 1,
    deadline: "",
    captainPick: { name: "", club: "", reason: "" },
    differentialPick: { name: "", club: "", reason: "" },
  },
  updatedAt: "",
};

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_KEY);
  } catch {
    return null;
  }
}

function normalizeClubIntelligenceMap(
  input?: Record<string, Partial<ClubIntelligence>> | null,
): Record<string, ClubIntelligence> {
  if (!input || typeof input !== "object") return {};

  return Object.entries(input).reduce<Record<string, ClubIntelligence>>((acc, [key, value]) => {
    const normalized = normalizeClubIntelligence(value, value?.club || key);
    if (!normalized.club) return acc;
    acc[getClubIntelligenceKey(normalized.club)] = normalized;
    return acc;
  }, {});
}

function uniqueIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const ordered: string[] = [];

  values.forEach((value) => {
    const next = String(value || "").trim();
    if (!next || seen.has(next)) return;
    seen.add(next);
    ordered.push(next);
  });

  return ordered;
}

function normalizeHomepageCuration(input?: Partial<HomepageCuration> | null): HomepageCuration {
  return {
    hero: {
      type: input?.hero?.type === "story" ? "story" : "post",
      id: String(input?.hero?.id || "").trim(),
    },
    latestPostIds: uniqueIds(input?.latestPostIds),
    editorPickIds: uniqueIds(input?.editorPickIds),
    featuredStoryIds: uniqueIds(input?.featuredStoryIds),
    transferSpotlightIds: uniqueIds(input?.transferSpotlightIds),
  };
}

function normalizeSupplementalEvents(input?: SupplementalEvent[] | null): SupplementalEvent[] {
  if (!Array.isArray(input)) return [];
  return input.reduce<SupplementalEvent[]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;
    const dateMMDD = String(item.dateMMDD || "").trim();
    if (!/^\d{2}-\d{2}$/.test(dateMMDD)) return acc;

    const categoryStr = String(item.category || "");
    const category = (["birthday", "death", "event", "selected"].includes(categoryStr)
      ? categoryStr
      : "event") as SupplementalEvent["category"];

    const text = String(item.text || "").trim();
    if (!text) return acc;

    acc.push({
      id: String(item.id || `${dateMMDD}-${Date.now()}-${Math.random()}`),
      dateMMDD,
      year: typeof item.year === "number" ? item.year : Number(item.year) || new Date().getUTCFullYear(),
      text,
      category,
      thumbnail: String(item.thumbnail || "").trim(),
      articleUrl: String(item.articleUrl || "").trim(),
      updatedAt: String(item.updatedAt || ""),
    });
    return acc;
  }, []).sort((a, b) => b.year - a.year);
}

function normalizeAuthorsTake(input?: Partial<AuthorsTake> | null): AuthorsTake {
  return {
    headline: String(input?.headline || "").trim(),
    body: String(input?.body || "").trim(),
    enabled: input?.enabled ?? false,
    updatedAt: String(input?.updatedAt || ""),
  };
}

function normalizeFantasyCorner(input?: Partial<FantasyCorner> | null): FantasyCorner {
  return {
    enabled: input?.enabled ?? false,
    gameweek: Number(input?.gameweek) || 1,
    deadline: String(input?.deadline || "").trim(),
    captainPick: {
      name: String(input?.captainPick?.name || "").trim(),
      club: String(input?.captainPick?.club || "").trim(),
      reason: String(input?.captainPick?.reason || "").trim(),
      imageUrl: input?.captainPick?.imageUrl ? String(input?.captainPick?.imageUrl).trim() : undefined,
    },
    differentialPick: {
      name: String(input?.differentialPick?.name || "").trim(),
      club: String(input?.differentialPick?.club || "").trim(),
      reason: String(input?.differentialPick?.reason || "").trim(),
      imageUrl: input?.differentialPick?.imageUrl ? String(input?.differentialPick?.imageUrl).trim() : undefined,
    },
  };
}

function normalizeSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  return {
    socialWallEnabled: input?.socialWallEnabled ?? DEFAULT_SETTINGS.socialWallEnabled,
    socialWallTitle: (input?.socialWallTitle || DEFAULT_SETTINGS.socialWallTitle).trim(),
    socialWallEmbedCode: input?.socialWallEmbedCode || DEFAULT_SETTINGS.socialWallEmbedCode,
    pollOfWeek: normalizePollOfWeek(input?.pollOfWeek),
    pots: normalizePOTSSettings(input?.pots),
    clubIntelligence: normalizeClubIntelligenceMap(input?.clubIntelligence),
    transferWatch: normalizeTransferWatchEntries(input?.transferWatch),
    transferSources: normalizeTransferSourceArticles(input?.transferSources),
    homepageCuration: normalizeHomepageCuration(input?.homepageCuration),
    supplementalEvents: normalizeSupplementalEvents(input?.supplementalEvents),
    authorsTake: normalizeAuthorsTake(input?.authorsTake),
    fantasyCorner: normalizeFantasyCorner(input?.fantasyCorner),
    updatedAt: input?.updatedAt || DEFAULT_SETTINGS.updatedAt,
  };
}

async function isApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/settings`, { method: "OPTIONS" });
    return res.ok;
  } catch {
    return false;
  }
}

function saveSettingsLocal(settings: SiteSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore localStorage write issues
  }
}

function getSettingsLocal(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return normalizeSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function getSiteSettings(): SiteSettings {
  return getSettingsLocal();
}

export async function getSiteSettingsAsync(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) return getSettingsLocal();

    const payload = (await res.json()) as Partial<SiteSettings>;
    const normalized = normalizeSettings(payload);
    saveSettingsLocal(normalized);
    return normalized;
  } catch {
    return getSettingsLocal();
  }
}

function updateSiteSettingsLocal(updates: Partial<SiteSettings>): SiteSettings {
  const current = getSettingsLocal();
  const updated = normalizeSettings({
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  saveSettingsLocal(updated);
  return updated;
}

export async function updateSiteSettingsAsync(
  updates: Partial<SiteSettings>
): Promise<SiteSettings> {
  if (!(await isApiAvailable())) {
    return updateSiteSettingsLocal(updates);
  }

  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error("Failed to update site settings");
  }

  const payload = (await res.json()) as Partial<SiteSettings>;
  const normalized = normalizeSettings(payload);
  saveSettingsLocal(normalized);
  return normalized;
}

export function getClubIntelligence(club: string): ClubIntelligence | null {
  const settings = getSettingsLocal();
  return settings.clubIntelligence[getClubIntelligenceKey(club)] || null;
}

export async function getClubIntelligenceAsync(club: string): Promise<ClubIntelligence | null> {
  const settings = await getSiteSettingsAsync();
  return settings.clubIntelligence[getClubIntelligenceKey(club)] || null;
}

export function getTransferWatchEntries(club?: string): TransferWatchEntry[] {
  const settings = getSettingsLocal();
  if (!club) return settings.transferWatch;
  return settings.transferWatch.filter((entry) => matchesTransferClub(entry, club));
}

export async function getTransferWatchEntriesAsync(club?: string): Promise<TransferWatchEntry[]> {
  const settings = await getSiteSettingsAsync();
  if (!club) return settings.transferWatch;
  return settings.transferWatch.filter((entry) => matchesTransferClub(entry, club));
}

export function getTransferSources(): TransferSourceArticle[] {
  return getSettingsLocal().transferSources;
}

export async function getTransferSourcesAsync(): Promise<TransferSourceArticle[]> {
  return (await getSiteSettingsAsync()).transferSources;
}

export async function getTransferSourcesForDossierAsync(
  dossier: Pick<TransferSourceArticle, "dossierSlug" | "topic" | "player" | "club">,
): Promise<TransferSourceArticle[]> {
  const settings = await getSiteSettingsAsync();
  return getTransferSourcesForDossier(settings.transferSources, dossier);
}
