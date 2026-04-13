"use client";

import { useEffect, useState } from "react";

interface HeadingData {
  id: string;
  text: string;
}

export function MilestoneScrubber({ contentSelector = ".pitchside-article-content" }: { contentSelector?: string }) {
  const [headings, setHeadings] = useState<HeadingData[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // 1. Gather all H2 headings inside the content
    const elements = Array.from(document.querySelectorAll(`${contentSelector} h2`));
    const data: HeadingData[] = [];
    
    elements.forEach((el, index) => {
      // Ensure element has an ID for linking
      if (!el.id) {
        el.id = `heading-${index}`;
      }
      data.push({
        id: el.id,
        text: el.textContent || `Section ${index + 1}`
      });
    });
    
    setHeadings(data);

    // 2. Setup intersection observer for active state
    // We observe with a negative bottom margin so the heading triggers as it reaches the top 20% of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
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

  return (
    <nav className="hidden xl:flex flex-col gap-3 sticky top-32 pl-2">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#94A3B8] mb-2">
        Milestones
      </div>
      <div className="flex flex-col relative before:absolute before:left-[3.5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-200 dark:before:bg-gray-800">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;
          return (
            <a 
              key={heading.id} 
              href={`#${heading.id}`}
              className="group flex gap-4 items-start py-2 relative z-10"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 relative border-[1.5px] ${isActive ? 'bg-[#16A34A] border-[#16A34A]' : 'bg-white dark:bg-[#0B1120] border-gray-300 dark:border-gray-700'}`}>
                {isActive && (
                  <div className="absolute -inset-[2px] rounded-full bg-[#16A34A]/20 glow-green animate-pulse" />
                )}
              </div>
              <span className={`text-xs transition-all duration-300 max-w-[160px] leading-snug ${
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
    </nav>
  );
}
