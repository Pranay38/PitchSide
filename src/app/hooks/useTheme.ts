"use client";
import { useTheme as useNextTheme } from "next-themes";
import { useCallback } from "react";

export function useTheme() {
    const { theme, setTheme, systemTheme } = useNextTheme();
    
    // Resolve actual theme for UI state
    const currentTheme = theme === 'system' ? systemTheme : theme;
    
    const toggleTheme = useCallback(() => {
        setTheme(currentTheme === "dark" ? "light" : "dark");
    }, [currentTheme, setTheme]);

    return { 
        theme: currentTheme || "light", 
        setTheme, 
        toggleTheme 
    };
}
