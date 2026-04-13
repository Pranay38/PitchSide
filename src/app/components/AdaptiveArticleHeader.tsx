"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export function AdaptiveArticleHeader({ title }: { title: string }) {
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      
      setProgress(scrolled);
      setShow(scrollY > 400); // 400px threshold to hide the main hero
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] glass bg-white/70 dark:bg-[#0b1326]/70 backdrop-blur-2xl ghost-border-dark dark:ghost-border border-x-0 border-t-0 border-b flex items-center h-14 ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-[#0F172A] dark:text-white" />
        </button>
        <span className="font-outfit font-black text-sm md:text-base text-[#0F172A] dark:text-white truncate">
          {title}
        </span>
      </div>
      
      {/* Mini Progress Line */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-black/5 dark:bg-white/5">
        <div 
          className="h-full bg-gradient-to-r from-[#16A34A] to-[#4ade80] glow-green transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
