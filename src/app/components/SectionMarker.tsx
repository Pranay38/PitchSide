/**
 * SectionMarker — Matchday-themed section divider inspired by BackPageFootball's
 * broadsheet page number system. Uses football match minute markers instead of
 * page numbers (e.g., "MIN 1'" for the opening section, "HT" for mid-page, "FT" for final).
 */

import { ReactNode } from "react";

interface SectionMarkerProps {
  /** The minute marker label, e.g. "1'", "15'", "45+2'", "HT", "FT" */
  minute: string;
  /** The section title, e.g. "Opening Whistle", "Quick Takes" */
  label: string;
  /** Optional child elements to render after the marker */
  children?: ReactNode;
}

export function SectionMarker({ minute, label }: SectionMarkerProps) {
  return (
    <div className="flex items-center gap-4 mb-10 select-none">
      {/* Minute badge */}
      <div className="flex items-center gap-0">
        <span className="inline-flex items-center justify-center h-9 min-w-[3.25rem] px-3 rounded-lg bg-foreground text-background text-[11px] font-black uppercase tracking-[0.14em] font-mono tabular-nums">
          {minute}
        </span>
      </div>

      {/* Label */}
      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground whitespace-nowrap">
        {label}
      </span>

      {/* Horizontal rule */}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
