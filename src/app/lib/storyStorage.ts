import {
  storyFeatures as defaultStories,
  createEmptyStoryBar,
  createEmptyStoryChapter,
  createEmptyStoryFeature,
  createEmptyStoryImage,
  createEmptyStoryMetric,
  slugifyStoryValue,
  type StoryBar,
  type StoryChapter,
  type StoryChapterImage,
  type StoryFeature,
  type StoryMetric,
} from "../data/stories";

const STORIES_KEY = "pitchside_stories";
const STORY_PREVIEW_KEY = "pitchside_story_preview";
const ADMIN_KEY = "pitchside_admin_auth";
const API_BASE = "/api";

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_KEY);
  } catch {
    return null;
  }
}

async function isApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stories`, { method: "OPTIONS" });
    return res.ok;
  } catch {
    return false;
  }
}

async function getApiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { error?: unknown; message?: unknown };
    if (typeof data.error === "string" && data.error.trim()) return data.error;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
  } catch {
    // Ignore JSON parse issues and use fallback message.
  }
  return fallback;
}

function getSortableTime(story: StoryFeature): number {
  const updatedAt = new Date(story.updatedAt).getTime();
  if (Number.isFinite(updatedAt)) return updatedAt;

  const publishedDate = new Date(story.date).getTime();
  if (Number.isFinite(publishedDate)) return publishedDate;

  return 0;
}

function sortStories(stories: StoryFeature[]): StoryFeature[] {
  return [...stories].sort((left, right) => {
    if (left.isDraft !== right.isDraft) return Number(left.isDraft) - Number(right.isDraft);

    const leftTime = getSortableTime(left);
    const rightTime = getSortableTime(right);
    if (leftTime !== rightTime) return rightTime - leftTime;

    return left.title.localeCompare(right.title);
  });
}

function normalizeMetric(input?: Partial<StoryMetric> | null): StoryMetric {
  return {
    label: String(input?.label || createEmptyStoryMetric().label).trim() || "Metric",
    value: String(input?.value || createEmptyStoryMetric().value).trim() || "0",
    hint: String(input?.hint || "").trim(),
  };
}

function normalizeBar(input?: Partial<StoryBar> | null): StoryBar {
  const parsedValue = typeof input?.value === "number" ? input.value : Number(input?.value);
  return {
    label: String(input?.label || createEmptyStoryBar().label).trim() || "Signal",
    value: Number.isFinite(parsedValue) ? Math.max(0, Math.min(100, Math.round(parsedValue))) : 50,
  };
}

function normalizeChapterImage(input?: Partial<StoryChapterImage> | null): StoryChapterImage {
  const fallback = createEmptyStoryImage();
  return {
    src: String(input?.src || fallback.src).trim(),
    alt: String(input?.alt || fallback.alt).trim(),
    caption: String(input?.caption || "").trim(),
  };
}

function normalizeChapter(input?: Partial<StoryChapter> | null): StoryChapter {
  const fallback = createEmptyStoryChapter();
  const body = Array.isArray(input?.body)
    ? input.body.map((paragraph) => String(paragraph || "").trim()).filter(Boolean)
    : fallback.body;
  const metrics = Array.isArray(input?.metrics)
    ? input.metrics.map((metric) => normalizeMetric(metric)).filter((metric) => metric.label || metric.value)
    : fallback.metrics;
  const bars = Array.isArray(input?.visual?.bars)
    ? input.visual.bars.map((bar) => normalizeBar(bar)).filter((bar) => bar.label)
    : fallback.visual.bars;

  return {
    id: String(input?.id || fallback.id),
    kicker: String(input?.kicker || fallback.kicker).trim() || fallback.kicker,
    title: String(input?.title || fallback.title).trim() || fallback.title,
    body: body.length > 0 ? body : fallback.body,
    takeaway: String(input?.takeaway || fallback.takeaway).trim() || fallback.takeaway,
    pullQuote: String(input?.pullQuote || "").trim(),
    image: normalizeChapterImage(input?.image),
    metrics: metrics.length > 0 ? metrics : fallback.metrics,
    visual: {
      eyebrow: String(input?.visual?.eyebrow || fallback.visual.eyebrow).trim() || fallback.visual.eyebrow,
      headline: String(input?.visual?.headline || fallback.visual.headline).trim() || fallback.visual.headline,
      subheadline: String(input?.visual?.subheadline || fallback.visual.subheadline).trim() || fallback.visual.subheadline,
      primaryValue: String(input?.visual?.primaryValue || fallback.visual.primaryValue).trim() || fallback.visual.primaryValue,
      primaryLabel: String(input?.visual?.primaryLabel || fallback.visual.primaryLabel).trim() || fallback.visual.primaryLabel,
      bars: bars.length > 0 ? bars : fallback.visual.bars,
    },
  };
}

export function normalizeStoryFeature(input?: Partial<StoryFeature> | null): StoryFeature {
  const fallback = createEmptyStoryFeature();
  const title = String(input?.title || fallback.title).trim() || fallback.title;
  const slug = slugifyStoryValue(String(input?.slug || title || fallback.slug));
  const highlights = Array.isArray(input?.highlights)
    ? input.highlights.map((item) => String(item || "").trim()).filter(Boolean)
    : fallback.highlights;
  const chapters = Array.isArray(input?.chapters)
    ? input.chapters.map((chapter) => normalizeChapter(chapter)).filter((chapter) => chapter.title)
    : fallback.chapters;
  const updatedAt = String(input?.updatedAt || fallback.updatedAt || new Date().toISOString()).trim();

  return {
    id: String(input?.id || fallback.id),
    slug: slug || fallback.slug,
    eyebrow: String(input?.eyebrow || fallback.eyebrow).trim() || fallback.eyebrow,
    title,
    subtitle: String(input?.subtitle || fallback.subtitle).trim() || fallback.subtitle,
    excerpt: String(input?.excerpt || fallback.excerpt).trim() || fallback.excerpt,
    readTime: String(input?.readTime || fallback.readTime).trim() || fallback.readTime,
    date: String(input?.date || fallback.date).trim() || fallback.date,
    coverImage: String(input?.coverImage || fallback.coverImage).trim() || fallback.coverImage,
    themeFrom: String(input?.themeFrom || fallback.themeFrom).trim() || fallback.themeFrom,
    themeTo: String(input?.themeTo || fallback.themeTo).trim() || fallback.themeTo,
    isDraft: Boolean(input?.isDraft ?? fallback.isDraft),
    updatedAt,
    highlights: highlights.length > 0 ? highlights : fallback.highlights,
    chapters: chapters.length > 0 ? chapters : fallback.chapters,
  };
}

function normalizeStories(input?: Array<Partial<StoryFeature>> | null): StoryFeature[] {
  if (!Array.isArray(input)) return sortStories(defaultStories.map((story) => normalizeStoryFeature(story)));

  const deduped = new Map<string, StoryFeature>();
  for (const item of input) {
    const normalized = normalizeStoryFeature(item);
    deduped.set(normalized.id, normalized);
  }

  return sortStories(Array.from(deduped.values()));
}

function saveStoriesLocal(stories: StoryFeature[]): void {
  try {
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  } catch {
    // ignore
  }
}

function getAllStoriesLocal(): StoryFeature[] {
  try {
    const stored = localStorage.getItem(STORIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Array<Partial<StoryFeature>>;
      if (Array.isArray(parsed) && parsed.length > 0) return normalizeStories(parsed);
    }
  } catch {
    // ignore
  }

  const defaults = normalizeStories(defaultStories);
  saveStoriesLocal(defaults);
  return defaults;
}

function filterPublishedStories(stories: StoryFeature[]): StoryFeature[] {
  return stories.filter((story) => !story.isDraft);
}

function buildStoriesUrl(includeDrafts: boolean, slug?: string): string {
  const params = new URLSearchParams();
  if (slug) params.set("slug", slug);
  if (includeDrafts) params.set("includeDrafts", "1");
  const query = params.toString();
  return query ? `${API_BASE}/stories?${query}` : `${API_BASE}/stories`;
}

function buildAuthHeaders(includeDrafts: boolean): HeadersInit | undefined {
  if (!includeDrafts) return undefined;
  const token = getAuthToken();
  if (!token) return undefined;
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getAllStories(includeDrafts = false): StoryFeature[] {
  const stories = getAllStoriesLocal();
  return includeDrafts ? stories : filterPublishedStories(stories);
}

export async function getAllStoriesAsync(includeDrafts = false): Promise<StoryFeature[]> {
  try {
    const res = await fetch(buildStoriesUrl(includeDrafts), {
      headers: buildAuthHeaders(includeDrafts),
    });
    if (res.ok) {
      const stories = normalizeStories(await res.json());
      const localStories = getAllStoriesLocal();
      const merged = sortStories([
        ...stories,
        ...localStories.filter((story) => !stories.some((remoteStory) => remoteStory.id === story.id)),
      ]);
      saveStoriesLocal(merged);
      return includeDrafts ? merged : filterPublishedStories(merged);
    }
  } catch {
    // API unavailable; fall back to local storage.
  }

  return getAllStories(includeDrafts);
}

export function getStoryBySlug(slug: string, includeDrafts = false): StoryFeature | undefined {
  const stories = getAllStories(includeDrafts);
  return stories.find((story) => story.slug === slug);
}

export async function getStoryBySlugAsync(slug: string, includeDrafts = false): Promise<StoryFeature | undefined> {
  try {
    const res = await fetch(buildStoriesUrl(includeDrafts, slug), {
      headers: buildAuthHeaders(includeDrafts),
    });
    if (res.ok) {
      const story = normalizeStoryFeature(await res.json());
      const stories = getAllStoriesLocal();
      const nextStories = sortStories([
        story,
        ...stories.filter((item) => item.id !== story.id),
      ]);
      saveStoriesLocal(nextStories);
      return includeDrafts || !story.isDraft ? story : undefined;
    }
  } catch {
    // API unavailable; fall back to local storage.
  }

  return getStoryBySlug(slug, includeDrafts);
}

export function saveStoryPreview(story: StoryFeature): void {
  try {
    localStorage.setItem(STORY_PREVIEW_KEY, JSON.stringify(normalizeStoryFeature(story)));
  } catch {
    // ignore
  }
}

export function getStoryPreview(previewId?: string, slug?: string): StoryFeature | undefined {
  try {
    const stored = localStorage.getItem(STORY_PREVIEW_KEY);
    if (!stored) return undefined;
    const story = normalizeStoryFeature(JSON.parse(stored) as Partial<StoryFeature>);
    if (previewId && story.id !== previewId) return undefined;
    if (slug && story.slug !== slug) return undefined;
    return story;
  } catch {
    return undefined;
  }
}

function addStoryLocal(story: StoryFeature): StoryFeature[] {
  const stories = getAllStoriesLocal();
  const normalized = normalizeStoryFeature(story);
  const updated = sortStories([normalized, ...stories.filter((item) => item.id !== normalized.id)]);
  saveStoriesLocal(updated);
  return updated;
}

export async function addStoryAsync(story: StoryFeature): Promise<StoryFeature[]> {
  const normalized = normalizeStoryFeature(story);

  if (!(await isApiAvailable())) {
    return addStoryLocal(normalized);
  }

  const res = await fetch(`${API_BASE}/stories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(normalized),
  });

  if (!res.ok) {
    throw new Error(await getApiErrorMessage(res, "Failed to create story"));
  }

  return getAllStoriesAsync(true);
}

