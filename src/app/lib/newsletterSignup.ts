import { trackGrowthEvent } from "./analytics";
import { captureCampaign } from "./campaignAttribution";
import type { GrowthDetails } from "./growth";

/** Retains the Response interface used by existing signup forms. */
export async function newsletterSignup(body: Record<string, unknown>, details: GrowthDetails): Promise<Response> {
  const campaign = captureCampaign();
  const context = { ...details, campaign };
  let response: Response;
  try {
    response = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ ...body, source: details.postId ? `article:${details.postId}` : details.placement, campaign }),
    });
  } catch (error) {
    trackGrowthEvent("cta_subscribe_failed", context);
    throw error;
  }
  const result = await response.clone().json().catch(() => null);
  const valid = result && typeof result === "object" && !Array.isArray(result)
    && (response.status === 201 || result.alreadySubscribed === true);
  const outcome = !response.ok || !valid
    ? "cta_subscribe_failed"
    : result.alreadySubscribed ? "cta_already_subscribed" : "cta_subscribe";
  trackGrowthEvent(outcome, context);
  if (response.ok && !valid) throw new Error("Could not confirm your subscription. Please try again.");
  return response;
}
