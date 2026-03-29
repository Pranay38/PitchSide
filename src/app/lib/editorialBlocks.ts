function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface TimelineItem {
  label: string;
  title: string;
  note?: string;
}

export interface StatsCardItem {
  label: string;
  value: string;
  hint?: string;
}

export interface QuoteBlockData {
  quote: string;
  attribution?: string;
  role?: string;
}

export interface KeyTakeawaysData {
  title: string;
  items: string[];
}

export interface ComparisonTableData {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface TacticalBoardData {
  id: string;
  title: string;
  description?: string;
}

export interface MatchCenterData {
  id: string;
}

export interface ImageGalleryData {
  title: string;
  images: { src: string; caption: string }[];
  columns: number;
}

export interface HighlightSnippetData {
  text: string;
  attribution: string;
  context: string;
  theme: "dark" | "green" | "light";
}

export type EditorialBlock =
  | {
      kind: "timeline";
      title: string;
      items: TimelineItem[];
    }
  | {
      kind: "stats-card";
      title: string;
      items: StatsCardItem[];
    }
  | {
      kind: "quote-block";
      data: QuoteBlockData;
    }
  | {
      kind: "key-takeaways";
      data: KeyTakeawaysData;
    }
  | {
      kind: "comparison-table";
      data: ComparisonTableData;
    }
  | {
      kind: "tactical-board";
      data: TacticalBoardData;
    }
  | {
      kind: "match-center";
      data: MatchCenterData;
    }
  | {
      kind: "image-gallery";
      data: ImageGalleryData;
    }
  | {
      kind: "highlight-snippet";
      data: HighlightSnippetData;
    };

interface EditorialOpenMarker {
  kind: EditorialBlock["kind"];
  attrs: Record<string, string>;
}

export interface EditorialSnippet {
  id: EditorialBlock["kind"];
  label: string;
  description: string;
  html: string;
}

const OPEN_MARKER = /^\[([a-z-]+)(?:\s+([^\]]+))?\]$/i;
const CLOSE_MARKER = /^\[\/([a-z-]+)\]$/i;

const BLOCK_LABELS: Record<EditorialBlock["kind"], string> = {
  timeline: "Timeline",
  "stats-card": "Stats Card",
  "quote-block": "Quote Block",
  "key-takeaways": "Key Takeaways",
  "comparison-table": "Comparison Table",
  "tactical-board": "Tactical Board",
  "match-center": "Stadium Match Center",
  "image-gallery": "Image Gallery",
  "highlight-snippet": "Highlight Snippet",
};

