import { useEffect, useRef } from "react";

// Generates a stable session ID per browsing session
function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = sessionStorage.getItem("pitchside_session");
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("pitchside_session", id);
  }
  return id;
}

export function useReadingTracker(articleId: string | undefined) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!articleId || tracked.current) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    // Only track after reader has been on the page for 15 seconds
    // (avoids counting bounces as real reads)
    const timer = setTimeout(async () => {
      try {
        await fetch("/api/sys?route=recommendations-track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId, sessionId }),
        });
        tracked.current = true;
      } catch (err) {
        // Silently fail — tracking is non-critical
        console.warn("Tracking failed:", err);
      }
    }, 15_000); // 15 seconds

    return () => clearTimeout(timer);
  }, [articleId]);
}
