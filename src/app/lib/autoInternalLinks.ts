interface LinkTarget {
  pattern: RegExp;
  href: string;
  label: string;
}

// Static link targets — club hubs and topic pages
const LINK_TARGETS: LinkTarget[] = [
  { pattern: /\b(Arsenal)\b/i, href: "/club/arsenal", label: "Arsenal" },
  { pattern: /\b(Barcelona|Barça|Barca)\b/i, href: "/club/barcelona", label: "Barcelona" },
  { pattern: /\b(Real Madrid)\b/i, href: "/club/real-madrid", label: "Real Madrid" },
  { pattern: /\b(Bayern Munich|Bayern)\b/i, href: "/club/bayern-munich", label: "Bayern Munich" },
  { pattern: /\b(PSG|Paris Saint[- ]Germain)\b/i, href: "/club/paris-saint-germain", label: "PSG" },
  { pattern: /\b(Liverpool)\b/i, href: "/club/liverpool", label: "Liverpool" },
  { pattern: /\b(Manchester City|Man City)\b/i, href: "/club/manchester-city", label: "Manchester City" },
  { pattern: /\b(Manchester United|Man United|Man Utd)\b/i, href: "/club/manchester-united", label: "Manchester United" },
  { pattern: /\b(Chelsea)\b/i, href: "/club/chelsea", label: "Chelsea" },
  { pattern: /\b(Inter Milan|Inter)\b/i, href: "/club/inter-milan", label: "Inter Milan" },
  { pattern: /\b(Borussia Dortmund|Dortmund|BVB)\b/i, href: "/club/borussia-dortmund", label: "Borussia Dortmund" },
  { pattern: /\b(Tottenham|Spurs)\b/i, href: "/club/tottenham", label: "Tottenham" },
  { pattern: /\b(Champions League|UCL)\b/i, href: "/topic/champions-league", label: "Champions League" },
  { pattern: /\b(Premier League)\b/i, href: "/topic/premier-league", label: "Premier League" },
  { pattern: /\b(La Liga)\b/i, href: "/topic/la-liga", label: "La Liga" },
  { pattern: /\b(World Cup)\b/i, href: "/topic/world-cup", label: "World Cup" },
  { pattern: /\b(Bundesliga)\b/i, href: "/topic/bundesliga", label: "Bundesliga" },
  { pattern: /\b(Serie A)\b/i, href: "/topic/serie-a", label: "Serie A" },
  { pattern: /\b(Ligue 1)\b/i, href: "/topic/ligue-1", label: "Ligue 1" },
];

const MAX_LINKS = 8; // Don't over-link — max 8 auto-links per article

/**
 * Inject internal links into HTML content.
 * Rules:
 * - Only link the FIRST occurrence of each entity
 * - Never link inside existing <a> tags or headings
 * - Max 8 auto-links per article
 */
export function injectInternalLinks(html: string): string {
  const linked = new Set<string>();
  let linkCount = 0;
  let result = html;

  for (const target of LINK_TARGETS) {
    if (linkCount >= MAX_LINKS) break;
    if (linked.has(target.href)) continue;

    // Only replace in text nodes outside <a>, <h2>, <h3> tags
    // This regex looks for the pattern where it's NOT followed by a closing tag before an opening tag
    const safePattern = new RegExp(
      `(?<!<a[^>]*>(?:[^<]|<(?!/a))*?)(?<!<h[23][^>]*>(?:[^<]|<(?!/h))*?)${target.pattern.source}`,
      "i"
    );

    if (safePattern.test(result)) {
      result = result.replace(safePattern, (match) => {
        linked.add(target.href);
        linkCount++;
        return `<a href="${target.href}" class="auto-internal-link">${match}</a>`;
      });
    }
  }

  return result;
}
