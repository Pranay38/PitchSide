import React, { useEffect, useState } from "react";
import { lookupTerm } from "../../data/footballGlossary";

export function GlossaryHighlightTooltip() {
  const [tooltipState, setTooltipState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    term: string;
    definition: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    term: "",
    definition: "",
  });

  useEffect(() => {
    let hideTimeout: number;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains("glossary-highlight")) {
        clearTimeout(hideTimeout);
        const termRaw = target.getAttribute("data-term") || "";
        const entry = lookupTerm(termRaw);
        if (entry) {
          const rect = target.getBoundingClientRect();
          setTooltipState({
            visible: true,
            // Centered above the element
            x: rect.left + rect.width / 2,
            y: rect.top, // We will translate it up in CSS
            term: entry.term,
            definition: entry.definition,
          });
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList.contains("glossary-highlight")) {
        hideTimeout = window.setTimeout(() => {
          setTooltipState((prev) => ({ ...prev, visible: false }));
        }, 100);
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      clearTimeout(hideTimeout);
    };
  }, []);

  if (!tooltipState.visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: tooltipState.x,
        top: tooltipState.y,
        transform: "translate(-50%, -100%) translateY(-8px)",
        zIndex: 9999,
        pointerEvents: "none", // so it doesn't block hover
      }}
    >
      <div
        className="shadow-2xl"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.94)",
          backdropFilter: "blur(8px)",
          borderRadius: "10px",
          padding: "12px",
          width: "max-content",
          maxWidth: "280px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ fontWeight: "bold", color: "#16A34A", marginBottom: "4px", fontSize: "14px" }}>
          {tooltipState.term}
        </div>
        <div style={{ color: "#e2e8f0", fontSize: "12px", lineHeight: "1.4", marginBottom: "8px" }}>
          {tooltipState.definition}
        </div>
        <div style={{ fontSize: "10px", color: "#94a3b8", fontStyle: "italic" }}>
          Readers will see this as a tooltip
        </div>
      </div>
    </div>
  );
}
