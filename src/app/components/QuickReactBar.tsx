"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface QuickReactBarProps {
  postId: string;
}

type Reaction = "fire" | "smart" | "meh";

interface ReactCounts {
  fire: number;
  smart: number;
  meh: number;
  total: number;
}

export function QuickReactBar({ postId }: QuickReactBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [counts, setCounts] = useState<ReactCounts>({ fire: 0, smart: 0, meh: 0, total: 0 });
  const [selectedReaction, setSelectedReaction] = useState<Reaction | null>(null);

  // Initialize fake data and check local storage
  useEffect(() => {
    // Generate pseudo-random consistent counts based on postId
    const hash = postId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const seed = Math.abs(hash);
    
    setCounts({
      fire: 45 + (seed % 30),
      smart: 25 + (seed % 20),
      meh: 5 + (seed % 10),
      total: 75 + (seed % 60)
    });

    const reacted = localStorage.getItem(`react_${postId}`);
    if (reacted) {
      setHasReacted(true);
      setSelectedReaction(reacted as Reaction);
    }
  }, [postId]);

  // Handle scroll to reveal
  useEffect(() => {
    if (isDismissed) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      if (documentHeight <= 0) return;

      const currentScroll = window.scrollY;
      const scrollPercentage = (currentScroll / documentHeight) * 100;
      
      // Show between 40% and 95% scroll
      if (scrollPercentage > 40 && scrollPercentage < 95) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  const handleReact = (reaction: Reaction) => {
    if (hasReacted) return;
    
    setHasReacted(true);
    setSelectedReaction(reaction);
    localStorage.setItem(`react_${postId}`, reaction);
    
    setCounts(prev => ({
      ...prev,
      [reaction]: prev[reaction] + 1,
      total: prev.total + 1
    }));
  };

  if (!isVisible && !hasReacted) return null;

  return (
    <div 
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95 pointer-events-none"
      }`}
    >
      <div className="bg-background/95 backdrop-blur-md border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] rounded-full p-2 flex items-center gap-2">
        {!hasReacted ? (
          <>
            <button 
              onClick={() => handleReact("fire")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-muted text-sm font-medium transition-colors"
            >
              <span>🔥</span> <span className="hidden sm:inline">Fire</span>
            </button>
            <div className="w-[1px] h-4 bg-border" />
            <button 
              onClick={() => handleReact("smart")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-muted text-sm font-medium transition-colors"
            >
              <span>🧠</span> <span className="hidden sm:inline">Smart</span>
            </button>
            <div className="w-[1px] h-4 bg-border" />
            <button 
              onClick={() => handleReact("meh")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full hover:bg-muted text-sm font-medium transition-colors"
            >
              <span>💤</span> <span className="hidden sm:inline">Meh</span>
            </button>
            <button 
              onClick={() => { setIsVisible(false); setIsDismissed(true); }}
              className="p-2 ml-1 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4 px-4 py-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Reactions</span>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm">🔥</span>
              <span className={`text-[10px] font-bold ${selectedReaction === "fire" ? "text-primary" : "text-muted-foreground"}`}>
                {Math.round((counts.fire / counts.total) * 100)}%
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm">🧠</span>
              <span className={`text-[10px] font-bold ${selectedReaction === "smart" ? "text-primary" : "text-muted-foreground"}`}>
                {Math.round((counts.smart / counts.total) * 100)}%
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm">💤</span>
              <span className={`text-[10px] font-bold ${selectedReaction === "meh" ? "text-primary" : "text-muted-foreground"}`}>
                {Math.round((counts.meh / counts.total) * 100)}%
              </span>
            </div>
            <button 
              onClick={() => { setIsVisible(false); setIsDismissed(true); }}
              className="p-1.5 ml-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
