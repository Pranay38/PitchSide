"use client";

import { useEffect, useState } from "react";

interface ReadingProgressBarProps {
  readTime: string; // e.g. "4 min read"
}

export function ReadingProgressBar({ readTime }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      if (documentHeight <= 0) return;

      const currentScroll = window.scrollY;
      const scrollPercentage = Math.min(100, Math.max(0, (currentScroll / documentHeight) * 100));
      setProgress(scrollPercentage);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate remaining minutes based on progress
  const totalMinutesMatch = readTime.match(/(\d+)/);
  const totalMinutes = totalMinutesMatch ? parseInt(totalMinutesMatch[1], 10) : 0;
  const remainingMinutes = Math.max(1, Math.ceil(totalMinutes * (1 - progress / 100)));
  
  // Show after 5% scroll, hide near bottom (98%)
  const isVisible = progress > 5 && progress < 98;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[100] transition-opacity duration-300 pointer-events-none ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="h-[3px] bg-border w-full relative">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-[#4ade80]"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {totalMinutes > 0 && (
        <div className="absolute top-3 right-4 sm:right-6 bg-background/80 backdrop-blur-md border border-border text-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
          {remainingMinutes} min left
        </div>
      )}
    </div>
  );
}
