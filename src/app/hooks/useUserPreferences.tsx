import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { safeParse, UserPreferencesSchema } from "../lib/schemas";

interface UserPreferences {
  savedPosts: string[];
  followedClubs: string[];
  followedPlayers: string[];
  followedTransfers: string[];
  followedTags: string[];
  seenAlerts: string[];
  fanClub: { name: string; logoUrl: string | null; league?: string } | null;
  newsletterOptIn: boolean;
  readingHistory: { postId: string; viewedAt: number }[];
}

interface UserPreferencesContextType extends UserPreferences {
  toggleSavedPost: (postId: string) => boolean;
  toggleFollowedClub: (club: string) => boolean;
  toggleFollowedPlayer: (player: string) => boolean;
  toggleFollowedTransfer: (transferTopic: string) => boolean;
  toggleFollowedTag: (tag: string) => boolean;
  markAlertsSeen: (alertIds: string[]) => void;
  setFanClub: (club: { name: string; logoUrl: string | null; league?: string } | null) => void;
  setNewsletterOptIn: (optIn: boolean) => void;
  isPostSaved: (postId: string) => boolean;
  isClubFollowed: (club: string) => boolean;
  isPlayerFollowed: (player: string) => boolean;
  isTransferFollowed: (transferTopic: string) => boolean;
  isTagFollowed: (tag: string) => boolean;
  hasSeenAlert: (alertId: string) => boolean;
  addReadPost: (postId: string) => void;
  loading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

const EMPTY_PREFS: UserPreferences = {
  savedPosts: [],
  followedClubs: [],
  followedPlayers: [],
  followedTransfers: [],
  followedTags: [],
  seenAlerts: [],
  fanClub: null,
  newsletterOptIn: false,
  readingHistory: [],
};

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const userId = user?.id;
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";

  const [prefs, setPrefs] = useState<UserPreferences>({ ...EMPTY_PREFS });
  const [loading, setLoading] = useState(true);