export const EDITORIAL_SNIPPETS: EditorialSnippet[] = [
  {
    id: "timeline",
    label: "Timeline",
    description: "Add a step-by-step match, transfer, or season sequence.",
    html: [
      "<p>[timeline title=\"How the match turned\"]</p>",
      "<p>12' | Early overload | Built access down the right side</p>",
      "<p>37' | Midfield reset | Control improved after the shape changed</p>",
      "<p>61' | Double substitution | The tempo lift changed the game state</p>",
      "<p>[/timeline]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "stats-card",
    label: "Stats Card",
    description: "Highlight three or four numbers with quick context.",
    html: [
      "<p>[stats-card title=\"Match Snapshot\"]</p>",
      "<p>Possession | 61% | Territory tilted after minute 20</p>",
      "<p>Shots | 14 | Sustained pressure from zone 14</p>",
      "<p>PPDA | 8.4 | Press stayed live for most of the match</p>",
      "<p>[/stats-card]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "quote-block",
    label: "Quote Block",
    description: "Pull a sharper quote out of the body copy.",
    html: [
      "<p>[quote-block quote=\"We had to find a different angle into midfield.\" attribution=\"Manager Name\" role=\"Head coach\"]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "key-takeaways",
    label: "Key Takeaways",
    description: "Summarize the section in fast, scannable bullets.",
    html: [
      "<p>[key-takeaways title=\"Key Takeaways\"]</p>",
      "<p>- The press worked because the distances stayed short.</p>",
      "<p>- The bench changed the rhythm, not just the personnel.</p>",
      "<p>- Territory mattered more than raw possession.</p>",
      "<p>[/key-takeaways]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "comparison-table",
    label: "Comparison Table",
    description: "Compare phases, players, or teams in one block.",
    html: [
      "<p>[comparison-table title=\"Before and After\" columns=\"Metric|First Half|Second Half\"]</p>",
      "<p>Touches in box | 5 | 13</p>",
      "<p>Progressive passes | 17 | 28</p>",
      "<p>Shots | 4 | 10</p>",
      "<p>[/comparison-table]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "tactical-board",
    label: "Tactical Board",
    description: "Embed a saved tactical sequence directly inside the article.",
    html: [
      "<p>[tactical-board id=\"paste-sequence-id\" title=\"Pressing trap sequence\" description=\"Optional deck for the embedded tactical sequence.\"]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "match-center",
    label: "Stadium Match Center",
    description: "Embed a live or finished broadcast-style match center.",
    html: [
      "<p>[match-center id=\"match-id-here\"]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "image-gallery",
    label: "Image Gallery",
    description: "Display a grid of images with captions and lightbox.",
    html: [
      "<p>[image-gallery title=\"Match Gallery\" columns=\"3\"]</p>",
      "<p>https://example.com/image1.jpg | First-half action</p>",
      "<p>https://example.com/image2.jpg | The decisive moment</p>",
      "<p>https://example.com/image3.jpg | Post-match celebrations</p>",
      "<p>[/image-gallery]</p>",
      "<p></p>",
    ].join(""),
  },
  {
    id: "highlight-snippet",
    label: "Highlight Snippet",
    description: "A shareable branded excerpt — perfect for WhatsApp and social.",
    html: [
      '<p>[highlight-snippet attribution="The Touchline Dribble" context="Tactical Analysis" theme="dark"]</p>',
      "<p>The pressing trap worked because the distances stayed short — two metres between each man, closing every lane before it opened.</p>",
      "<p>[/highlight-snippet]</p>",
      "<p></p>",
    ].join(""),
  },
];

function parseAttributes(attributeString = ""): Record<string, string> {
  const attributes: Record<string, string> = {};

  attributeString.replace(/([a-zA-Z0-9_-]+)="([^"]*)"/g, (_, key: string, value: string) => {
    attributes[key] = value;
    return "";
  });

  return attributes;
}

export function parseEditorialOpenMarker(value: string): EditorialOpenMarker | null {
  const match = value.trim().match(OPEN_MARKER);
  if (!match) return null;

  const kind = match[1].toLowerCase() as EditorialBlock["kind"];
  if (!(kind in BLOCK_LABELS)) return null;

  return {
    kind,
    attrs: parseAttributes(match[2] || ""),
  };
}

export function parseEditorialCloseMarker(value: string): EditorialBlock["kind"] | null {
  const match = value.trim().match(CLOSE_MARKER);
  if (!match) return null;

  const kind = match[1].toLowerCase() as EditorialBlock["kind"];
  return kind in BLOCK_LABELS ? kind : null;
}

export function isSelfClosingEditorialBlock(kind: EditorialBlock["kind"]): boolean {
  return kind === "quote-block" || kind === "tactical-board" || kind === "match-center";
}

function parseTimelineItems(lines: string[]): TimelineItem[] {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, title, note] = line.split("|").map((item) => item.trim());
      return {
        label: label || "Moment",
        title: title || line,
        note: note || "",
      };
    });
}

function parseStatsCardItems(lines: string[]): StatsCardItem[] {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value, hint] = line.split("|").map((item) => item.trim());
      return {
        label: label || "Metric",
        value: value || "",
        hint: hint || "",
      };
    });
}

function parseTakeawayItems(lines: string[]): string[] {
  return lines
    .map((line) => line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function parseComparisonRows(lines: string[], columnCount: number): string[][] {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((item) => item.trim());
      while (parts.length < columnCount) {
        parts.push("");
      }
      return parts.slice(0, columnCount);
    });
}

