import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import type { TransferReliabilityEntry } from "./transferReliability";
import { buildTransferDossierSlug, getTransferTierLabel } from "./transferWatch";
import {
  buildTransferSourceSnapshot,
  formatTransferSourceDate,
  getTransferSourceStanceLabel,
  type TransferSourceArticle,
} from "./transferSources";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesTransferEntrySlug(entry: Pick<TransferReliabilityEntry, "player" | "club">, slug: string): boolean {
  return buildTransferDossierSlug(entry) === slug;
}

export function buildTransferSummary(entry: TransferReliabilityEntry): string {
  if (entry.status === "confirmed") {
    return `${entry.player} to ${entry.club} is logged as a confirmed move, with the current board score reflecting the strongest signal tier in the system.`;
  }

  return `${entry.player} to ${entry.club} is currently tracked as a ${getTransferTierLabel(entry.tier, entry.status).toLowerCase()} rumor with a ${entry.reliabilityLabel.toLowerCase()} board read.`;
}

export function buildTransferTimeline(entry: TransferReliabilityEntry): Array<{ label: string; title: string; note: string }> {
  const updatedLabel = new Date(entry.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const timeline = [
    {
      label: "Signal strength",
      title: `${entry.reliabilityScore}/99 board score`,
      note: entry.rationale[0] || "Current signal strength is based on the status and freshness of the item.",
    },
    {
      label: "Market context",
      title: entry.feeMode !== "not-disclosed" ? `${entry.club} linked at ${formatFee(entry)}` : "No fee disclosed yet",
      note: entry.rationale[1] || "Fee disclosure changes how much weight the board gives the link.",
    },
    {
      label: updatedLabel,
      title: "Last material update",
      note: entry.rationale[2] || "This dossier needs a fresh update if the trail moves again.",
    },
  ];

  if (entry.punchyLine) {
    timeline.push({
      label: "Editor's Take",
      title: "TTD Take",
      note: entry.punchyLine
    });
  }

  return timeline;
}

function formatFee(entry: TransferReliabilityEntry) {
    if (entry.feeMode === "million-eur") return `€${entry.feeMillions}m`;
    if (entry.feeMode === "million-gbp") return `£${entry.feeMillions}m`;
    if (entry.feeMode === "million-usd") return `$${entry.feeMillions}m`;
    return "Undisclosed";
}

export function getRelatedTransferPosts(posts: BlogPost[], entry: TransferReliabilityEntry): BlogPost[] {
  const playerNeedle = normalize(entry.player);
  const clubNeedle = normalize(entry.club);

  return posts
    .filter((post) => {
      const haystack = [post.title, post.excerpt, post.club, post.playerName || "", ...post.tags].map(normalize);
      return haystack.some((value) => value.includes(playerNeedle) || value.includes(clubNeedle));
    })
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 4);
}

export function getRelatedTransferStories(stories: StoryFeature[], entry: TransferReliabilityEntry): StoryFeature[] {
  const playerNeedle = normalize(entry.player);
  const clubNeedle = normalize(entry.club);

  return stories
    .filter((story) => {
      const haystack = [story.title, story.subtitle, story.excerpt, story.eyebrow, ...story.highlights].map(normalize);
      return haystack.some((value) => value.includes(playerNeedle) || value.includes(clubNeedle));
    })
    .slice(0, 2);
}

export function getAdjacentTransferEntries(
  entries: TransferReliabilityEntry[],
  current: TransferReliabilityEntry,
): TransferReliabilityEntry[] {
  return entries
    .filter((entry) => entry.id !== current.id && entry.club === current.club)
    .slice(0, 3);
}

export function buildTransferCoverageSummary(sources: TransferSourceArticle[]): string {
  const snapshot = buildTransferSourceSnapshot(sources);

  if (snapshot.coverageCount === 0) {
    return "No external source links have been attached to this dossier yet. The board is currently running on the internal scouting and editorial read only.";
  }

  return [
    `${snapshot.coverageCount} external ${snapshot.coverageCount === 1 ? "source is" : "sources are"} attached to this dossier.`,
    `${snapshot.confirmingCount} ${snapshot.confirmingCount === 1 ? "link leans" : "links lean"} positive, while ${snapshot.contradictingCount} ${snapshot.contradictingCount === 1 ? "source pushes back" : "sources push back"}.`,
    snapshot.primarySource ? `${snapshot.primarySource} is currently pinned as the lead signal.` : "",
  ].filter(Boolean).join(" ");
}

export function buildTransferSourceTimeline(sources: TransferSourceArticle[]): Array<{
  label: string;
  title: string;
  note: string;
  url: string;
  sourceLabel: string;
  paywalled?: boolean;
}> {
  return [...sources]
    .sort((left, right) => {
      const rightTime = new Date(right.publishedAt || right.discoveredAt).getTime();
      const leftTime = new Date(left.publishedAt || left.discoveredAt).getTime();
      return rightTime - leftTime;
    })
    .map((source) => ({
      label: `${source.sourceLabel} · ${getTransferSourceStanceLabel(source.stance)}`,
      title: source.title,
      note: source.claimSummary || `Coverage logged from ${source.sourceLabel}.`,
      url: source.url,
      sourceLabel: formatTransferSourceDate(source.publishedAt || source.discoveredAt),
      paywalled: source.paywalled,
    }));
}
