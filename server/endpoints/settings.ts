import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security";
import { connectToDatabase } from "../_db";

const COLLECTION = "settings";
const SETTINGS_ID = "site-settings";

interface SiteSettings {
  socialWallEnabled: boolean;
  socialWallTitle: string;
  socialWallEmbedCode: string;
  pollOfWeek: {
    id: string;
    enabled: boolean;
    title: string;
    description: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
    }>;
    updatedAt: string;
  };
  clubIntelligence: Record<string, {
    club: string;
    xGPer90: number;
    xGAPer90: number;
    shotsOnTargetPer90: number;
    keyPassesPer90: number;
    progressivePassesPer90: number;
    progressiveCarriesPer90: number;
    possessionPct: number;
    tacklesWonPer90: number;
    interceptionsPer90: number;
    aerialWinPct: number;
    note: string;
    updatedAt: string;
  }>;
  transferWatch: Array<{
    id: string;
    player: string;
    playerImageUrl?: string;
    club: string;
    fromClub?: string;
    feeMode: "million-usd" | "million-eur" | "million-gbp" | "not-disclosed";
    feeMillions: number;
    status: "confirmed" | "rumor";
    tier: 1 | 2 | 3 | 4 | 5 | null;
    punchyLine?: string;
    updatedAt: string;
  }>;
  homepageCuration: {
    hero: {
      type: "post" | "story";
      id: string;
    };
    latestPostIds: string[];
    editorPickIds: string[];
    featuredStoryIds: string[];
    transferSpotlightIds: string[];
  };
  supplementalEvents: Array<{
    id: string;
    dateMMDD: string;
    year: number;
    text: string;
    category: "birthday" | "death" | "event" | "selected";
    thumbnail: string;
    articleUrl: string;
    updatedAt: string;
  }>;
  updatedAt: string;
}

interface SiteSettingsDoc extends SiteSettings {
  _id: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  socialWallEnabled: false,
  socialWallTitle: "Social Wall",
  socialWallEmbedCode: "",
  pollOfWeek: {
    id: "",
    enabled: false,
    title: "Poll of the Week",
    description: "",
    question: "",
    options: [
      { id: "option-1", text: "", votes: 0 },
      { id: "option-2", text: "", votes: 0 },
    ],
    updatedAt: "",
  },
  clubIntelligence: {},
  transferWatch: [],
  homepageCuration: {
    hero: { type: "post", id: "" },
    latestPostIds: [],
    editorPickIds: [],
    featuredStoryIds: [],
    transferSpotlightIds: [],
  },
  supplementalEvents: [],
  updatedAt: "",
};

