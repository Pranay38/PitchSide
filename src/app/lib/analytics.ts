/**
 * Google Analytics 4 — SPA page-view tracking.
 *
 * Because this is a single-page app, GA4's default "page_view" on script load
 * only fires once. We disable the automatic page_view in index.html
 * (send_page_view: false) and instead send a page_view event every time
 * React Router navigates.
 *
 * Usage: call `trackPageView()` in a router subscriber (see routes.tsx).
 */

import { analyticsSlug, sanitizeCampaign, type GrowthDetails, type GrowthEventName } from "./growth";
import { captureCampaign } from "./campaignAttribution";
export type { GrowthEventName } from "./growth";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID as string | undefined;

/** Send a GA4 page_view event for the current URL. */
export function trackPageView(url?: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("config", GA_ID, {
    page_path: url ?? window.location.pathname + window.location.search,
  });
}

/** Record a conversion event in GA4 and the first-party growth dashboard. */
export function trackGrowthEvent(
  event: GrowthEventName,
  details: GrowthDetails,
) {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem("pitchside_cookie_consent") === "declined") return;
  } catch { /* Storage may be blocked. */ }
  const postId = analyticsSlug(details.postId);
  const placement = analyticsSlug(details.placement) || (postId ? "article_end" : "newsletter");
  const campaign = sanitizeCampaign(details.campaign || captureCampaign());
  try {
    window.gtag?.("event", event, {
      ...(postId ? { article_id: postId } : {}),
      placement,
      reader_state: details.readerState,
      ...campaign,
    });
  } catch { /* Analytics cannot fail a successful signup. */ }
  void fetch("/api/growth-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({ event, postId, placement, readerState: details.readerState, campaign }),
  }).catch(() => undefined);
}

/** Editorial discovery events; no reader identifiers or free-text submissions. */
export function trackContentEvent(event: "homepage_article_click" | "learn_article_click" | "related_article_click" | "share_click" | "share_download", details: Record<string, string>) {
  if (typeof window !== "undefined") window.gtag?.("event", event, details);
}
