import { describe, it, expect } from "vitest";
import { BlogPostSchema } from "../src/app/lib/schemas";
import { selectRelatedReading } from "../src/app/lib/matchdayContent";
import { articleShareUrl } from "../src/app/lib/shareLinks";
import {
  buildArchiveEntries,
  filterArchiveEntries,
} from "../src/app/lib/contentIndex";
import type { BlogPost } from "../src/app/data/posts";
const post = (id: string, overrides: Partial<BlogPost> = {}): BlogPost => ({
  id,
  title: id,
  content: "",
  excerpt: "",
  coverImage: "",
  club: "Arsenal",
  tags: ["Tactics"],
  date: "2026-09-01",
  readTime: "3 min",
  ...overrides,
});
describe("editorial growth contracts", () => {
  it("preserves legacy posts and lets an editor clear classification", () => {
    expect(BlogPostSchema.parse(post("legacy")).contentKind).toBeUndefined();
    expect(
      BlogPostSchema.parse(post("cleared", { contentKind: null })).contentKind,
    ).toBeNull();
  });
  it("round-trips editorial fields and rejects unsafe source links", () => {
    const editorial = {
      verdict: "Our view",
      evidence: [
        { text: "Observed movement", sourceUrl: "https://example.com/source" },
      ],
      counterargument: "Alternative",
      backgroundPostId: "guide",
      shareQuote: "A clear argument",
    };
    expect(
      BlogPostSchema.parse(post("new", { contentKind: "opinion", editorial }))
        .editorial,
    ).toEqual(editorial);
    expect(
      BlogPostSchema.safeParse(
        post("bad", {
          editorial: {
            evidence: [{ text: "x", sourceUrl: "javascript:alert(1)" }],
          },
        }),
      ).success,
    ).toBe(false);
  });
  it("selects a published explainer and different opinion, respecting curated links", () => {
    const current = post("current", {
      editorial: { backgroundPostId: "draft" },
      relatedPostIds: ["opinion", "guide"],
    });
    const result = selectRelatedReading(current, [
      current,
      post("draft", { contentKind: "explainer", isDraft: true }),
      post("future", { contentKind: "explainer", publishAt: "2099-01-01" }),
      post("guide", { contentKind: "explainer" }),
      post("opinion", { contentKind: "opinion" }),
    ]);
    expect(result.background?.id).toBe("guide");
    expect(result.perspective?.id).toBe("opinion");
  });
  it("opinion archive links do not return unrelated articles or stories", () => {
    const entries = buildArchiveEntries(
      [
        post("opinion", { contentKind: "opinion" }),
        post("guide", { contentKind: "explainer" }),
        post("legacy"),
      ],
      [],
    );
    expect(
      filterArchiveEntries(entries, { kind: "opinion" }).map((p) => p.id),
    ).toEqual(["opinion"]);
  });
  it("share attribution points to the canonical article", () => {
    const url = new URL(
      articleShareUrl({ id: "123", slug: "my-argument" }, "x", "evidence_post"),
    );
    expect(url.pathname).toBe("/post/my-argument");
    expect(url.searchParams.get("utm_source")).toBe("x");
    expect(url.searchParams.get("utm_campaign")).toBe("my-argument");
    expect(url.searchParams.get("utm_content")).toBe("evidence_post");
  });
});
