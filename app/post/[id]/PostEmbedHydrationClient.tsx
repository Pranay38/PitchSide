"use client";

import { useEffect, useRef } from "react";
import { scheduleEmbedHydration } from "@/app/lib/embedHydration";

export function PostEmbedHydrationClient({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return scheduleEmbedHydration(containerRef.current);
  }, []);

  return (
    <>
      <div ref={containerRef}>
        {children}
      </div>
    </>
  );
}
