import { useEffect, useRef, useState } from "react";
import { TimelineItem } from "../lib/editorialBlocks";

interface NotebookTimelineProps {
  title: string;
  items: TimelineItem[];
}

export function NotebookTimeline({ title, items }: NotebookTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far down the user has scrolled within the timeline container
      // The timeline starts slightly below the title
      const startTrigger = rect.top + 100; // Trigger line starts 100px down from container
      const endTrigger = rect.bottom;
      
      const viewportCenter = windowHeight * 0.6; // The "active" line in the viewport
      
      let newHeight = 0;
      if (startTrigger < viewportCenter) {
        newHeight = Math.min(viewportCenter - startTrigger, rect.height - 100);
      }
      setLineHeight(Math.max(0, newHeight));

      // Calculate active items based on the line height
      const itemElements = containerRef.current.querySelectorAll('.timeline-item-nodes');
      const newActiveIndices: number[] = [];
      
      itemElements.forEach((el, index) => {
        const itemRect = el.getBoundingClientRect();
        if (itemRect.top < viewportCenter) {
          newActiveIndices.push(index);
        }
      });
      
      setActiveIndices(newActiveIndices);
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="not-prose my-14 relative w-full max-w-2xl mx-auto font-sans"
    >
      <div className="mb-10 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#16A34A] mb-2 drop-shadow-sm">
          Manager's Notebook Timeline
        </p>
        <h3 className="text-3xl md:text-4xl font-black font-outfit text-[#0F172A] dark:text-white">
          {title}
        </h3>
      </div>
      
      <div className="relative pl-6 md:pl-10">
        {/* The background track line */}
        <div className="absolute top-4 bottom-4 left-[9px] md:left-[17px] w-1 rounded-full bg-gray-200 dark:bg-gray-800" />
        
        {/* The foreground active line (draws down) */}
        <div 
          className="absolute top-4 left-[9px] md:left-[17px] w-1 rounded-full bg-[#16A34A] transition-all ease-out duration-100 glow-green" 
          style={{ height: \`\${lineHeight}px\` }} 
        />

        <div className="space-y-12">
          {items.map((item, index) => {
            const isActive = activeIndices.includes(index);
            
            return (
              <div 
                key={index} 
                className={\`timeline-item-nodes relative flex flex-col md:flex-row gap-4 md:gap-8 transition-opacity duration-700 \${isActive ? 'opacity-100' : 'opacity-40'}\`}
              >
                {/* Node dot */}
                <div 
                  className={\`absolute -left-[30px] md:-left-[38px] top-4 w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 \${
                    isActive 
                      ? 'bg-[#16A34A] border-[#bbf7d0] dark:border-green-900 scale-125 shadow-[0_0_15px_rgba(22,163,74,0.6)]' 
                      : 'bg-white dark:bg-[#0F172A] border-gray-300 dark:border-gray-600'
                  }\`}
                />
                
                {/* Content Card */}
                <div className={\`flex-1 rounded-[1.5rem] p-6 transition-all duration-700 \${
                  isActive 
                    ? 'bg-white dark:bg-gray-800/80 shadow-xl shadow-[#16A34A]/5 border border-[#16A34A]/20 dark:border-white/10 translate-x-0'
                    : 'bg-gray-50 dark:bg-gray-800/40 border border-transparent translate-x-2'
                }\`}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#16A34A]/10 text-[#16A34A] rounded-full text-[11px] font-black uppercase tracking-[0.18em] mb-3">
                    {item.label}
                  </div>
                  <h4 className="text-xl font-bold text-[#0F172A] dark:text-white leading-tight mb-2">
                    {item.title}
                  </h4>
                  {item.note && (
                    <p className="text-sm text-[#475569] dark:text-gray-300 leading-relaxed font-medium">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
