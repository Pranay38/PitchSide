import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { StoryPage } from "../src/app/pages/StoryPage";
import { StoriesPage } from "../src/app/pages/StoriesPage";
import { storyFeatures } from "../src/app/data/stories";

const state = vi.hoisted(() => ({ story: undefined as any, preview: false }));
vi.stubGlobal("React", React);
vi.mock("@/lib/router-compat", () => ({
  useParams: () => ({ slug: state.story?.slug }),
  useSearchParams: () => [new URLSearchParams(state.preview ? "preview=1" : "")],
  Link: ({ to, children, ...props }: any) => React.createElement("a", { href: to, ...props }, children),
}));
vi.mock("../src/app/lib/storyStorage", async importOriginal => ({
  ...await importOriginal<any>(),
  getStoryBySlug: () => state.story,
  getStoryPreview: () => state.preview ? state.story : undefined,
  getAllStories: () => state.story ? [state.story] : [],
}));
vi.mock("next/image", () => ({ default: ({ fill, priority, sizes, quality, ...props }: any) => React.createElement("img", { ...props, style: fill ? { position: "absolute", height: "100%", width: "100%", inset: 0 } : undefined }) }));
vi.mock("../src/app/components/Header", () => ({ Header: () => null }));
vi.mock("../src/app/components/Footer", () => ({ Footer: () => null }));
vi.mock("../src/app/components/CommentSection", () => ({ CommentSection: () => React.createElement("div", null, "Comments") }));
vi.mock("../src/app/components/ReactionUI", () => ({ ReactionUI: () => React.createElement("div", null, "Reactions") }));
vi.mock("../src/app/components/TouchlineAudioPlayer", () => ({ TouchlineAudioPlayer: ({ audioUrl }: any) => React.createElement("audio", { src: audioUrl, controls: true }) }));

beforeEach(() => { state.story = structuredClone(storyFeatures[0]); state.preview = false; });
afterAll(() => vi.unstubAllGlobals());
function artifact(name: string, html: string) {
  if (!process.env.STORY_RENDER_DIR) return;
  mkdirSync(process.env.STORY_RENDER_DIR, { recursive: true });
  for (const theme of ["light", "dark"]) writeFileSync(`${process.env.STORY_RENDER_DIR}/${name}-${theme}.html`, `<!doctype html><html lang="en" class="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body>${html}</body></html>`);
}

describe("editorial story rendering", () => {
  it("renders server-provided chapters without a browser cache or API request", () => {
    const publishedStory = structuredClone(state.story);
    state.story = undefined;
    const html = renderToStaticMarkup(React.createElement<{ initialStory?: typeof publishedStory }>(StoryPage, { initialStory: publishedStory }));
    expect(html).toContain(publishedStory.title);
    expect(html).toContain(publishedStory.chapters[0].body[0]);
    expect(html).not.toContain("Story not found");
  });
  it("renders prose and authored quotes without legacy panels", () => {
    state.story.audioUrl = "https://example.com/story.mp3";
    const html = renderToStaticMarkup(React.createElement(StoryPage));
    expect(html).toContain(state.story.chapters[0].body[0]);
    expect(html).toContain(state.story.chapters[0].pullQuote);
    expect(html).toContain("https://example.com/story.mp3");
    expect(html).toContain("Comments");
    expect(html).toContain("Reactions");
    for (const chapter of state.story.chapters) {
      expect(html).not.toContain(chapter.takeaway);
      expect(html).not.toContain(chapter.visual.primaryLabel);
      for (const metric of chapter.metrics) expect(html).not.toContain(metric.hint);
    }
    expect(html).not.toContain("What this chapter means");
    artifact("story", html);
  });
  it("supports preview and missing optional fields, sanitizing rich text", () => {
    state.preview = true;
    state.story.chapters = [{ id: "one", title: "A long chapter", kicker: "", body: ['<p>Rich <strong>text</strong></p><script>alert(1)</script><blockquote>An authored quote</blockquote>'] }];
    state.story.coverImage = "";
    const html = renderToStaticMarkup(React.createElement(StoryPage));
    expect(html).toContain("Preview");
    expect(html).toContain("<strong>text</strong>");
    expect(html).toContain("An authored quote");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("undefined");
    artifact("minimal", html);
  });
  it("renders the listing without highlight chips or aggregate counts", () => {
    const html = renderToStaticMarkup(React.createElement(StoriesPage));
    expect(html).toContain("Search stories");
    expect(html).toContain("Newest first");
    expect(html).not.toContain("Signals");
    for (const highlight of state.story.highlights) expect(html).not.toContain(highlight);
    artifact("listing", html);
  });
});
