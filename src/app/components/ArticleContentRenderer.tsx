"use client";
import DOMPurify from "isomorphic-dompurify";

import React, { useMemo, useEffect, useRef, Fragment } from "react";
import { renderEditorialBlockHtml, type EditorialBlock } from "../lib/editorialBlocks";
import { GlossaryTooltip, GlossaryStyles } from "./GlossaryTooltip";
import { Tweet } from "./ui/tweet";
import { NotebookTimeline } from "./NotebookTimeline";
import { InlineNewsletterCard } from "./InlineNewsletterCard";
import {
  type ArticleContentModel,
  glossaryRegex
} from "../lib/articleModel";
import { useScrollytelling } from "../hooks/useScrollytelling";

function EditorialBlockView({ block }: { block: EditorialBlock }) {
  if (block.kind === "timeline") {
    return <NotebookTimeline title={block.title} items={block.items} />;
  }
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
  gatekeepPoint = 0,
  isSignedIn = false,
}: {
  model: ArticleContentModel;
  className?: string;
  gatekeepPoint?: number;
  isSignedIn?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useGlossaryHydration(containerRef);
  useScrollytelling(containerRef);

  const content = useMemo(() => {
    const isGated = !isSignedIn && gatekeepPoint > 0 && gatekeepPoint < 100;
    
    let richBlocks = model.richBlocks;
    if (isGated && richBlocks) {
      const cutOffIndex = Math.ceil(richBlocks.length * (gatekeepPoint / 100));
      richBlocks = richBlocks.slice(0, cutOffIndex);
    }

    if (model.isRich) {
      if (richBlocks && richBlocks.length > 0) {
        return (
          <>
            <GlossaryStyles />
            <div ref={containerRef} className={className}>
              {richBlocks.map((block, i) => {
                const isMidpoint = !isGated && i === Math.floor(richBlocks!.length / 2) && i > 1;
                let element = null;

                if (block.type === "tweet") {
                  element = (
                    <div key={`tweet-${i}`} className="my-8 flex justify-center">
                      <div className="w-full max-w-lg dark:text-neutral-200">
                        <Tweet id={block.id} />
                      </div>
                    </div>
                  );
                } else {
                  element = (
                    <div
                      key={`html-${i}`}
                      className="text-[#334155] dark:text-gray-200"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((block.content || "").replace(/<img /g, '<img sizes="(max-width: 768px) 100vw, 800px" loading="lazy" ')) }}
                    />
                  );
                }

                if (isMidpoint) {
                  return (
                    <Fragment key={`frag-${i}`}>
                      {element}
                      <div className="my-10" key={`newsletter-${i}`}>
                        <InlineNewsletterCard />
                      </div>
                    </Fragment>
                  );
                }

                return element;
              })}
              {isGated && (
                <div className="my-10 p-8 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#16A34A]/30 text-center shadow-xl">
                  <h3 className="text-2xl font-bold text-white mb-3">Keep Reading</h3>
                  <p className="text-gray-300 mb-6 max-w-md mx-auto">This article is exclusively for our members. Log in or sign up for free to read the rest of the tactical breakdown.</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/sign-up" className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803d] text-white font-medium rounded-xl transition-colors">Create Free Account</a>
                    <a href="/sign-in" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors">Log In</a>
                  </div>
                </div>
              )}
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
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((model.html || "").replace(/<img /g, '<img sizes="(max-width: 768px) 100vw, 800px" loading="lazy" ')) }}
          />
        </>
      );
    }

    let basicBlocks = model.blocks;
    if (isGated && basicBlocks) {
      const cutOffIndex = Math.ceil(basicBlocks.length * (gatekeepPoint / 100));
      basicBlocks = basicBlocks.slice(0, cutOffIndex);
    }

    return (
      <>
        <GlossaryStyles />
        <div ref={containerRef} className={className}>
          {basicBlocks?.map((block, index) => {
            let element = null;

            if (block.type === "heading" && block.level === 2) {
              element = <h2 key={block.id || index} id={block.id}>{block.text}</h2>;
            } else if (block.type === "heading" && block.level === 3) {
              element = <h3 key={block.id || index} id={block.id}>{block.text}</h3>;
            } else if (block.type === "blockquote") {
              element = <blockquote key={index}>{annotateTextWithGlossary(block.text)}</blockquote>;
            } else if (block.type === "unordered-list") {
              element = (
                <ul key={index}>
                  {block.items.map((item) => <li key={item}>{annotateTextWithGlossary(item)}</li>)}
                </ul>
              );
            } else if (block.type === "ordered-list") {
              element = (
                <ol key={index}>
                  {block.items.map((item) => <li key={item}>{annotateTextWithGlossary(item)}</li>)}
                </ol>
              );
            } else if (block.type === "editorial") {
              element = <EditorialBlockView key={`${block.block.kind}-${index}`} block={block.block} />;
            } else {
              element = <p key={index}>{annotateTextWithGlossary(block.text)}</p>;
            }

            const isMidpoint = !isGated && index === Math.floor(basicBlocks!.length / 2) && index > 1;

            if (isMidpoint) {
              return (
                <Fragment key={`frag-${index}`}>
                  {element}
                  <div className="my-10" key={`newsletter-${index}`}>
                    <InlineNewsletterCard />
                  </div>
                </Fragment>
              );
            }

            return element;
          })}
          {isGated && (
            <div className="my-10 p-8 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#16A34A]/30 text-center shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-3">Keep Reading</h3>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">This article is exclusively for our members. Log in or sign up for free to read the rest of the tactical breakdown.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/sign-up" className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803d] text-white font-medium rounded-xl transition-colors">Create Free Account</a>
                <a href="/sign-in" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors">Log In</a>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }, [className, model, gatekeepPoint, isSignedIn]);

  return content;
}