  const fetchNewsletterOptIn = async (email?: string): Promise<boolean> => {
    const params = new URLSearchParams({ action: "status" });
    if (email) {
      params.set("email", email);
    }

    const res = await fetch(`/api/subscribers?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch subscriber status");
    }

    const data = await res.json().catch(() => ({}));
    return data.subscribed === true;
  };

  // Fetch initial preferences on mount/login
  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      setLoading(true);

      if (!userId) {
        try {
          const subscribed = await fetchNewsletterOptIn();
          if (!cancelled) {
            setPrefs({ ...EMPTY_PREFS, newsletterOptIn: subscribed });
          }
        } catch {
          if (!cancelled) {
            setPrefs({ ...EMPTY_PREFS });
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
        return;
      }

      const [prefsResult, newsletterResult] = await Promise.allSettled([
        fetch(`/api/user-prefs?userId=${userId}&_t=${Date.now()}`, {
          cache: "no-store",
          credentials: "same-origin",
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to fetch preferences");
          return res.json();
        }),
        fetchNewsletterOptIn(userEmail || undefined),
      ]);

      const validated =
        prefsResult.status === "fulfilled"
          ? safeParse(UserPreferencesSchema, prefsResult.value, EMPTY_PREFS)
          : EMPTY_PREFS;
      const newsletterOptIn =
        validated.newsletterOptIn ||
        (newsletterResult.status === "fulfilled" ? newsletterResult.value : false);

      if (!cancelled) {
        setPrefs({
          savedPosts: validated.savedPosts,
          followedClubs: validated.followedClubs,
          followedPlayers: validated.followedPlayers,
          followedTransfers: validated.followedTransfers,
          followedTags: validated.followedTags,
          seenAlerts: validated.seenAlerts,
          fanClub: validated.fanClub,
          newsletterOptIn,
          readingHistory: validated.readingHistory,
        });
        setLoading(false);
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [userEmail, userId]);

  const toggleArrayItem = (arr: string[], item: string) => {
    const normalized = normalizeValue(item);
    const exists = arr.some((i) => normalizeValue(i) === normalized);
    if (exists) {
      return arr.filter((i) => normalizeValue(i) !== normalized);
    }
    return [normalized, ...arr];
  };

  const updateServer = async (newPrefs: UserPreferences) => {
    if (!userId) return; // Silent if not logged in

    try {
      await fetch("/api/user-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...newPrefs }),
      });
    } catch {
      // Background sync, suppress errors
    }
  };

  const toggleSavedPost = (postId: string) => {
    if (!userId) return false;
    const nextSavedPosts = toggleArrayItem(prefs.savedPosts, postId);
    const newPrefs = { ...prefs, savedPosts: nextSavedPosts };
    setPrefs(newPrefs);
    updateServer(newPrefs);
    return newPrefs.savedPosts.some((i) => normalizeValue(i) === normalizeValue(postId));
  };

  const toggleFollowedClub = (club: string) => {
    if (!userId) return false;
    const nextFollowedClubs = toggleArrayItem(prefs.followedClubs, club);
    const newPrefs = { ...prefs, followedClubs: nextFollowedClubs };
    setPrefs(newPrefs);
    updateServer(newPrefs);
    return newPrefs.followedClubs.some((i) => normalizeValue(i) === normalizeValue(club));
  };

  const toggleFollowedPlayer = (player: string) => {
    if (!userId) return false;
    const nextFollowedPlayers = toggleArrayItem(prefs.followedPlayers, player);
    const newPrefs = { ...prefs, followedPlayers: nextFollowedPlayers };
    setPrefs(newPrefs);
    updateServer(newPrefs);
    return newPrefs.followedPlayers.some((i) => normalizeValue(i) === normalizeValue(player));
  };

  const toggleFollowedTransfer = (topic: string) => {
    if (!userId) return false;
    const nextTransfers = toggleArrayItem(prefs.followedTransfers, topic);
    const newPrefs = { ...prefs, followedTransfers: nextTransfers };
    setPrefs(newPrefs);
    updateServer(newPrefs);
    return newPrefs.followedTransfers.some((i) => normalizeValue(i) === normalizeValue(topic));
  };

  const toggleFollowedTag = (tag: string) => {
    if (!userId) return false;
    const nextTags = toggleArrayItem(prefs.followedTags, tag);
    const newPrefs = { ...prefs, followedTags: nextTags };
    setPrefs(newPrefs);
    updateServer(newPrefs);
    return newPrefs.followedTags.some((i) => normalizeValue(i) === normalizeValue(tag));
  };

  const markAlertsSeen = (alertIds: string[]) => {
    if (!userId || !alertIds.length) return;
    // merge uniquely
    const current = new Set(prefs.seenAlerts);
    let changed = false;
    for (const id of alertIds) {
      if (!current.has(id)) {
        current.add(id);
        changed = true;
      }
    }
    if (changed) {
      const newPrefs = { ...prefs, seenAlerts: Array.from(current) };
      setPrefs(newPrefs);
      updateServer(newPrefs);
    }
  };

  const setFanClub = (club: { name: string; logoUrl: string | null; league?: string } | null) => {
    if (!userId) return;
    const newPrefs = { ...prefs, fanClub: club };
    setPrefs(newPrefs);
    updateServer(newPrefs);
  };

  const setNewsletterOptIn = (optIn: boolean) => {
    const newPrefs = { ...prefs, newsletterOptIn: optIn };
    setPrefs(newPrefs);
    if (userId) {
      updateServer(newPrefs);
    }
  };

  const isPostSaved = (postId: string) =>
    prefs.savedPosts.some((i) => normalizeValue(i) === normalizeValue(postId));

  const isClubFollowed = (club: string) =>
    prefs.followedClubs.some((i) => normalizeValue(i) === normalizeValue(club));

  const isPlayerFollowed = (player: string) =>
    prefs.followedPlayers.some((i) => normalizeValue(i) === normalizeValue(player));

  const isTransferFollowed = (topic: string) =>
    prefs.followedTransfers.some((i) => normalizeValue(i) === normalizeValue(topic));

  const isTagFollowed = (tag: string) =>
    prefs.followedTags.some((i) => normalizeValue(i) === normalizeValue(tag));

  const hasSeenAlert = (alertId: string) =>
    prefs.seenAlerts.includes(alertId);

  const addReadPost = (postId: string) => {
    if (!userId) return;
    
    const current = prefs.readingHistory || [];
    // If it's the very first item, don't ping server
    if (current.length > 0 && current[0].postId === postId) return;

    // Filter out previous instances and add to top, cap at 50
    const filtered = current.filter(item => item.postId !== postId);
    const updated = [
      { postId, viewedAt: Date.now() },
      ...filtered
    ].slice(0, 50);

    const newPrefs = { ...prefs, readingHistory: updated };
    setPrefs(newPrefs);
    updateServer(newPrefs);
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        ...prefs,
        toggleSavedPost,
        toggleFollowedClub,
        toggleFollowedPlayer,
        toggleFollowedTransfer,
        toggleFollowedTag,
        markAlertsSeen,
        setFanClub,
        setNewsletterOptIn,
        isPostSaved,
        isClubFollowed,
        isPlayerFollowed,
        isTransferFollowed,
        isTagFollowed,
        hasSeenAlert,
        addReadPost,
        loading,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
}
