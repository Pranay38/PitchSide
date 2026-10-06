"use client";
import { toast } from "sonner";
import { GMAIL_INBOX_GUIDANCE } from "../lib/newsletterDelivery";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useUserPreferences } from "./useUserPreferences";
import { newsletterSignup } from "../lib/newsletterSignup";
import { trackGrowthEvent } from "../lib/analytics";
import { observeExposure } from "../lib/visibleExposure";
import type { ReaderState } from "../lib/growth";

let visitPath = "";
const exposures = new Set<string>();
export function beginGrowthVisit(path: string) {
  if (visitPath !== path) { visitPath = path; exposures.clear(); }
}

export function useNewsletterTracking(placement: string, postId?: string) {
  const { isSignedIn } = useUser();
  const { newsletterOptIn } = useUserPreferences();
  const pathname = usePathname() || "/";
  const readerState: ReaderState = newsletterOptIn ? "subscriber" : isSignedIn ? "signed_in" : "guest";
  const [element, setElement] = useState<HTMLElement | null>(null);
  const exposureRef = useCallback((node: HTMLElement | null) => setElement(node), []);
  useEffect(() => {
    beginGrowthVisit(pathname);
    if (!element) return;
    const key = `${placement}:${postId || ""}`;
    if (exposures.has(key)) return;
    return observeExposure(element, () => {
      if (exposures.has(key)) return;
      exposures.add(key);
      trackGrowthEvent("cta_view", { placement, postId, readerState });
    });
  }, [element, placement, postId, readerState, pathname]);
  return {
    exposureRef,
    subscribe: async (body: Record<string, unknown>) => {
      const response = await newsletterSignup(body, { placement, postId, readerState });
      if (response.status === 201) {
        toast.info("A tip for your next newsletter", { description: GMAIL_INBOX_GUIDANCE, duration: 12000 });
      }
      return response;
    },
  };
}
