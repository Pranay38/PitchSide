import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  applyCors,
  checkOrigin,
  checkRateLimit,
  requireAuth,
} from "../utils/security";
import {
  getTransferSourceLabel,
  inferTransferSourceOutlet,
  inferTransferSourceStance,
  type TransferSourcePreview,
} from "../../src/app/lib/transferSources";
import { buildTransferDossierSlug, buildTransferTopic } from "../../src/app/lib/transferWatch";

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function cleanText(value: string): string {
  return decodeHtmlEntities(value.replace(/\s+/g, " ").trim());
}

function matchMeta(html: string, key: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }

  return "";
}

function matchLink(html: string, rel: string): string {
  const patterns = [
    new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, "i"),
    new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${rel}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }

  return "";
}

function matchTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? cleanText(match[1]) : "";
}

function inferPaywall(url: string, html: string): boolean {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  })();

  if (host.includes("theathletic.")) return true;

  const lowered = html.toLowerCase();
  return (
    lowered.includes("subscribe to continue") ||
    lowered.includes("subscriber-only") ||
    lowered.includes("subscribers only") ||
    lowered.includes("sign in to read")
  );
}

async function buildPreview(url: string): Promise<TransferSourcePreview & {
  claimSummary: string;
  stance: "advances" | "confirms" | "analysis" | "contradicts" | "official";
}> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PitchsideTransferDesk/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Source fetch failed with status ${response.status}`);
  }

  const html = await response.text();
  const title = matchMeta(html, "og:title") || matchMeta(html, "twitter:title") || matchTitle(html);
  const canonicalUrl = matchLink(html, "canonical") || url;
  const siteName = matchMeta(html, "og:site_name");
  const author = matchMeta(html, "author") || matchMeta(html, "article:author");
  const publishedAt = matchMeta(html, "article:published_time") || matchMeta(html, "og:published_time");
  const description = matchMeta(html, "description") || matchMeta(html, "og:description");
  const sourceOutlet = inferTransferSourceOutlet(canonicalUrl, siteName);
  const sourceLabel = siteName || getTransferSourceLabel(sourceOutlet);
  const stance = inferTransferSourceStance(title, description);
  const claimSummary = description || title;

  return {
    url,
    canonicalUrl,
    title,
    sourceOutlet,
    sourceLabel,
    reporter: author || undefined,
    publishedAt: publishedAt || undefined,
    paywalled: inferPaywall(canonicalUrl, html),
    claimSummary,
    stance,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (!checkRateLimit(req, res)) return;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!checkOrigin(req, res)) return;
  if (!(await requireAuth(req, res))) return;

  try {
    const url = String(req.body?.url || "").trim();
    const player = String(req.body?.player || "").trim();
    const club = String(req.body?.club || "").trim();

    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "A valid URL is required." });
    }

    const preview = await buildPreview(url);
    const dossierSlug = player && club ? buildTransferDossierSlug({ player, club }) : "";
    const topic = player && club ? buildTransferTopic(player, club) : "";

    return res.status(200).json({
      preview,
      draft: player && club ? {
        dossierSlug,
        topic,
        player,
        club,
        url: preview.url,
        canonicalUrl: preview.canonicalUrl,
        title: preview.title,
        sourceOutlet: preview.sourceOutlet,
        sourceLabel: preview.sourceLabel,
        reporter: preview.reporter,
        publishedAt: preview.publishedAt,
        paywalled: preview.paywalled,
        claimSummary: preview.claimSummary,
        stance: preview.stance,
      } : null,
    });
  } catch (error: any) {
    console.error("Transfer Source Preview API Error:", error);
    return res.status(500).json({ error: error?.message || "Failed to preview source URL." });
  }
}
