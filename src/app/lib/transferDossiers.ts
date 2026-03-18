import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import type { TransferReliabilityEntry } from "./transferReliability";
import { buildTransferDossierSlug, getTransferTierLabel } from "./transferWatch";

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

  return [
    {
      label: "Case file",
      title: entry.status === "confirmed" ? "Move entered as confirmed" : `${getTransferTierLabel(entry.tier, entry.status)} rumor entered`,
      note: `${entry.boardLabel} for ${entry.player} and ${entry.club}.`,
    },
    {
      label: "Signal strength",
      title: `${entry.reliabilityScore}/99 board score`,
      note: entry.rationale[0] || "Current signal strength is based on the admin status and freshness of the item.",
    },
    {
      label: "Market context",
      title: entry.feeMode === "million-usd" ? `${entry.club} linked at ${entry.feeMillions}m USD` : "No fee disclosed yet",
      note: entry.rationale[1] || "Fee disclosure changes how much weight the board gives the link.",
    },
    {
      label: updatedLabel,
      title: "Last material update",
      note: entry.rationale[2] || "This dossier needs a fresh update if the trail moves again.",
    },
  ];
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
