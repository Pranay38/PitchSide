import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser } from "@clerk/clerk-react";

interface UserPreferences {
  savedPosts: string[];
  followedClubs: string[];
  followedPlayers: string[];
  followedTransfers: string[];
  seenAlerts: string[];
}

interface UserPreferencesContextType extends UserPreferences {
  toggleSavedPost: (postId: string) => boolean;
  toggleFollowedClub: (club: string) => boolean;
  toggleFollowedPlayer: (player: string) => boolean;
  toggleFollowedTransfer: (transferTopic: string) => boolean;
  markAlertsSeen: (alertIds: string[]) => void;
  isPostSaved: (postId: string) => boolean;
  isClubFollowed: (club: string) => boolean;
  isPlayerFollowed: (player: string) => boolean;
  isTransferFollowed: (transferTopic: string) => boolean;
  hasSeenAlert: (alertId: string) => boolean;
  loading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const userId = user?.id;

  const [prefs, setPrefs] = useState<UserPreferences>({
    savedPosts: [],
    followedClubs: [],
    followedPlayers: [],
    followedTransfers: [],
    seenAlerts: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch initial preferences on mount/login
  useEffect(() => {
    if (!userId) {
      setPrefs({ savedPosts: [], followedClubs: [], followedPlayers: [], followedTransfers: [], seenAlerts: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/user-prefs?userId=${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch preferences");
        return res.json();
      })
      .then((data) => {
        setPrefs({
          savedPosts: data.savedPosts || [],
          followedClubs: data.followedClubs || [],
          followedPlayers: data.followedPlayers || [],
          followedTransfers: data.followedTransfers || [],
          seenAlerts: data.seenAlerts || [],
        });
      })
      .catch(() => {
        // Silently fail if api call fails
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

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

  const isPostSaved = (postId: string) =>
    prefs.savedPosts.some((i) => normalizeValue(i) === normalizeValue(postId));

  const isClubFollowed = (club: string) =>
    prefs.followedClubs.some((i) => normalizeValue(i) === normalizeValue(club));

  const isPlayerFollowed = (player: string) =>
    prefs.followedPlayers.some((i) => normalizeValue(i) === normalizeValue(player));

  const isTransferFollowed = (topic: string) =>
    prefs.followedTransfers.some((i) => normalizeValue(i) === normalizeValue(topic));

  const hasSeenAlert = (alertId: string) =>
    prefs.seenAlerts.includes(alertId);

  return (
    <UserPreferencesContext.Provider
      value={{
        ...prefs,
        toggleSavedPost,
        toggleFollowedClub,
        toggleFollowedPlayer,
        toggleFollowedTransfer,
        markAlertsSeen,
        isPostSaved,
        isClubFollowed,
        isPlayerFollowed,
        isTransferFollowed,
        hasSeenAlert,
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