function clampMetric(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

function normalizeClubIntelligenceMap(
  input?: SiteSettings["clubIntelligence"] | null,
): SiteSettings["clubIntelligence"] {
  if (!input || typeof input !== "object") return {};

  return Object.entries(input).reduce<SiteSettings["clubIntelligence"]>((acc, [key, value]) => {
    if (!value || typeof value !== "object") return acc;

    const club = String(value.club || key || "").trim();
    if (!club) return acc;

    acc[key] = {
      club,
      xGPer90: clampMetric(value.xGPer90),
      xGAPer90: clampMetric(value.xGAPer90),
      shotsOnTargetPer90: clampMetric(value.shotsOnTargetPer90),
      keyPassesPer90: clampMetric(value.keyPassesPer90),
      progressivePassesPer90: clampMetric(value.progressivePassesPer90),
      progressiveCarriesPer90: clampMetric(value.progressiveCarriesPer90),
      possessionPct: clampMetric(value.possessionPct),
      tacklesWonPer90: clampMetric(value.tacklesWonPer90),
      interceptionsPer90: clampMetric(value.interceptionsPer90),
      aerialWinPct: clampMetric(value.aerialWinPct),
      note: String(value.note || "").trim(),
      updatedAt: String(value.updatedAt || ""),
    };

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

function normalizeHomepageCuration(
  input?: Partial<SiteSettings["homepageCuration"]> | null,
): SiteSettings["homepageCuration"] {
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

function normalizeTransferWatch(
  input?: SiteSettings["transferWatch"] | null,
): SiteSettings["transferWatch"] {
  if (!Array.isArray(input)) return [];

  const normalized = input.reduce<SiteSettings["transferWatch"]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;

    const player = String(item.player || "").trim();
    const club = String(item.club || "").trim();
    if (!player || !club) return acc;

    acc.push({
      id: String(item.id || `${player}-${club}`),
      player,
      playerImageUrl: item.playerImageUrl ? String(item.playerImageUrl).trim() : undefined,
      club,
      fromClub: item.fromClub ? String(item.fromClub).trim() : undefined,
      feeMode: (["million-usd", "million-eur", "million-gbp", "not-disclosed"] as const).includes(item.feeMode) 
        ? item.feeMode 
        : "not-disclosed",
      feeMillions: item.feeMode !== "not-disclosed" ? clampMetric(item.feeMillions) : 0,
      status: item.status === "confirmed" ? "confirmed" : "rumor",
      tier: item.status === "confirmed"
        ? null
        : ([1, 2, 3, 4, 5].includes(Number(item.tier)) ? Number(item.tier) as 1 | 2 | 3 | 4 | 5 : 3),
      punchyLine: item.punchyLine ? String(item.punchyLine).trim() : undefined,
      updatedAt: String(item.updatedAt || ""),
    });

    return acc;
  }, []);

  return normalized.sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function normalizePollOfWeek(
  input?: SiteSettings["pollOfWeek"] | null,
): SiteSettings["pollOfWeek"] {
  const options = (Array.isArray(input?.options) ? input!.options : DEFAULT_SETTINGS.pollOfWeek.options)
    .slice(0, 5)
    .map((option, index) => ({
      id: String(option?.id || `option-${index + 1}`),
      text: String(option?.text || ""),
      votes: Math.max(0, Math.round(clampMetric(option?.votes))),
    }));

  while (options.length < 2) {
    options.push({
      id: `option-${options.length + 1}`,
      text: "",
      votes: 0,
    });
  }

  return {
    id: String(input?.id || DEFAULT_SETTINGS.pollOfWeek.id),
    enabled: input?.enabled ?? DEFAULT_SETTINGS.pollOfWeek.enabled,
    title: String(input?.title || DEFAULT_SETTINGS.pollOfWeek.title),
    description: String(input?.description || DEFAULT_SETTINGS.pollOfWeek.description),
    question: String(input?.question || DEFAULT_SETTINGS.pollOfWeek.question),
    options,
    updatedAt: String(input?.updatedAt || DEFAULT_SETTINGS.pollOfWeek.updatedAt),
  };
}

function normalizeSupplementalEvents(
  input?: SiteSettings["supplementalEvents"] | null,
): SiteSettings["supplementalEvents"] {
  if (!Array.isArray(input)) return [];

  const normalized = input.reduce<SiteSettings["supplementalEvents"]>((acc, item) => {
    if (!item || typeof item !== "object") return acc;

    const dateMMDD = String(item.dateMMDD || "").trim();
    if (!/^\d{2}-\d{2}$/.test(dateMMDD)) return acc;

    const categoryStr = String(item.category || "");
    const category = (["birthday", "death", "event", "selected"].includes(categoryStr)
      ? categoryStr
      : "event") as "birthday" | "death" | "event" | "selected";

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
  }, []);

  return normalized.sort((a, b) => b.year - a.year);
}

function normalizeSettings(input?: Partial<SiteSettings> | null): SiteSettings {
  return {
    socialWallEnabled: input?.socialWallEnabled ?? DEFAULT_SETTINGS.socialWallEnabled,
    socialWallTitle: (input?.socialWallTitle || DEFAULT_SETTINGS.socialWallTitle).trim(),
    socialWallEmbedCode: input?.socialWallEmbedCode || DEFAULT_SETTINGS.socialWallEmbedCode,
    pollOfWeek: normalizePollOfWeek(input?.pollOfWeek),
    clubIntelligence: normalizeClubIntelligenceMap(input?.clubIntelligence),
    transferWatch: normalizeTransferWatch(input?.transferWatch),
    homepageCuration: normalizeHomepageCuration(input?.homepageCuration),
    supplementalEvents: normalizeSupplementalEvents(input?.supplementalEvents),
    updatedAt: input?.updatedAt || DEFAULT_SETTINGS.updatedAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<SiteSettingsDoc>(COLLECTION);

    if (req.method === "GET") {
      const doc = await collection.findOne({ _id: SETTINGS_ID });
      const settings = normalizeSettings(doc || null);
      return res.status(200).json(settings);
    }

    if (req.method === "PUT") {
            if (!requireAuth(req, res)) return;
      const incoming = (req.body || {}) as Partial<SiteSettings>;
      const current = await collection.findOne({ _id: SETTINGS_ID });

      const next = normalizeSettings({
        ...(current || null),
        ...incoming,
        updatedAt: new Date().toISOString(),
      });

      await collection.updateOne(
        { _id: SETTINGS_ID },
        { $set: next },
        { upsert: true }
      );

      return res.status(200).json(next);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Settings API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
