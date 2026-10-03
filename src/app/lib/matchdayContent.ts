import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import type { HomepageCuration } from "./siteSettingsStorage";

export function isExplainer(post: BlogPost): boolean {
  if (post.contentKind) return post.contentKind === "explainer";
  return [post.category, ...(post.tags || [])].some((value) =>
    /^(explainer|explainers|guide|knowledge)$/i.test(value || ""),
  );
}
export function isOpinion(post: BlogPost): boolean {
  return (
    post.contentKind === "opinion" ||
    (!post.contentKind &&
      (post.format === "weekly-verdict" ||
        post.category?.toLowerCase() === "opinion"))
  );
}
const timestamp = (value?: string) => {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? time : 0;
};
export function publishedPosts(
  posts: BlogPost[],
  now = Date.now(),
): BlogPost[] {
  const ids = new Set<string>(),
    titles = new Set<string>(),
    slugs = new Set<string>();
  return [...posts]
    .filter(
      (post) =>
        !post.isDraft &&
        (post as BlogPost & { status?: string }).status !== "draft" &&
        (!post.publishAt || timestamp(post.publishAt) <= now),
    )
    .sort(
      (a, b) =>
        timestamp(b.publishAt || b.date) - timestamp(a.publishAt || a.date),
    )
    .filter((post) => {
      const title = post.title.trim().toLowerCase();
      if (
        ids.has(post.id) ||
        (title && titles.has(title)) ||
        (post.slug && slugs.has(post.slug))
      )
        return false;
      ids.add(post.id);
      if (title) titles.add(title);
      if (post.slug) slugs.add(post.slug);
      return true;
    });
}
export function storyEdition(story: StoryFeature): string {
  const date = timestamp(story.publishedAt || story.date);
  return date
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    : "Monthly story";
}
export function selectMatchdayContent(
  posts: BlogPost[],
  stories: StoryFeature[],
  curation: Partial<HomepageCuration> = {},
  now = Date.now(),
) {
  const available = publishedPosts(posts, now);
  const hero =
    (curation.hero?.type === "post"
      ? available.find((p) => p.id === curation.hero?.id)
      : null) ||
    available.find((p) => p.mainStory && !isExplainer(p)) ||
    available.find(isOpinion) ||
    available[0] ||
    null;
  const used = new Set(hero ? [hero.id] : []);
  const take = (candidates: BlogPost[], count: number) =>
    candidates
      .filter((p) => {
        if (used.has(p.id)) return false;
        return true;
      })
      .slice(0, count)
      .map((p) => {
        used.add(p.id);
        return p;
      });
  const ordered = (candidates: BlogPost[], ids: string[] = []) => {
    const byId = new Map(candidates.map((p) => [p.id, p]));
    const unique = [...new Set(ids)]
      .map((id) => byId.get(id))
      .filter((p): p is BlogPost => !!p);
    return [...unique, ...candidates.filter((p) => !ids.includes(p.id))];
  };
  const verdicts = take(available.filter(isOpinion), 3);
  const explainers = take(
    ordered(available.filter(isExplainer), curation.explainerPostIds),
    3,
  );
  // Reserve only explicit archive selections; never fill this slot with arbitrary old posts.
  const archiveCandidates = ordered(
    available.filter(
      (p) => p.editorPick || curation.editorPickIds?.includes(p.id),
    ),
    curation.editorPickIds,
  )
    .filter(
      (p) =>
        !used.has(p.id) &&
        now - timestamp(p.publishAt || p.date) >= 7 * 86400000,
    )
    .slice(0, 2);
  const reserved = new Set(archiveCandidates.map((p) => p.id));
  const latest = take(
    ordered(
      available.filter((p) => !reserved.has(p.id)),
      curation.latestPostIds,
    ),
    4,
  );
  const archive = take(archiveCandidates, 2);
  const monthlyStory =
    [...stories]
      .filter((s) => !s.isDraft && timestamp(s.publishedAt || s.date) <= now)
      .sort(
        (a, b) =>
          timestamp(b.publishedAt || b.date) -
          timestamp(a.publishedAt || a.date),
      )[0] || null;
  return { hero, verdicts, explainers, monthlyStory, latest, archive };
}

export function selectRelatedReading(post: BlogPost, posts: BlogPost[]) {
  const available = publishedPosts(posts).filter((p) => p.id !== post.id);
  const relevant = available.filter(
    (p) =>
      (post.club && p.club === post.club) ||
      (p.tags || []).some((tag) => (post.tags || []).includes(tag)),
  );
  const curated = (post.relatedPostIds || [])
    .map((id) => available.find((p) => p.id === id))
    .filter((p): p is BlogPost => !!p);
  const background =
    available.find(
      (p) => p.id === post.editorial?.backgroundPostId && isExplainer(p),
    ) || [...curated, ...relevant].find(isExplainer);
  const referencingOpinions = available.filter(p => isOpinion(p) && p.editorial?.backgroundPostId === post.id);
  const perspective = [...curated, ...referencingOpinions, ...relevant].find(
    (p) => p.id !== background?.id && isOpinion(p),
  );
  return { background, perspective };
}