function updateStoryLocal(story: StoryFeature): StoryFeature[] {
  const normalized = normalizeStoryFeature(story);
  const stories = getAllStoriesLocal();
  const updated = sortStories([
    normalized,
    ...stories.filter((item) => item.id !== normalized.id),
  ]);
  saveStoriesLocal(updated);
  return updated;
}

export async function updateStoryAsync(story: StoryFeature): Promise<StoryFeature[]> {
  const normalized = normalizeStoryFeature(story);

  if (!(await isApiAvailable())) {
    return updateStoryLocal(normalized);
  }

  const res = await fetch(`${API_BASE}/stories`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(normalized),
  });

  if (!res.ok) {
    throw new Error(await getApiErrorMessage(res, "Failed to update story"));
  }

  return getAllStoriesAsync(true);
}

function deleteStoryLocal(id: string): StoryFeature[] {
  const stories = getAllStoriesLocal();
  const updated = stories.filter((story) => story.id !== id);
  saveStoriesLocal(updated);
  return updated;
}

export async function deleteStoryAsync(id: string): Promise<StoryFeature[]> {
  if (!(await isApiAvailable())) {
    return deleteStoryLocal(id);
  }

  const res = await fetch(`${API_BASE}/stories?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  });

  if (!res.ok) {
    throw new Error(await getApiErrorMessage(res, "Failed to delete story"));
  }

  return getAllStoriesAsync(true);
}
