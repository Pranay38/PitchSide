import { describe, expect, it } from "vitest";
import { createEmptyStoryFeature } from "../src/app/data/stories";
import { filterPublishedStories, normalizeStoryFeature, sortStories } from "../src/app/lib/storyStorage";

describe("story publishing", () => {
  it("keeps drafts out of public story collections", () => {
    const draft = { ...createEmptyStoryFeature(), id: "draft", isDraft: true };
    const published = { ...createEmptyStoryFeature(), id: "published", isDraft: false };

    expect(filterPublishedStories([draft, published]).map((story) => story.id)).toEqual(["published"]);
  });

  it("orders stories by first publication time before later edits", () => {
    const older = normalizeStoryFeature({
      ...createEmptyStoryFeature(),
      id: "older",
      isDraft: false,
      publishedAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
    });
    const newer = normalizeStoryFeature({
      ...createEmptyStoryFeature(),
      id: "newer",
      isDraft: false,
      publishedAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(sortStories([older, newer]).map((story) => story.id)).toEqual(["newer", "older"]);
  });

  it("preserves publication timestamps during normalization", () => {
    const publishedAt = "2026-09-27T10:00:00.000Z";
    const story = normalizeStoryFeature({ ...createEmptyStoryFeature(), publishedAt, isDraft: false });

    expect(story.publishedAt).toBe(publishedAt);
  });
});