export function buildEditorialBlock(
  marker: EditorialOpenMarker,
  lines: string[],
): EditorialBlock | null {
  if (marker.kind === "timeline") {
    return {
      kind: "timeline",
      title: marker.attrs.title || "Timeline",
      items: parseTimelineItems(lines),
    };
  }

  if (marker.kind === "stats-card") {
    return {
      kind: "stats-card",
      title: marker.attrs.title || "Stats Card",
      items: parseStatsCardItems(lines),
    };
  }

  if (marker.kind === "quote-block") {
    return {
      kind: "quote-block",
      data: {
        quote: marker.attrs.quote || "",
        attribution: marker.attrs.attribution || "",
        role: marker.attrs.role || "",
      },
    };
  }

  if (marker.kind === "tactical-board") {
    return {
      kind: "tactical-board",
      data: {
        id: marker.attrs.id || "",
        title: marker.attrs.title || "Tactical board",
        description: marker.attrs.description || "",
      },
    };
  }

  if (marker.kind === "match-center") {
    return {
      kind: "match-center",
      data: {
        id: marker.attrs.id || "",
      },
    };
  }

  if (marker.kind === "key-takeaways") {
    return {
      kind: "key-takeaways",
      data: {
        title: marker.attrs.title || "Key Takeaways",
        items: parseTakeawayItems(lines),
      },
    };
  }

  if (marker.kind === "comparison-table") {
    const columns = (marker.attrs.columns || "Metric|Left|Right")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      kind: "comparison-table",
      data: {
        title: marker.attrs.title || "Comparison Table",
        columns,
        rows: parseComparisonRows(lines, columns.length),
      },
    };
  }

  if (marker.kind === "image-gallery") {
    const images = lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [src, caption] = line.split("|").map((s) => s.trim());
        return { src: src || "", caption: caption || "" };
      })
      .filter((img) => img.src);

    return {
      kind: "image-gallery",
      data: {
        title: marker.attrs.title || "Gallery",
        images,
        columns: parseInt(marker.attrs.columns || "3", 10),
      },
    };
  }

  if (marker.kind === "highlight-snippet") {
    return {
      kind: "highlight-snippet",
      data: {
        text: marker.attrs.text || lines.join(" ").trim() || "",
        attribution: marker.attrs.attribution || "The Touchline Dribble",
        context: marker.attrs.context || "",
        theme: (marker.attrs.theme as "dark" | "green" | "light") || "dark",
      },
    };
  }

  return null;
}

