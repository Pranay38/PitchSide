import React, { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { Link } from "@/lib/router-compat";

export function ReadingStreakBanner() {
  const [streak, setStreak] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStreak = parseInt(localStorage.getItem("pitchside_read_streak") || "0", 10);
      const lastRead = localStorage.getItem("pitchside_last_read_date");
      
      if (storedStreak > 0) {
        // If they read something recently, show it
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastRead === today || lastRead === yesterday) {
          setStreak(storedStreak);
          setShow(true);
        } else {
          // Streak broken
          localStorage.setItem("pitchside_read_streak", "0");
        }
      } else {
        // Mock a 1-day streak to encourage reading if none exists for demo purposes
        setStreak(0);
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="w-full bg-[#0F172A] text-white py-3 px-4 flex items-center justify-center gap-4 text-sm font-bold border-b border-[#16A34A]/30 transition-all">
      <div className="flex items-center gap-2">
        <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500 animate-pulse" : "text-gray-400"}`} />
        <span className="font-outfit">
          {streak > 0 ? `${streak} Day Reading Streak!` : "Start your reading streak today!"}
        </span>
      </div>
      <Link to="/archive?type=article" className="text-[#16A34A] hover:text-[#4ade80] uppercase tracking-widest text-[10px] bg-[#16A34A]/10 px-3 py-1 rounded-full border border-[#16A34A]/20 transition-colors">
        Keep Reading
      </Link>
    </div>
  );
}
