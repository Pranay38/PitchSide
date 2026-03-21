import { useMemo, useEffect, useRef } from "react";
import type { BlogPost } from "../data/posts";
import {
  buildEditorialBlock,
  isSelfClosingEditorialBlock,
  parseEditorialCloseMarker,
  parseEditorialOpenMarker,
  renderEditorialBlockHtml,
  type EditorialBlock,
} from "../lib/editorialBlocks";
import { getAllTerms, lookupTerm } from "../data/footballGlossary";
import { GlossaryTooltip, GlossaryStyles } from "./GlossaryTooltip";
import DOMPurify from "dompurify";

export interface ContentHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

type PlainBlock =
  | { type: "heading"; text: string; level: 2 | 3; id: string }
  | { type: "blockquote"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "editorial"; block: EditorialBlock };

export interface ArticleContentModel {
  isRich: boolean;
  html?: string;
  blocks?: PlainBlock[];
  headings: ContentHeading[];
  editorialKinds: EditorialBlock["kind"][];
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function uniqueHeadingId(base: string, seen: Set<string>): string {
  if (!seen.has(base)) {
    seen.add(base);
    return base;
  }

  let suffix = 2;
  while (seen.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  const id = `${base}-${suffix}`;
  seen.add(id);
  return id;
}

function normalizePlainParagraph(lines: string[]): string {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

function getTopLevelText(node: Element): string {
  return (node.textContent || "").trim();
}

function buildHtmlEditorialModel(content: string): ArticleContentModel {
  if (typeof DOMParser === "undefined") {
    return { isRich: true, html: content, headings: [], editorialKinds: [] };
  }

  const doc = new DOMParser().parseFromString(content, "text/html");
  const editorialKinds: EditorialBlock["kind"][] = [];
  let node = doc.body.firstElementChild;

  while (node) {
    const nextNode = node.nextElementSibling;
    const marker = node.tagName === "P" ? parseEditorialOpenMarker(getTopLevelText(node)) : null;

    if (!marker) {
      node = nextNode;
      continue;
    }

    if (isSelfClosingEditorialBlock(marker.kind)) {
      const block = buildEditorialBlock(marker, []);
      if (block) {
        editorialKinds.push(block.kind);
        const fragment = doc.createRange().createContextualFragment(renderEditorialBlockHtml(block));
        node.replaceWith(fragment);
      }
      node = nextNode;
      continue;
    }

    const blockLines: string[] = [];
    const removableNodes: Element[] = [];
    let cursor = nextNode;
    let closeNode: Element | null = null;

    while (cursor) {
      const cursorText = getTopLevelText(cursor);
      const closeMarker = cursor.tagName === "P" ? parseEditorialCloseMarker(cursorText) : null;

      if (closeMarker === marker.kind) {
        closeNode = cursor;
        break;
      }

      blockLines.push(cursorText);
      removableNodes.push(cursor);
      cursor = cursor.nextElementSibling;
    }

    if (!closeNode) {
      node = nextNode;
      continue;
    }

    const resumeNode = closeNode.nextElementSibling;
    const block = buildEditorialBlock(marker, blockLines);

    if (block) {
      editorialKinds.push(block.kind);
      const fragment = doc.createRange().createContextualFragment(renderEditorialBlockHtml(block));
      node.replaceWith(fragment);
      removableNodes.forEach((item) => item.remove());
      closeNode.remove();
    }

    node = resumeNode;
  }

  const seenIds = new Set<string>();
  const headings: ContentHeading[] = [];

  Array.from(doc.body.querySelectorAll("h2, h3")).forEach((element) => {
    const text = element.textContent?.trim() || "";
    if (!text) return;

    const id = uniqueHeadingId(slugifyHeading(text), seenIds);
    element.id = id;
    headings.push({
      id,
      text,
      level: element.tagName === "H2" ? 2 : 3,
    });
  });

  // Annotate glossary terms in the HTML
  const annotatedHtml = annotateHtmlWithGlossary(doc.body.innerHTML);

  return {
    isRich: true,
    html: annotatedHtml,
    headings,
    editorialKinds,
  };
}

/** Build a regex that matches any glossary term (case-insensitive, whole-word) */
function buildGlossaryRegex(): RegExp {
  const terms = getAllTerms(); // sorted longest-first
  if (terms.length === 0) return /(?!)/; // never matches
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

const glossaryRegex = buildGlossaryRegex();

/** Wrap glossary terms in HTML string with data-glossary span markers */
function annotateHtmlWithGlossary(html: string): string {
  // Only annotate text outside of HTML tags
  return html.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag; // pass-through HTML tags
    return text.replace(glossaryRegex, (m: string) => {
      const entry = lookupTerm(m);
      if (!entry) return m;
      return `<span class="glossary-term-wrapper" data-glossary-term="${entry.term}" data-glossary-def="${entry.definition.replace(/"/g, '&quot;')}" style="position:relative;display:inline;cursor:help"><span class="glossary-term" style="border-bottom:1.5px dotted #16A34A">${m}</span></span>`;
    });
  });
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

function buildPlainEditorialModel(content: string): ArticleContentModel {
  const lines = content.split("\n");
  const blocks: PlainBlock[] = [];
  const headings: ContentHeading[] = [];
  const editorialKinds: EditorialBlock["kind"][] = [];
  const seenIds = new Set<string>();
  let index = 0;

  while (index < lines.length) {
    const current = lines[index].trim();

    if (!current) {
      index += 1;
      continue;
    }

    const marker = parseEditorialOpenMarker(current);
    if (marker) {
      if (isSelfClosingEditorialBlock(marker.kind)) {
        const block = buildEditorialBlock(marker, []);
        if (block) {
          blocks.push({ type: "editorial", block });
          editorialKinds.push(block.kind);
        }
        index += 1;
        continue;
      }

      const blockLines: string[] = [];
      index += 1;

      while (index < lines.length) {
        const nextLine = lines[index].trim();
        if (parseEditorialCloseMarker(nextLine) === marker.kind) {
          break;
        }
        if (nextLine) {
          blockLines.push(nextLine);
        }
        index += 1;
      }

      const block = buildEditorialBlock(marker, blockLines);
      if (block) {
        blocks.push({ type: "editorial", block });
        editorialKinds.push(block.kind);
      }

      index += 1;
      continue;
    }

    if (current.startsWith("## ")) {
      const text = current.replace(/^##\s+/, "").trim();
      const id = uniqueHeadingId(slugifyHeading(text), seenIds);
      headings.push({ id, text, level: 2 });
      blocks.push({ type: "heading", level: 2, text, id });
      index += 1;
      continue;
    }

    if (current.startsWith("### ")) {
      const text = current.replace(/^###\s+/, "").trim();
      const id = uniqueHeadingId(slugifyHeading(text), seenIds);
      headings.push({ id, text, level: 3 });
      blocks.push({ type: "heading", level: 3, text, id });
      index += 1;
      continue;
    }

    if (current.startsWith("> ")) {
      const quoteLines = [current.replace(/^>\s+/, "").trim()];
      index += 1;
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().replace(/^>\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    if (current.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().replace(/^- /, "").trim());
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(current)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines = [current];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (!nextLine) {
        index += 1;
        break;
      }
      if (
        nextLine.startsWith("## ")
        || nextLine.startsWith("### ")
        || nextLine.startsWith("> ")
        || nextLine.startsWith("- ")
        || /^\d+\.\s+/.test(nextLine)
        || parseEditorialOpenMarker(nextLine)
      ) {
        break;
      }
      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: normalizePlainParagraph(paragraphLines) });
  }

  return {
    isRich: false,
    blocks,
    headings,
    editorialKinds,
  };
}

export function getArticleContentModel(content: string): ArticleContentModel {
  return content.trim().startsWith("<")
    ? buildHtmlEditorialModel(content)
    : buildPlainEditorialModel(content);
}

export function buildQuickSummary(post: BlogPost, model: ArticleContentModel): string[] {
  const bullets = [post.excerpt];

  if (model.editorialKinds.length > 0) {
    const names = Array.from(
      new Set(
        model.editorialKinds.map((kind) => {
          if (kind === "stats-card") return "stats card";
          if (kind === "quote-block") return "quote block";
          if (kind === "key-takeaways") return "takeaways";
          if (kind === "comparison-table") return "comparison table";
          if (kind === "tactical-board") return "tactical board";
          return "timeline";
        }),
      ),
    );

    bullets.push(`Includes editorial blocks like ${names.slice(0, 2).join(" and ")}.`);
  } else if (model.headings.length > 0) {
    const sectionPreview = model.headings.slice(0, 2).map((heading) => heading.text).join(" and ");
    bullets.push(`Sections include ${sectionPreview}.`);
  } else if (post.tags.length > 0) {
    bullets.push(`Focus areas include ${post.tags.slice(0, 3).join(", ")}.`);
  }

  bullets.push(`${post.readTime} focused on ${post.playerName ? `${post.playerName} and ${post.club}` : post.club}.`);
  return bullets;
}

function EditorialBlockView({ block }: { block: EditorialBlock }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderEditorialBlockHtml(block), { ADD_TAGS: ["iframe"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target", "rel"] }) }} />
  );
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
  }, [containerRef.current]);
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

  const content = useMemo(() => {
    if (model.isRich) {
      return (
        <>
          <GlossaryStyles />
          <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(model.html || "", { ADD_TAGS: ["iframe", "span", "figure", "figcaption"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target", "rel", "data-glossary-term", "data-glossary-def", "style", "data-embedded-image"] }) }} />
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
