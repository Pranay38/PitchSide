import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "pitchside_theme";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const stored = localStorage.getItem(THEME_KEY) as Theme | null;
            if (stored === "dark" || stored === "light") return stored;
        } catch {
            // ignore
        }
        return getSystemTheme();
    });

    // Apply theme on mount and changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            try {
                const stored = localStorage.getItem(THEME_KEY);
                if (!stored) {
                    setThemeState(e.matches ? "dark" : "light");
                }
            } catch {
                // ignore
            }
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const setTheme = useCallback((t: Theme) => {
        try {
            localStorage.setItem(THEME_KEY, t);
        } catch {
            // ignore
        }
        setThemeState(t);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [theme, setTheme]);

    return { theme, setTheme, toggleTheme };
}
