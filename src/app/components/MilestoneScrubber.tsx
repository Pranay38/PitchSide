"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface HeadingData {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

export function MilestoneScrubber({ contentSelector = ".pitchside-article-content" }: { contentSelector?: string }) {
  const [headings, setHeadings] = useState<HeadingData[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // 1. Gather all H2 and H3 headings inside the content
    const elements = Array.from(document.querySelectorAll(`${contentSelector} h2, ${contentSelector} h3`));
    const data: HeadingData[] = [];
    
    elements.forEach((el, index) => {
      // Ensure element has an ID for linking
      if (!el.id) {
        el.id = `heading-${index}`;
      }
      data.push({
        id: el.id,
        text: el.textContent || `Section ${index + 1}`,
        level: el.tagName.toLowerCase() === "h3" ? 3 : 2,
      });
    });
    
    setHeadings(data);

    // 2. Setup intersection observer for active state
    const observer = new IntersectionObserver(
      (entries) => {
        // Iterate backwards or handle the first one that is intersecting
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [contentSelector]);

  if (headings.length < 2) return null; // Don't show scrubber if not enough sections

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setIsMobileOpen(false); // Close mobile menu if open
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const HeadingList = () => (
    <div className="flex flex-col relative before:absolute before:left-[3.5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-200 dark:before:bg-gray-800">
      {headings.map((heading) => {
        const isActive = activeId === heading.id;
        const isH3 = heading.level === 3;
        return (
          <a 
            key={heading.id} 
            href={`#${heading.id}`}
            className={`group flex items-start py-2 relative z-10 ${isH3 ? 'pl-6 gap-3' : 'gap-4'}`}
            onClick={(e) => handleNavClick(e, heading.id)}
          >
            <div className={`mt-1.5 rounded-full flex-shrink-0 transition-all duration-300 relative ${isH3 ? 'w-1.5 h-1.5 border-[1px]' : 'w-2 h-2 border-[1.5px]'} ${isActive ? 'bg-[#16A34A] border-[#16A34A]' : 'bg-white dark:bg-[#0B1120] border-gray-300 dark:border-gray-700'}`}>
              {isActive && (
                <div className="absolute -inset-[2px] rounded-full bg-[#16A34A]/20 glow-green animate-pulse" />
              )}
            </div>
            <span className={`transition-all duration-300 leading-snug ${isH3 ? 'text-[11px] max-w-[140px]' : 'text-xs max-w-[160px]'} ${
              isActive 
                ? "font-extrabold text-[#0F172A] dark:text-white translate-x-1" 
                : "font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}>
              {heading.text}
            </span>
          </a>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Scrubber */}
      <nav className="hidden xl:flex flex-col gap-3 sticky top-32 pl-2">
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94A3B8] mb-2">
          Milestones
        </div>
        <HeadingList />
      </nav>

      {/* Mobile Floating Button */}
      <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] px-4 py-2.5 rounded-full shadow-lg shadow-black/20 font-bold text-sm tracking-wide border border-transparent dark:border-gray-200 hover:scale-105 active:scale-95 transition-all"
        >
          <List className="w-4 h-4" />
          Contents
        </button>
      </div>

      {/* Mobile Overlay Menu */}
      {isMobileOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#0F172A] rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-[#0F172A] dark:text-white font-outfit">Table of Contents</h3>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <HeadingList />
            </div>
          </div>
          {/* Invisible backdrop click catcher */}
          <div className="absolute inset-0 -z-10" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
