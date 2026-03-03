export interface SiteSettings {
  socialWallEnabled: boolean;
  socialWallTitle: string;
  socialWallEmbedCode: string;
  updatedAt: string;
}

const SETTINGS_KEY = "pitchside_site_settings";
const API_BASE = "/api";

const DEFAULT_SETTINGS: SiteSettings = {
  socialWallEnabled: false,
  socialWallTitle: "Social Wall",
  socialWallEmbedCode: "",
  updatedAt: "",
};

function normalizeSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  return {
    socialWallEnabled: input?.socialWallEnabled ?? DEFAULT_SETTINGS.socialWallEnabled,
    socialWallTitle: (input?.socialWallTitle || DEFAULT_SETTINGS.socialWallTitle).trim(),
    socialWallEmbedCode: input?.socialWallEmbedCode || DEFAULT_SETTINGS.socialWallEmbedCode,
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
    headers: { "Content-Type": "application/json" },
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
