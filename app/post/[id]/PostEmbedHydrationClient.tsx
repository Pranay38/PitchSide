"use client";

import { useEffect, useRef } from "react";
import { scheduleEmbedHydration } from "@/app/lib/embedHydration";
import { ReadingProgress } from "@/app/components/ReadingProgress";

export function PostEmbedHydrationClient({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return scheduleEmbedHydration(containerRef.current);
  }, []);

  return (
    <>
      <ReadingProgress />
      <div ref={containerRef}>
        {children}
      </div>
    </>
  );
}
