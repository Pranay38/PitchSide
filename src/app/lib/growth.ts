/** Shared, allowlisted analytics data. Never include email, user IDs or raw URLs. */
export const GROWTH_EVENTS = ["cta_view", "cta_subscribe", "cta_already_subscribed", "cta_subscribe_failed", "cta_support_click"] as const;
export type GrowthEventName = typeof GROWTH_EVENTS[number];
export type ReaderState = "subscriber" | "signed_in" | "guest";
export const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
export type Campaign = Partial<Record<typeof CAMPAIGN_KEYS[number], string>>;
export interface GrowthDetails {
  postId?: string;
  placement?: string;
  readerState: ReaderState;
  campaign?: Campaign;
}

// Campaigns use readable slugs, never arbitrary query strings or email addresses.
export function analyticsSlug(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,160}$/.test(value) ? value : undefined;
}

export function sanitizeCampaign(value: unknown): Campaign {
  const result: Campaign = {};
  if (!value || typeof value !== "object") return result;
  for (const key of CAMPAIGN_KEYS) {
    const slug = analyticsSlug((value as Record<string, unknown>)[key]);
    if (slug) result[key] = slug;
  }
  return result;
}
