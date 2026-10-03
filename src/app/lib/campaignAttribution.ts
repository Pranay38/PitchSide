import { CAMPAIGN_KEYS, sanitizeCampaign, type Campaign } from "./growth";

const KEY = "ttd_campaign";

/** Last tagged landing in this tab; untagged internal navigation preserves it. */
export function captureCampaign(): Campaign {
  if (typeof window === "undefined") return {};
  try {
    if (window.localStorage.getItem("pitchside_cookie_consent") === "declined") {
      window.sessionStorage.removeItem(KEY);
      return {};
    }
    const params = new URLSearchParams(window.location.search);
    const incoming = sanitizeCampaign(Object.fromEntries(CAMPAIGN_KEYS.map(key => [key, params.get(key)])));
    if (Object.keys(incoming).length) {
      window.sessionStorage.setItem(KEY, JSON.stringify(incoming));
      return incoming;
    }
    return sanitizeCampaign(JSON.parse(window.sessionStorage.getItem(KEY) || "{}"));
  } catch {
    // A browser that blocks storage must still be able to subscribe.
    return {};
  }
}
