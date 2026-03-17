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
  createDefaultPollOfWeek,
  normalizePollOfWeek,
  type PollOfWeek,
} from "./pollOfWeek";

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

export interface SiteSettings {
  socialWallEnabled: boolean;
  socialWallTitle: string;
  socialWallEmbedCode: string;
  pollOfWeek: PollOfWeek;
  clubIntelligence: Record<string, ClubIntelligence>;
  transferWatch: TransferWatchEntry[];
  supplementalEvents: SupplementalEvent[];
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
  clubIntelligence: {},
  transferWatch: [],
  supplementalEvents: [],
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

function normalizeSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  return {
    socialWallEnabled: input?.socialWallEnabled ?? DEFAULT_SETTINGS.socialWallEnabled,
    socialWallTitle: (input?.socialWallTitle || DEFAULT_SETTINGS.socialWallTitle).trim(),
    socialWallEmbedCode: input?.socialWallEmbedCode || DEFAULT_SETTINGS.socialWallEmbedCode,
    pollOfWeek: normalizePollOfWeek(input?.pollOfWeek),
    clubIntelligence: normalizeClubIntelligenceMap(input?.clubIntelligence),
    transferWatch: normalizeTransferWatchEntries(input?.transferWatch),
    supplementalEvents: normalizeSupplementalEvents(input?.supplementalEvents),
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
