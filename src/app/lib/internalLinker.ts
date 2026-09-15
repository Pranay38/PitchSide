export interface PillarPageLink {
  keyword: string;
  url: string;
}

// Map keywords to their pillar page URLs
export const pillarPages: PillarPageLink[] = [
  { keyword: "inverted fullback", url: "/football-tactics/inverted-fullback" },
  { keyword: "inverted fullbacks", url: "/football-tactics/inverted-fullback" },
  { keyword: "rest defence", url: "/football-tactics/rest-defence" },
  { keyword: "half spaces", url: "/football-tactics/half-spaces" },
  { keyword: "half space", url: "/football-tactics/half-spaces" },
  { keyword: "gegenpressing", url: "/football-tactics/gegenpressing" },
  { keyword: "false nine", url: "/football-tactics/false-nine" },
  { keyword: "box midfield", url: "/football-tactics/box-midfield" },
  { keyword: "double pivot", url: "/football-tactics/double-pivot" }
];

export function buildInternalLinkRegex(): RegExp {
  // Sort longest-first to prevent partial matches
  const sorted = [...pillarPages].sort((a, b) => b.keyword.length - a.keyword.length);
  if (sorted.length === 0) return /(?!)/;
  
  const escaped = sorted.map((p) => p.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
}

const linkRegex = buildInternalLinkRegex();

/**
 * Wraps keywords in HTML string with links to pillar pages.
 * Only annotates the first occurrence of each keyword to avoid link spam.
 */
export function annotateHtmlWithInternalLinks(html: string): string {
  const seenKeywords = new Set<string>();
  let insideAnchor = false;
  
  return html.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) {
      if (tag.toLowerCase().startsWith("<a ")) {
        insideAnchor = true;
      } else if (tag.toLowerCase().startsWith("</a")) {
        insideAnchor = false;
      }
      return tag; // pass-through HTML tags
    }
    
    if (insideAnchor) {
      return text; // don't process text inside existing anchor tags
    }
    
    return text.replace(linkRegex, (m: string) => {
      const lowerM = m.toLowerCase();
      if (seenKeywords.has(lowerM)) {
        return m; // Only link once per article
      }
      
      const entry = pillarPages.find(p => p.keyword.toLowerCase() === lowerM);
      if (!entry) return m;
      
      seenKeywords.add(lowerM);
      return `<a href="${entry.url}" class="internal-pillar-link font-semibold text-[#16A34A] hover:underline" title="Read more about ${m}">${m}</a>`;
    });
  });
}
