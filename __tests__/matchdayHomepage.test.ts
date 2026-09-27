import { describe, it, expect } from "vitest";
import {
  selectMatchdayContent,
  storyEdition,
  isExplainer,
} from "../src/app/lib/matchdayContent";
import type { BlogPost } from "../src/app/data/posts";
import type { StoryFeature } from "../src/app/data/stories";
const post = (id: string, extra: Partial<BlogPost> = {}): BlogPost => ({
  id,
  title: id,
  content: "",
  excerpt: "",
  coverImage: "",
  club: "",
  tags: [],
  date: "2026-09-01",
  readTime: "4 min",
  ...extra,
});
const story = (id: string, publishedAt: string): StoryFeature =>
  ({ id, publishedAt, date: publishedAt, isDraft: false }) as StoryFeature;
const now = Date.parse("2026-09-27T12:00:00Z");
describe("matchday homepage selection", () => {
  it("never repeats a post, including duplicate titles, curation IDs and slugs", () => {
    const posts = [
      post("lead", { mainStory: true }),
      post("v", { format: "weekly-verdict" }),
      post("e", { contentKind: "explainer" }),
      post("copy", { title: " E " }),
      post("a"),
      post("b"),
      post("c"),
      post("d"),
      post("old", { editorPick: true }),
      post("slug1", { slug: "same" }),
      post("slug2", { slug: "same" }),
    ];
    const result = selectMatchdayContent(
      posts,
      [],
      {
        latestPostIds: ["a", "a", "slug1", "slug2"],
        editorPickIds: ["lead", "old"],
      },
      now,
    );
    const shown = [
      result.hero!,
      ...result.verdicts,
      ...result.explainers,
      ...result.latest,
      ...result.archive,
    ];
    expect(new Set(shown.map((p) => p.id)).size).toBe(shown.length);
    expect(new Set(shown.map((p) => p.title.trim().toLowerCase())).size).toBe(
      shown.length,
    );
    expect(shown.filter((p) => p.slug === "same")).toHaveLength(1);
    expect(result.archive.map((p) => p.id)).toContain("old");
  });
  it("excludes drafts and scheduled content even when curated", () => {
    const result = selectMatchdayContent(
      [
        post("draft", { isDraft: true }),
        post("future", { publishAt: "2026-10-01" }),
        post("live"),
      ],
      [
        { ...story("draft-story", "2026-09-01"), isDraft: true },
        story("future-story", "2026-10-01"),
      ],
      { hero: { type: "post", id: "draft" } },
      now,
    );
    expect(result.hero?.id).toBe("live");
    expect(result.monthlyStory).toBeNull();
  });
  it("keeps only the latest published story, even across months or old story curation", () => {
    const result = selectMatchdayContent(
      [],
      [story("old", "2026-07-01"), story("new", "2026-08-01")],
      { featuredStoryIds: ["old"] },
      now,
    );
    expect(result.monthlyStory?.id).toBe("new");
    expect(storyEdition(result.monthlyStory!)).toBe("August 2026");
  });
  it("does not fill empty sections with unrelated posts", () => {
    const result = selectMatchdayContent([post("only")], [], {}, now);
    expect(result.hero?.id).toBe("only");
    expect(result.verdicts).toEqual([]);
    expect(result.explainers).toEqual([]);
    expect(result.archive).toEqual([]);
  });
  it("does not treat every tactical opinion as an explainer", () => {
    expect(
      isExplainer(post("opinion", { category: "Tactical Analysis" })),
    ).toBe(false);
    expect(isExplainer(post("legacy", { tags: ["Explainer"] }))).toBe(true);
    expect(
      isExplainer(
        post("override", { contentKind: "opinion", tags: ["Explainer"] }),
      ),
    ).toBe(false);
  });
  it("handles unknown story dates without inventing an edition", () => {
    expect(storyEdition(story("unknown", "invalid"))).toBe("Monthly story");
  });
});