export function renderEditorialBlockHtml(block: EditorialBlock): string {
  if (block.kind === "timeline") {
    const items = block.items
      .map(
        (item) => `
          <div class="rounded-[1.25rem] border border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
            <div class="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">${escapeHtml(item.label)}</div>
            <div class="mt-2 text-base font-bold text-[#0F172A] dark:text-white">${escapeHtml(item.title)}</div>
            ${item.note ? `<p class="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">${escapeHtml(item.note)}</p>` : ""}
          </div>
        `,
      )
      .join("");

    return `
      <section class="not-prose my-10 rounded-[2rem] border border-gray-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-6 shadow-sm dark:border-gray-800 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(8,17,31,0.98))]">
        <div class="mb-5 flex items-center gap-3">
          <div class="h-6 w-1.5 rounded-full bg-[#16A34A]"></div>
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Timeline</p>
            <h3 class="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">${escapeHtml(block.title)}</h3>
          </div>
        </div>
        <div class="grid gap-4">${items}</div>
      </section>
    `;
  }

  if (block.kind === "stats-card") {
    const items = block.items
      .map(
        (item) => `
          <div class="rounded-[1.25rem] border border-gray-200 bg-white/85 p-4 dark:border-white/10 dark:bg-white/5">
            <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">${escapeHtml(item.label)}</p>
            <p class="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">${escapeHtml(item.value)}</p>
            ${item.hint ? `<p class="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">${escapeHtml(item.hint)}</p>` : ""}
          </div>
        `,
      )
      .join("");

    return `
      <section class="not-prose my-10 rounded-[2rem] border border-gray-200 bg-[#0F172A] p-6 text-white shadow-xl shadow-[#0F172A]/10 dark:border-gray-800">
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Stats Card</p>
        <h3 class="mt-2 text-2xl font-black font-outfit text-white">${escapeHtml(block.title)}</h3>
        <div class="mt-5 grid gap-4 md:grid-cols-3">${items}</div>
      </section>
    `;
  }

  if (block.kind === "quote-block") {
    return `
      <section class="not-prose my-10 rounded-[2rem] border border-[#16A34A]/20 bg-[#16A34A]/8 p-6 dark:border-[#16A34A]/25 dark:bg-[#16A34A]/10">
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Quote Block</p>
        <blockquote class="mt-4 border-none pl-0 text-2xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white">
          “${escapeHtml(block.data.quote)}”
        </blockquote>
        ${(block.data.attribution || block.data.role) ? `
          <p class="mt-4 text-sm font-semibold text-[#475569] dark:text-gray-300">
            ${escapeHtml(block.data.attribution || "")}
            ${block.data.attribution && block.data.role ? " · " : ""}
            ${escapeHtml(block.data.role || "")}
          </p>
        ` : ""}
      </section>
    `;
  }

  if (block.kind === "tactical-board") {
    const title = escapeHtml(block.data.title || "Tactical Board");
    const description = escapeHtml(block.data.description || "");
    const id = escapeHtml(block.data.id || "");

    const pitchSvg = `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:180px;display:block;opacity:0.15">
  <rect x="1" y="1" width="318" height="198" fill="none" stroke="#4ade80" stroke-width="1.5"/>
  <line x1="160" y1="1" x2="160" y2="199" stroke="#4ade80" stroke-width="1"/>
  <circle cx="160" cy="100" r="28" fill="none" stroke="#4ade80" stroke-width="1"/>
  <circle cx="160" cy="100" r="2.5" fill="#4ade80"/>
  <rect x="1" y="62" width="48" height="76" fill="none" stroke="#4ade80" stroke-width="1"/>
  <rect x="271" y="62" width="48" height="76" fill="none" stroke="#4ade80" stroke-width="1"/>
  <rect x="1" y="82" width="18" height="36" fill="none" stroke="#4ade80" stroke-width="1"/>
  <rect x="301" y="82" width="18" height="36" fill="none" stroke="#4ade80" stroke-width="1"/>
  <path d="M48,86 A14,14,0,0,1,48,114" fill="none" stroke="#4ade80" stroke-width="0.8"/>
  <path d="M272,86 A14,14,0,0,0,272,114" fill="none" stroke="#4ade80" stroke-width="0.8"/>
</svg>`;

    const embedInner = id
      ? `<div style="text-align:center;padding:16px 0">
           <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.3);color:#4ade80;font-size:12px;font-weight:700;border-radius:999px;padding:5px 14px">
             ⚽ Sequence ready to load
           </span>
           <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:6px 0 0">Tactical animation plays when published</p>
         </div>`
      : `<p style="color:rgba(255,255,255,0.3);font-size:13px;text-align:center;padding:16px">No sequence ID set</p>`;

    return `
      <section class="not-prose my-10" style="border-radius:2rem;overflow:hidden;background:linear-gradient(160deg,#0a1628,#0f1f38,#081320);border:1px solid rgba(255,255,255,0.07);box-shadow:0 25px 50px rgba(0,0,0,0.5)">
        <div style="padding:24px 24px 16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span class="text-[11px] font-black uppercase tracking-[0.22em] text-[#4ade80]">🎯 Tactical Board</span>
            ${id ? `<span style="margin-left:auto;font-size:10px;font-weight:700;color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:2px 8px;font-family:monospace">${id}</span>` : ""}
          </div>
          <h3 class="text-2xl font-black font-outfit text-white" style="margin:0;line-height:1.2">${title}</h3>
          ${description ? `<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.55)">${description}</p>` : ""}
        </div>
        <div
          data-tactical-board-embed="${id}"
          data-title="${title}"
          data-description="${description}"
          style="margin:0 16px 16px;border-radius:1.5rem;overflow:hidden;border:1px solid rgba(255,255,255,0.1);background:#050f1c"
        >
          ${pitchSvg}
          ${embedInner}
        </div>
      </section>
    `;
  }

  if (block.kind === "match-center") {
    const id = escapeHtml(block.data.id || "");

    return `
      <section class="not-prose my-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
        <div data-match-center-embed="${id}">
          <div class="flex min-h-[400px] items-center justify-center text-sm text-gray-500 font-bold uppercase tracking-widest bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            Stadium Match Center loading...
          </div>
        </div>
      </section>
    `;
  }

  if (block.kind === "key-takeaways") {
    const items = block.data.items
      .map(
        (item) => `
          <li class="flex gap-3 rounded-[1.1rem] bg-white/10 px-4 py-3">
            <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4ade80]"></span>
            <span class="text-sm leading-6 text-white/90">${escapeHtml(item)}</span>
          </li>
        `,
      )
      .join("");

    return `
      <section class="not-prose my-10 rounded-[2rem] border border-gray-200 bg-[linear-gradient(135deg,#0f172a,#111f35)] p-6 text-white shadow-xl shadow-[#0F172A]/10 dark:border-gray-800">
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Key Takeaways</p>
        <h3 class="mt-2 text-2xl font-black font-outfit text-white">${escapeHtml(block.data.title)}</h3>
        <ul class="mt-5 space-y-3">${items}</ul>
      </section>
    `;
  }

  if (block.kind === "image-gallery") {
    const cols = Math.min(block.data.columns || 3, 4);
    const gridClass = cols === 1 ? "grid-cols-1" : cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-2 md:grid-cols-3" : "sm:grid-cols-2 md:grid-cols-4";
    const images = block.data.images
      .map(
        (img, i) => `
          <div class="group relative overflow-hidden rounded-[1.25rem] border border-gray-200 dark:border-gray-800 cursor-pointer" onclick="this.querySelector('.gallery-lightbox').classList.toggle('hidden')">
            <img
              src="${escapeHtml(img.src)}"
              alt="${escapeHtml(img.caption || `Image ${i + 1}`)}"
              loading="lazy"
              class="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            ${img.caption ? `<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3"><p class="text-xs font-semibold text-white">${escapeHtml(img.caption)}</p></div>` : ""}
            <div class="gallery-lightbox hidden fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onclick="event.stopPropagation();this.classList.add('hidden')">
              <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.caption)}" class="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl" />
              ${img.caption ? `<p class="absolute bottom-8 text-sm font-semibold text-white/80">${escapeHtml(img.caption)}</p>` : ""}
            </div>
          </div>
        `,
      )
      .join("");

    return `
      <section class="not-prose my-10 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Gallery</p>
        <h3 class="mt-2 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">${escapeHtml(block.data.title)}</h3>
        <div class="mt-5 grid gap-3 ${gridClass}">${images}</div>
      </section>
    `;
  }

  if (block.kind === "highlight-snippet") {
    const { text, attribution, context, theme } = block.data;
    const themeStyles: Record<string, { bg: string; border: string; text: string; accent: string; subtext: string }> = {
      dark:  { bg: "background:linear-gradient(135deg,#0f172a,#1e293b)", border: "border:1px solid rgba(255,255,255,0.08)", text: "color:white", accent: "color:#4ade80", subtext: "color:rgba(255,255,255,0.5)" },
      green: { bg: "background:linear-gradient(135deg,#052e16,#14532d)", border: "border:1px solid rgba(74,222,128,0.2)", text: "color:white", accent: "color:#86efac", subtext: "color:rgba(255,255,255,0.5)" },
      light: { bg: "background:linear-gradient(135deg,#f0fdf4,#ecfdf5)", border: "border:1px solid #bbf7d0", text: "color:#0f172a", accent: "color:#16a34a", subtext: "color:#64748b" },
    };
    const s = themeStyles[theme] || themeStyles.dark;

    const shareText = encodeURIComponent(`"${text}" — ${attribution}`);
    const shareUrl = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "https://thetouchlinedribble.in");

    return `
      <section class="not-prose my-10" style="border-radius:2rem;${s.bg};${s.border};padding:32px;box-shadow:0 20px 40px rgba(0,0,0,0.15)">
        ${context ? `<p style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.22em;${s.accent};margin:0 0 16px">${escapeHtml(context)}</p>` : ""}
        <div style="border-left:3px solid;${s.accent};padding-left:20px">
          <p style="font-size:22px;font-weight:900;line-height:1.4;${s.text};margin:0;font-family:'Outfit',sans-serif">
            \u201C${escapeHtml(text)}\u201D
          </p>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08)">
          <p style="font-size:13px;font-weight:700;${s.subtext};margin:0">— ${escapeHtml(attribution)}</p>
          <div style="display:flex;gap:8px">
            <a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:999px;background:rgba(37,211,102,0.15);${s.accent};font-size:11px;font-weight:700;text-decoration:none;border:1px solid rgba(37,211,102,0.3)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Share
            </a>
            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,0.05);${s.subtext};font-size:11px;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,0.1)">
              𝕏 Post
            </a>
          </div>
        </div>
      </section>
    `;
  }

  if (block.kind !== "comparison-table") {
    return "";
  }

  const header = block.data.columns
    .map(
      (column: string) => `
        <th class="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">
          ${escapeHtml(column)}
        </th>
      `,
    )
    .join("");

  const rows = block.data.rows
    .map(
      (row: string[]) => `
        <tr class="border-t border-gray-100 dark:border-white/10">
          ${row
            .map(
              (value: string, index: number) => `
                <td class="px-4 py-3 text-sm ${index === 0 ? "font-semibold text-[#0F172A] dark:text-white" : "text-[#475569] dark:text-gray-300"}">
                  ${escapeHtml(value)}
                </td>
              `,
            )
            .join("")}
        </tr>
      `,
    )
    .join("");

  return `
    <section class="not-prose my-10 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
      <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Comparison Table</p>
      <h3 class="mt-2 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">${escapeHtml(block.data.title)}</h3>
      <div class="mt-5 overflow-x-auto rounded-[1.25rem] border border-gray-100 dark:border-white/10">
        <table class="min-w-full border-collapse">
          <thead class="bg-[#F8FAFC] dark:bg-[#08111f]">
            <tr>${header}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}
