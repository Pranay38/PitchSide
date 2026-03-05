import { useState, useEffect } from "react";

export function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight > 0) {
                setProgress(Math.min(100, (scrollTop / docHeight) * 100));
            }
        };
        // Calculate initial progress
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[200] h-1 bg-gray-200/50 dark:bg-gray-800/50">
            <div
                className="h-full bg-gradient-to-r from-accent-theme to-accent-light shadow-sm shadow-accent-theme/50"
                style={{ width: `${progress}%`, transition: "width 150ms ease-out" }}
            />
        </div>
    );
}
