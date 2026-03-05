import { useState, useCallback, useEffect } from "react";

const CLUB_KEY = "pitchside_favorite_club";
const ONBOARDED_KEY = "pitchside_onboarded";

export function useClubPreference() {
    const [favoriteClub, setFavoriteClubState] = useState<string | null>(() => {
        try {
            return localStorage.getItem(CLUB_KEY);
        } catch {
            return null;
        }
    });

    const [isOnboarded, setIsOnboardedState] = useState<boolean>(() => {
        try {
            return localStorage.getItem(ONBOARDED_KEY) === "true";
        } catch {
            return false;
        }
    });

    // Listen for storage changes (e.g., user clears cache in another tab)
    useEffect(() => {
        const handleStorage = () => {
            const club = localStorage.getItem(CLUB_KEY);
            const onboarded = localStorage.getItem(ONBOARDED_KEY) === "true";
            setFavoriteClubState(club);
            setIsOnboardedState(onboarded);
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const setFavoriteClub = useCallback((club: string) => {
        try {
            localStorage.setItem(CLUB_KEY, club);
            localStorage.setItem(ONBOARDED_KEY, "true");
        } catch {
            // localStorage might be unavailable
        }
        setFavoriteClubState(club);
        setIsOnboardedState(true);
    }, []);

    const skipOnboarding = useCallback(() => {
        try {
            localStorage.setItem(ONBOARDED_KEY, "true");
        } catch {
            // localStorage might be unavailable
        }
        setIsOnboardedState(true);
    }, []);

    const clearPreference = useCallback(() => {
        try {
            localStorage.removeItem(CLUB_KEY);
            localStorage.removeItem(ONBOARDED_KEY);
        } catch {
            // localStorage might be unavailable
        }
        setFavoriteClubState(null);
        setIsOnboardedState(false);
    }, []);

    return {
        favoriteClub,
        isOnboarded,
        setFavoriteClub,
        skipOnboarding,
        clearPreference,
    };
}
