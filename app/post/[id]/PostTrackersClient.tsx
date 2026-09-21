"use client";

import { useEffect } from "react";
import { useReadingTracker } from "@/app/hooks/useReadingTracker";
import { useUserPreferences } from "@/app/hooks/useUserPreferences";
import { incrementMeteringCount } from "@/app/lib/metering";
import { usePostHog } from "posthog-js/react";

export function PostTrackersClient({ postId }: { postId: string }) {
  useReadingTracker(postId);
  const { addReadPost } = useUserPreferences();
  const posthog = usePostHog();

  useEffect(() => {
    addReadPost(postId);
    
    // Increment server-side metering
    incrementMeteringCount(postId).catch(console.error);

    // Track analytics event
    posthog?.capture("article_viewed", { postId });
  }, [postId, addReadPost, posthog]);

  return null;
}
