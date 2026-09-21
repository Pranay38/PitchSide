"use client";
import DOMPurify from "isomorphic-dompurify";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { usePostHog } from "posthog-js/react";

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
import { annotateHtmlWithInternalLinks } from "../lib/internalLinker";

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

const GatedInlineWall = ({ onSignupStarted }: { onSignupStarted: () => void }) => {
  return (
    <div className="relative overflow-hidden mt-8 max-h-[500px] pitchside-article-content-gated">
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#F8FAFC]/90 to-[#F8FAFC] dark:via-[#0B1120]/90 dark:to-[#0B1120] flex flex-col justify-end pb-8">
        <div className="mx-auto w-full max-w-2xl p-8 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-[#16A34A]/30 text-center shadow-2xl z-20 relative">
          <h3 className="text-2xl font-bold text-white mb-3">Keep Reading</h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">Free account: full tactical breakdowns, matchday newsletter, follow your club.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignUpButton mode="modal" forceRedirectUrl={typeof window !== 'undefined' ? window.location.href : '/'}>
              <button onClick={onSignupStarted} className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803d] text-white font-medium rounded-xl transition-colors cursor-pointer">Create Free Account</button>
            </SignUpButton>
            <SignInButton mode="modal" forceRedirectUrl={typeof window !== 'undefined' ? window.location.href : '/'}>
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors cursor-pointer">Log In</button>
            </SignInButton>
          </div>
        </div>
      </div>
      {/* Generic blurry background lines to simulate content */}
      <div className="blur-md opacity-30 select-none pointer-events-none space-y-4 pt-10 px-4 pb-32">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
        <div className="h-40 bg-gray-300 dark:bg-gray-700 rounded-xl w-full my-8"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      </div>
    </div>
  );
};

export function ArticleContentRenderer({
  model,
  className = "pitchside-article-content",
  gatekeepPoint = 0,
  isSignedIn = false,
  isServerGated = false,
}: {
  model: ArticleContentModel;
  className?: string;
  gatekeepPoint?: number;
  isSignedIn?: boolean;
  isServerGated?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useGlossaryHydration(containerRef);
  useScrollytelling(containerRef);

  const posthog = usePostHog();
  useEffect(() => {
    if (isServerGated) {
      posthog?.capture("wall_shown");
    }
  }, [isServerGated, posthog]);

  const content = useMemo(() => {
    const onSignupStarted = () => {
      posthog?.capture("signup_started");
    };

    let richBlocks = model.richBlocks;

    if (model.isRich) {
      if (richBlocks && richBlocks.length > 0) {
        return (
          <>
            <GlossaryStyles />
            <div ref={containerRef} className={className}>
              {richBlocks.map((block, i) => {
                const isMidpoint = !isServerGated && i === Math.floor(richBlocks!.length / 2) && i > 1;
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
                      dangerouslySetInnerHTML={{ __html: annotateHtmlWithInternalLinks(DOMPurify.sanitize((block.content || "").replace(/<img /g, '<img sizes="(max-width: 768px) 100vw, 800px" loading="lazy" width="800" height="1000" class="tactical-diagram w-full object-contain mx-auto my-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800" style="aspect-ratio: 4/5; max-height: 75vh; background: #0F172A;" '))) }}
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
              {isServerGated && <GatedInlineWall onSignupStarted={onSignupStarted} />}
            </div>
          </>
        );
      }

      let fallbackHtml = model.html || "";

      return (
        <>
          <GlossaryStyles />
          <div
            ref={containerRef}
            className={`text-[#334155] dark:text-gray-200 html-blob leading-8 ${className}`}
            dangerouslySetInnerHTML={{ __html: annotateHtmlWithInternalLinks(DOMPurify.sanitize(fallbackHtml.replace(/<img /g, '<img sizes="(max-width: 768px) 100vw, 800px" loading="lazy" width="800" height="1000" class="tactical-diagram w-full object-contain mx-auto my-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800" style="aspect-ratio: 4/5; max-height: 75vh; background: #0F172A;" '))) }}
          />
          {isServerGated && <GatedInlineWall onSignupStarted={onSignupStarted} />}
        </>
      );
    }

    let basicBlocks = model.blocks;

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

            const isMidpoint = !isServerGated && index === Math.floor(basicBlocks!.length / 2) && index > 1;

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
          {isServerGated && <GatedInlineWall onSignupStarted={onSignupStarted} />}
        </div>
      </>
    );
  }, [className, model, gatekeepPoint, isServerGated, posthog]);

  return content;
}
