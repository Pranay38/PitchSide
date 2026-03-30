"use client";

import { useEffect } from "react";
import { useReadingTracker } from "@/app/hooks/useReadingTracker";
import { useUserPreferences } from "@/app/hooks/useUserPreferences";

export function PostTrackersClient({ postId }: { postId: string }) {
  useReadingTracker(postId);
  const { addReadPost } = useUserPreferences();

  useEffect(() => {
    addReadPost(postId);
  }, [postId, addReadPost]);

  return null;
}
