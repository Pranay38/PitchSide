"use client";
import DOMPurify from "isomorphic-dompurify";

import { useMemo, useEffect, useRef } from "react";
import { renderEditorialBlockHtml, type EditorialBlock } from "../lib/editorialBlocks";
import { GlossaryTooltip, GlossaryStyles } from "./GlossaryTooltip";
import { Tweet } from "./ui/tweet";
import {
  type ArticleContentModel,
  glossaryRegex
} from "../lib/articleModel";
import { useScrollytelling } from "../hooks/useScrollytelling";

function EditorialBlockView({ block }: { block: EditorialBlock }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderEditorialBlockHtml(block)) }} />
  );
}

/** Wrap glossary terms in plain text, returning React nodes */
function annotateTextWithGlossary(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(glossaryRegex.source, glossaryRegex.flags);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <GlossaryTooltip key={`${match.index}-${match[0]}`} term={match[0]}>
        {match[0]}
      </GlossaryTooltip>
    );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

/** Hydrate data-glossary-term spans in rich HTML content for hover tooltips */
function useGlossaryHydration(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const spans = el.querySelectorAll<HTMLElement>("[data-glossary-term]");
    spans.forEach((span) => {
      const term = span.getAttribute("data-glossary-term") || "";
      const def = span.getAttribute("data-glossary-def") || "";
      let tooltipEl: HTMLElement | null = null;

      const show = () => {
        if (tooltipEl) return;
        tooltipEl = document.createElement("span");
        tooltipEl.className = "glossary-tooltip";
        const rect = span.getBoundingClientRect();
        if (rect.top < 120) tooltipEl.classList.add("glossary-tooltip--below");
        tooltipEl.innerHTML = `<span class="glossary-tooltip__term">${term}</span><span class="glossary-tooltip__def">${def}</span>`;
        span.appendChild(tooltipEl);
      };
      const hide = () => {
        if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
      };
      span.addEventListener("mouseenter", show);
      span.addEventListener("mouseleave", hide);
      span.addEventListener("click", () => tooltipEl ? hide() : show());
    });
  }, [containerRef]);
}

export function ArticleContentRenderer({
  model,
  className = "pitchside-article-content",
}: {
  model: ArticleContentModel;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useGlossaryHydration(containerRef);
  useScrollytelling(containerRef);

  const content = useMemo(() => {
    if (model.isRich) {
      if (model.richBlocks && model.richBlocks.length > 0) {
        return (
          <>
            <GlossaryStyles />
            <div ref={containerRef} className={className}>
              {model.richBlocks.map((block, i) => {
                if (block.type === "tweet") {
                  return (
                    <div key={`tweet-${i}`} className="my-8 flex justify-center">
                      <div className="w-full max-w-lg dark:text-neutral-200">
                        <Tweet id={block.id} />
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={`html-${i}`}
                    className="text-[#334155] dark:text-gray-200"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content || "") }}
                  />
                );
              })}
            </div>
          </>
        );
      }

      return (
        <>
          <GlossaryStyles />
          <div
            ref={containerRef}
            className={`text-[#334155] dark:text-gray-200 html-blob leading-8 ${className}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(model.html || "") }}
          />
        </>
      );
    }

    return (
      <>
        <GlossaryStyles />
        <div ref={containerRef} className={className}>
          {model.blocks?.map((block, index) => {
            if (block.type === "heading" && block.level === 2) {
              return <h2 key={block.id || index} id={block.id}>{block.text}</h2>;
            }
            if (block.type === "heading" && block.level === 3) {
              return <h3 key={block.id || index} id={block.id}>{block.text}</h3>;
            }
            if (block.type === "blockquote") {
              return <blockquote key={index}>{annotateTextWithGlossary(block.text)}</blockquote>;
            }
            if (block.type === "unordered-list") {
              return (
                <ul key={index}>
                  {block.items.map((item) => <li key={item}>{annotateTextWithGlossary(item)}</li>)}
                </ul>
              );
            }
            if (block.type === "ordered-list") {
              return (
                <ol key={index}>
                  {block.items.map((item) => <li key={item}>{annotateTextWithGlossary(item)}</li>)}
                </ol>
              );
            }
            if (block.type === "editorial") {
              return <EditorialBlockView key={`${block.block.kind}-${index}`} block={block.block} />;
            }
            return <p key={index}>{annotateTextWithGlossary(block.text)}</p>;
          })}
        </div>
      </>
    );
  }, [className, model]);

  return content;
}
