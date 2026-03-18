import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";

export const KNOWN_LEAGUES = [
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "Conference League",
] as const;

export type ArchiveEntryType = "article" | "story";

export interface ArchiveEntry {
  id: string;
  type: ArchiveEntryType;
  href: string;
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  timestamp: number;
  readTime: string;
  club: string;
  player: string;
  league: string;
  format: string;
  topics: string[];
}

function parseTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function includesMatch(values: string[], needle: string): boolean {
  if (!needle) return true;
  const normalizedNeedle = normalize(needle);
  return values.some((value) => normalize(value).includes(normalizedNeedle));
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(value);
  }

  return ordered;
}

export function inferLeague(values: string[]): string {
  const haystack = values.join(" ").toLowerCase();
  return KNOWN_LEAGUES.find((league) => haystack.includes(league.toLowerCase())) || "";
}

export function inferPostFormat(post: BlogPost): string {
  if (post.mustRead) return "Must Read";
  if (post.thisWeek) return "Weekly Briefing";
  return "Analysis";
}

export function inferStoryFormat(): string {
  return "Scrollytelling";
}

export function buildArchiveEntries(posts: BlogPost[], stories: StoryFeature[]): ArchiveEntry[] {
  const postEntries = posts.map((post) => ({
    id: post.id,
    type: "article" as const,
    href: `/post/${post.id}`,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    date: post.date,
    timestamp: parseTimestamp(post.date),
    readTime: post.readTime,
    club: post.club,
    player: post.playerName || "",
    league: inferLeague([post.title, post.excerpt, post.club, ...post.tags]),
    format: inferPostFormat(post),
    topics: unique([post.club, ...post.tags]),
  }));

  const storyEntries = stories.map((story) => ({
    id: story.id,
    type: "story" as const,
    href: `/stories/${story.slug}`,
    title: story.title,
    excerpt: story.excerpt,
    coverImage: story.coverImage,
    date: story.date,
    timestamp: parseTimestamp(story.updatedAt || story.date),
    readTime: story.readTime,
    club: "",
    player: "",
    league: inferLeague([story.title, story.subtitle, story.excerpt, ...story.highlights]),
    format: inferStoryFormat(),
    topics: unique([story.eyebrow, ...story.highlights]),
  }));

  return [...postEntries, ...storyEntries].sort((left, right) => right.timestamp - left.timestamp);
}

export function searchArchiveEntry(entry: ArchiveEntry, query: string): boolean {
  if (!query.trim()) return true;
  return includesMatch(
    [
      entry.title,
      entry.excerpt,
      entry.club,
      entry.player,
      entry.league,
      entry.format,
      ...entry.topics,
    ],
    query,
  );
}

export function filterArchiveEntries(
  entries: ArchiveEntry[],
  filters: {
    query?: string;
    type?: string;
    club?: string;
    league?: string;
    topic?: string;
    format?: string;
    sort?: string;
  },
): ArchiveEntry[] {
  const filtered = entries.filter((entry) => {
    if (filters.type && filters.type !== "all" && entry.type !== filters.type) return false;
    if (filters.club && filters.club !== "all" && normalize(entry.club) !== normalize(filters.club)) return false;
    if (filters.league && filters.league !== "all" && normalize(entry.league) !== normalize(filters.league)) return false;
    if (filters.format && filters.format !== "all" && normalize(entry.format) !== normalize(filters.format)) return false;
    if (filters.topic && filters.topic !== "all" && !entry.topics.some((topic) => normalize(topic) === normalize(filters.topic))) return false;
    if (!searchArchiveEntry(entry, filters.query || "")) return false;
    return true;
  });

  const sort = filters.sort || "newest";
  if (sort === "oldest") {
    return [...filtered].sort((left, right) => left.timestamp - right.timestamp);
  }
  if (sort === "a-z") {
    return [...filtered].sort((left, right) => left.title.localeCompare(right.title));
  }

  return filtered;
}
