import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";

/**
 * useCloudSync – transparently syncs library data to the cloud for signed-in users.
 *
 * When a signed-in user visits the site, this hook:
 * 1. Fetches their cloud preferences from /api/user-prefs
 * 2. Merges them with any existing localStorage data (union of both)
 * 3. Writes the merged data back to both localStorage and the cloud
 *
 * This means a user can save a post on their phone and see it on their laptop.
 */

function useClerkUserId(): string | null {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

function readLocalList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((i: unknown): i is string => typeof i === "string") : [];
  } catch {
    return [];
  }
}

function writeLocalList(key: string, values: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify([...new Set(values)]));
  } catch {
    // Ignore localStorage failures
  }
}

function mergeUnique(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

export function useCloudSync() {
  const userId = useClerkUserId();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!userId || hasSynced.current) return;
    hasSynced.current = true;

    const syncData = async () => {
      try {
        // 1. Fetch cloud preferences
        const res = await fetch(`/api/user-prefs?userId=${userId}`);
        if (!res.ok) return;
        const cloud = await res.json();

        // 2. Merge with local data
        const mergedSaved = mergeUnique(readLocalList("pitchside_saved_posts"), cloud.savedPosts || []);
        const mergedClubs = mergeUnique(readLocalList("pitchside_followed_clubs"), cloud.followedClubs || []);
        const mergedPlayers = mergeUnique(readLocalList("pitchside_followed_players"), cloud.followedPlayers || []);

        // 3. Write merged data back to localStorage
        writeLocalList("pitchside_saved_posts", mergedSaved);
        writeLocalList("pitchside_followed_clubs", mergedClubs);
        writeLocalList("pitchside_followed_players", mergedPlayers);

        // 4. Push merged data back to the cloud
        await fetch("/api/user-prefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            savedPosts: mergedSaved,
            followedClubs: mergedClubs,
            followedPlayers: mergedPlayers,
          }),
        });
      } catch (err) {
        console.warn("Cloud sync failed:", err);
      }
    };

    syncData();
  }, [userId]);

  // Also sync when the user saves/follows something (debounced)
  useEffect(() => {
    if (!userId) return;

    const handleStorage = () => {
      // Debounce: wait 2 seconds after the last change before syncing
      const timeout = setTimeout(async () => {
        try {
          await fetch("/api/user-prefs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              savedPosts: readLocalList("pitchside_saved_posts"),
              followedClubs: readLocalList("pitchside_followed_clubs"),
              followedPlayers: readLocalList("pitchside_followed_players"),
            }),
          });
        } catch {
          // Background sync; fail silently
        }
      }, 2000);

      return () => clearTimeout(timeout);
    };

    // Listen for localStorage changes (from other tabs or same-tab writes)
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userId]);
}
