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
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (progress <= 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
            <div
                className="h-full bg-gradient-to-r from-[#16A34A] to-[#4ade80] transition-[width] duration-100 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
