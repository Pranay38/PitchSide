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
    const title = escapeHtml(block.data.title || "Tactical board");
    const description = escapeHtml(block.data.description || "Embedded tactical sequence from the Touchline Dribble board.");
    const id = escapeHtml(block.data.id || "");

    return `
      <section class="not-prose my-10 rounded-[2rem] border border-gray-200 bg-[linear-gradient(180deg,#0f172a,#111f35)] p-6 text-white shadow-xl shadow-[#0F172A]/10 dark:border-gray-800">
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Tactical Board</p>
        <h3 class="mt-2 text-2xl font-black font-outfit text-white">${title}</h3>
        <p class="mt-3 text-sm leading-6 text-white/72">${description}</p>
        <div
          class="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#08111f]"
          data-tactical-board-embed="${id}"
          data-title="${title}"
          data-description="${description}"
        >
          <div class="flex min-h-[320px] items-center justify-center px-6 py-10 text-center text-sm text-white/62">
            Tactical sequence preview will load here.
          </div>
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

  const header = block.data.columns
    .map(
      (column) => `
        <th class="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">
          ${escapeHtml(column)}
        </th>
      `,
    )
    .join("");

  const rows = block.data.rows
    .map(
      (row) => `
        <tr class="border-t border-gray-100 dark:border-white/10">
          ${row
            .map(
              (value, index) => `
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
