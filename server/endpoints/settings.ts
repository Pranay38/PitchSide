import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security.js";
import { connectToDatabase } from "../_db.js";

const COLLECTION = "settings";
const SETTINGS_ID = "site-settings";

interface SiteSettings {
  socialWallEnabled: boolean;
  socialWallTitle: string;
  socialWallEmbedCode: string;
  updatedAt: string;
}

interface SiteSettingsDoc extends SiteSettings {
  _id: string;
}

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
