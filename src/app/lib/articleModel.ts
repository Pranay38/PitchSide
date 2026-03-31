import type { BlogPost } from "../data/posts";
import {
  buildEditorialBlock,
  isSelfClosingEditorialBlock,
  parseEditorialCloseMarker,
  parseEditorialOpenMarker,
  renderEditorialBlockHtml,
  type EditorialBlock,
} from "./editorialBlocks";
import { getAllTerms, lookupTerm } from "../data/footballGlossary";

export interface ContentHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export type PlainBlock =
  | { type: "heading"; text: string; level: 2 | 3; id: string }
  | { type: "blockquote"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "editorial"; block: EditorialBlock };

export type RichBlock =
  | { type: "html"; content: string }
  | { type: "tweet"; id: string };

export interface ArticleContentModel {
  isRich: boolean;
  html?: string;
  richBlocks?: RichBlock[];
  blocks?: PlainBlock[];
  headings: ContentHeading[];
  editorialKinds: EditorialBlock["kind"][];
}

export function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

export function uniqueHeadingId(base: string, seen: Set<string>): string {
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

export function normalizePlainParagraph(lines: string[]): string {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

export function getTopLevelText(node: Element): string {
  return (node.textContent || "").trim();
}

export function buildHtmlEditorialModel(content: string): ArticleContentModel {
  if (typeof DOMParser === "undefined") {
    return { isRich: true, html: content, headings: [], editorialKinds: [] };
  }

  const doc = new DOMParser().parseFromString(content, "text/html");
  const editorialKinds: EditorialBlock["kind"][] = [];
  let node = doc.body.firstElementChild;

  while (node) {
    const nextNode = node.nextElementSibling;

    // ── New WYSIWYG node format: <div data-editorial-block="kind" data-title="..." ...> ──
    if (node.tagName === "DIV" && node.hasAttribute("data-editorial-block")) {
      const kind = node.getAttribute("data-editorial-block") as EditorialBlock["kind"];
      const rawTitle = node.getAttribute("data-title") || "";
      const rawItems = node.getAttribute("data-items") || "[]";
      const rawColumns = node.getAttribute("data-columns") || "";
      const rawQuote = node.getAttribute("data-quote") || "";
      const rawAttribution = node.getAttribute("data-attribution") || "";
      const rawRole = node.getAttribute("data-role") || "";
      const rawBlockId = node.getAttribute("data-block-id") || "";
      const rawDescription = node.getAttribute("data-description") || "";

      let items: string[] = [];
      try { items = JSON.parse(rawItems); } catch { /* ignore */ }

      let block: EditorialBlock | null = null;

      if (kind === "timeline") {
        block = { kind, title: rawTitle || "Timeline", items: items.map(row => { const [label, title2, note] = row.split("|").map((s: string) => s.trim()); return { label: label || "", title: title2 || row, note: note || "" }; }) };
      } else if (kind === "stats-card") {
        block = { kind, title: rawTitle || "Stats Card", items: items.map(row => { const [label, value, hint] = row.split("|").map((s: string) => s.trim()); return { label: label || "", value: value || "", hint: hint || "" }; }) };
      } else if (kind === "quote-block") {
        block = { kind, data: { quote: rawQuote, attribution: rawAttribution, role: rawRole } };
      } else if (kind === "key-takeaways") {
        block = { kind, data: { title: rawTitle || "Key Takeaways", items: items.map((s: string) => s.replace(/^[-*]\s*/, "").trim()).filter(Boolean) } };
      } else if (kind === "comparison-table") {
        const columns = rawColumns ? rawColumns.split("|").map((s: string) => s.trim()) : ["Metric", "Option A", "Option B"];
        block = { kind, data: { title: rawTitle || "Comparison Table", columns, rows: items.map(row => { const cells = row.split("|").map((s: string) => s.trim()); while (cells.length < columns.length) cells.push(""); return cells.slice(0, columns.length); }) } };
      } else if (kind === "tactical-board") {
        block = { kind, data: { id: rawBlockId, title: rawTitle || "Tactical Board", description: rawDescription } };
      } else if (kind === "match-center") {
        block = { kind, data: { id: rawBlockId } };
      }

      if (block) {
        editorialKinds.push(block.kind);
        const fragment = doc.createRange().createContextualFragment(renderEditorialBlockHtml(block));
        node.replaceWith(fragment);
      } else {
        node.remove();
      }

      node = nextNode;
      continue;
    }

    // ── Legacy [marker] paragraph format ──
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

  // Break the body down into chunks of HTML and actionable React components (like Tweet)
  const richBlocks: RichBlock[] = [];
  let currentHtmlChunk = "";

  const pushHtmlChunk = () => {
    if (currentHtmlChunk.trim()) {
      richBlocks.push({ type: "html", content: annotateHtmlWithGlossary(currentHtmlChunk) });
      currentHtmlChunk = "";
    }
  };

  Array.from(doc.body.children).forEach((child) => {
    // Check for Sofascore lazy loading
    if (child.tagName === "IFRAME" && child.getAttribute("src")?.includes("sofascore.com")) {
      child.setAttribute("data-lazy-src", child.getAttribute("src")!);
      child.setAttribute("src", "");
      child.classList.add("lazy-embed-iframe");
      currentHtmlChunk += child.outerHTML;
      return;
    }

    const sofascoreChildIframes = Array.from(child.querySelectorAll('iframe[src*="sofascore.com"]'));
    sofascoreChildIframes.forEach((iframe) => {
      iframe.setAttribute("data-lazy-src", iframe.getAttribute("src")!);
      iframe.setAttribute("src", "");
      iframe.classList.add("lazy-embed-iframe");
    });

    // Check for Twitter embed to swap with react-tweet
    let tweetNode = child.tagName === "BLOCKQUOTE" && child.classList.contains("twitter-tweet") ? child : null;
    if (!tweetNode && child.getAttribute("data-social-embed") === "twitter") {
      tweetNode = child.querySelector(".twitter-tweet");
    }

    if (tweetNode) {
      const links = Array.from(tweetNode.querySelectorAll("a"));
      const lastLink = links[links.length - 1];
      if (lastLink && lastLink.href.includes("status/")) {
        const idMatch = lastLink.href.match(/status\/(\d+)/);
        if (idMatch && idMatch[1]) {
          pushHtmlChunk();
          richBlocks.push({ type: "tweet", id: idMatch[1] });
          return;
        }
      }
    }

    currentHtmlChunk += child.outerHTML;
  });

  pushHtmlChunk();

  return {
    isRich: true,
    html: doc.body.innerHTML, // Keep for legacy
    richBlocks,
    headings,
    editorialKinds,
  };
}

/** Build a regex that matches any glossary term (case-insensitive, whole-word) */
export function buildGlossaryRegex(): RegExp {
  const terms = getAllTerms(); // sorted longest-first
  if (terms.length === 0) return /(?!)/; // never matches
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

export const glossaryRegex = buildGlossaryRegex();

/** Wrap glossary terms in HTML string with data-glossary span markers */
export function annotateHtmlWithGlossary(html: string): string {
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

export function buildPlainEditorialModel(content: string): ArticleContentModel {
  const lines = content.split("\\n");
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
      const text = current.replace(/^##\\s+/, "").trim();
      const id = uniqueHeadingId(slugifyHeading(text), seenIds);
      headings.push({ id, text, level: 2 });
      blocks.push({ type: "heading", level: 2, text, id });
      index += 1;
      continue;
    }

    if (current.startsWith("### ")) {
      const text = current.replace(/^###\\s+/, "").trim();
      const id = uniqueHeadingId(slugifyHeading(text), seenIds);
      headings.push({ id, text, level: 3 });
      blocks.push({ type: "heading", level: 3, text, id });
      index += 1;
      continue;
    }

    if (current.startsWith("> ")) {
      const quoteLines = [current.replace(/^>\\s+/, "").trim()];
      index += 1;
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().replace(/^>\\s+/, "").trim());
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

    if (/^\\d+\\.\\s+/.test(current)) {
      const items: string[] = [];
      while (index < lines.length && /^\\d+\\.\\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\\d+\\.\\s+/, "").trim());
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
        || /^\\d+\\.\\s+/.test(nextLine)
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
