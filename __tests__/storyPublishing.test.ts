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

it("preserves legacy supplementary data and audio without adding panels to new stories", async () => {
  const { storyFeatures, storyTemplates, createStoryFromTemplate } = await import("../src/app/data/stories");
  const legacy = { ...storyFeatures[0], audioUrl: "https://example.com/story.mp3", reactions: { fire: 3, mindblown: 0, thumbsdown: 0, target: 0, cold: 0 } };
  const normalized = normalizeStoryFeature(legacy);
  expect(normalized.chapters[0].visual).toEqual(legacy.chapters[0].visual);
  expect(normalized.chapters[0].metrics).toEqual(legacy.chapters[0].metrics);
  expect(normalized.chapters[0].takeaway).toBe(legacy.chapters[0].takeaway);
  expect(normalized.highlights).toEqual(legacy.highlights);
  expect(normalized.audioUrl).toBe(legacy.audioUrl);
  expect(normalized.reactions).toEqual(legacy.reactions);
  for (const story of [createEmptyStoryFeature(), ...storyTemplates.map(template => createStoryFromTemplate(template.id))]) {
    const next = normalizeStoryFeature(story);
    expect(next.highlights).toBeUndefined();
    for (const chapter of next.chapters) {
      expect(chapter.visual).toBeUndefined();
      expect(chapter.metrics).toBeUndefined();
      expect(chapter.takeaway).toBeUndefined();
    }
  }
});
