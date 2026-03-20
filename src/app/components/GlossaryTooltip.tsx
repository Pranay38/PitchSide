import { useState, useRef, useEffect } from "react";
import { lookupTerm, type GlossaryEntry } from "../data/footballGlossary";

interface GlossaryTooltipProps {
  term: string;
  children: React.ReactNode;
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const triggerRef = useRef<HTMLSpanElement>(null);
  const entry = lookupTerm(term);

  useEffect(() => {
    if (!show || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Show below if too close to top of viewport
    setPosition(rect.top < 120 ? "below" : "above");
  }, [show]);

  if (!entry) return <>{children}</>;

  return (
    <span
      ref={triggerRef}
      className="glossary-term-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow((p) => !p)}
    >
      <span className="glossary-term">{children}</span>
      {show && (
        <span className={`glossary-tooltip ${position === "below" ? "glossary-tooltip--below" : ""}`}>
          <span className="glossary-tooltip__term">{entry.term}</span>
          <span className="glossary-tooltip__def">{entry.definition}</span>
        </span>
      )}
    </span>
  );
}

/**
 * CSS styles for the glossary tooltip.
 * Injected via a <style> tag to keep them self-contained.
 */
export function GlossaryStyles() {
  return (
    <style>{`
      .glossary-term-wrapper {
        position: relative;
        display: inline;
        cursor: help;
      }
      .glossary-term {
        border-bottom: 1.5px dotted #16A34A;
        transition: border-color 0.2s;
      }
      .glossary-term-wrapper:hover .glossary-term {
        border-color: #4ade80;
      }
      .glossary-tooltip {
        position: absolute;
        left: 50%;
        bottom: calc(100% + 8px);
        transform: translateX(-50%);
        z-index: 100;
        width: max-content;
        max-width: 300px;
        padding: 10px 14px;
        border-radius: 12px;
        background: #0F172A;
        color: #F1F5F9;
        box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        font-size: 13px;
        line-height: 1.5;
        pointer-events: none;
        animation: glossaryFadeIn 0.15s ease-out;
      }
      .glossary-tooltip--below {
        bottom: auto;
        top: calc(100% + 8px);
      }
      .glossary-tooltip__term {
        display: block;
        font-weight: 700;
        text-transform: capitalize;
        color: #4ade80;
        margin-bottom: 3px;
        font-size: 12px;
        letter-spacing: 0.03em;
      }
      .glossary-tooltip__def {
        display: block;
        color: #CBD5E1;
        font-weight: 400;
      }
      @keyframes glossaryFadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(4px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      .glossary-tooltip--below {
        animation-name: glossaryFadeInBelow;
      }
      @keyframes glossaryFadeInBelow {
        from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      /* Dark mode override — tooltip already dark, but term underline */
      .dark .glossary-term {
        border-color: #16A34A88;
      }
      .dark .glossary-term-wrapper:hover .glossary-term {
        border-color: #4ade80;
      }
    `}</style>
  );
}
