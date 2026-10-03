// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { BlogPost } from "../src/app/data/posts";
const mocks = vi.hoisted(() => ({ query: "", track: vi.fn(), posts: [] as any[] }));
vi.mock("../src/lib/router-compat", () => ({
  Link: ({ to, children, ...props }: any) => React.createElement("a", { href: to, ...props, onClick: (event: any) => { event.preventDefault(); props.onClick?.(event); } }, children),
  useSearchParams: () => [new URLSearchParams(mocks.query), (query: URLSearchParams) => { const next = new URLSearchParams(mocks.query); if (query instanceof URLSearchParams) mocks.query = query.toString(); else { Object.entries(query).forEach(([key, value]) => next.set(key, String(value))); mocks.query = next.toString(); } }],
}));
vi.mock("../src/app/components/SEO", () => ({ SEO: () => null }));
vi.mock("../src/app/components/Header", () => ({ Header: () => null }));
vi.mock("../src/app/components/Footer", () => ({ Footer: () => null }));
vi.mock("../src/app/lib/analytics", () => ({ trackContentEvent: mocks.track }));
vi.mock("../src/app/lib/postStorage", () => ({ getPublishedPosts: () => mocks.posts, getPublishedPostsAsync: async () => mocks.posts }));
vi.mock("../src/app/lib/storyStorage", () => ({ getAllStories: () => [], getAllStoriesAsync: async () => [] }));
import { ArchivePage } from "../src/app/pages/ArchivePage";
import { EditorialReading } from "../src/app/components/EditorialReading";
import { selectRelatedReading } from "../src/app/lib/matchdayContent";
vi.stubGlobal("React", React);
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
const post = (id: string, extra: Partial<BlogPost> = {}): BlogPost => ({ id, title: id, content: "", excerpt: "", coverImage: "/cover.jpg", club: "Arsenal", tags: ["Tactics"], date: "2026-01-01", readTime: "3 min", ...extra });
let host: HTMLDivElement;
let root: Root;
async function archive(query = mocks.query) { mocks.query = query; await act(async () => { root.render(React.createElement(ArchivePage)); }); }
async function change(label: string, value: string) {
  const select = host.querySelector(`[aria-label="${label}"]`) as HTMLSelectElement;
  await act(async () => { select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); });
  await archive();
}
async function click(text: string) {
  const button = [...host.querySelectorAll("button")].find(el => el.textContent?.trim() === text)!;
  await act(async () => button.click()); await archive();
}
beforeEach(() => {
  mocks.query = ""; mocks.track.mockClear();
  mocks.posts = [post("Opinion", { contentKind: "opinion" }), post("Guide", { contentKind: "explainer" }), post("Other", { club: "Chelsea", tags: ["Transfers"] })];
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
describe("archive discovery", () => {
  it("combines primary and advanced filters, preserves URL parameters, and clears them", async () => {
    await archive("utm_source=x");
    expect(host.querySelector("details")?.open).toBe(false);
    await change("Filter by article kind", "explainer");
    await change("Filter by topic", "Tactics");
    await change("Filter by club", "Arsenal");
    expect(new URLSearchParams(mocks.query).get("utm_source")).toBe("x");
    expect(host.querySelector("details")?.open).toBe(true);
    expect(host.querySelector("summary")?.textContent).toContain("1 active");
    expect(host.querySelector('a[href="/post/Guide"]')).not.toBeNull();
    expect(host.querySelector('a[href="/post/Opinion"]')).toBeNull();
    await click("Clear"); expect(mocks.query).toBe("");
    expect(host.querySelector("details")?.open).toBe(false);
    expect(host.querySelector('a[href="/post/Opinion"]')).not.toBeNull();
  });
  it("restores disclosure and controls when URL navigation moves back and forward", async () => {
    const bookmarked = "type=article&club=Arsenal&league=Premier+League&format=Must+Read&sort=oldest";
    await archive(bookmarked);
    expect(host.querySelector("details")?.open).toBe(true);
    expect(host.querySelector("summary")?.textContent).toContain("4 active");
    await archive(""); expect(host.querySelector("details")?.open).toBe(false);
    await archive(bookmarked); expect(host.querySelector("details")?.open).toBe(true);
    expect((host.querySelector('[aria-label="Sort results"]') as HTMLSelectElement).value).toBe("oldest");
  });
  it("keeps legacy story format links and supports empty-result recovery", async () => {
    await archive("format=Scrollytelling");
    expect(host.textContent).toContain("Visual stories");
    expect(host.textContent).not.toContain("Scrollytelling");
    expect(host.textContent).toContain("Nothing matched those filters");
    await click("Reset archive filters");
    expect(host.querySelector('a[href="/post/Guide"]')).not.toBeNull();
  });
});
describe("contextual continued reading", () => {
  it("labels reverse links while preserving historical analytics placement", async () => {
    const current = post("guide", { contentKind: "explainer" });
    const result = selectRelatedReading(current, [current, post("argument", { contentKind: "opinion", editorial: { backgroundPostId: "guide" } })]);
    await act(async () => root.render(React.createElement(EditorialReading, { postId: current.id, ...result })));
    expect(host.textContent).toContain("See this idea in an argument");
    await act(async () => host.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })));
    expect(mocks.track).toHaveBeenCalledWith("related_article_click", { article_id: "guide", destination_article_id: "argument", placement: "Another perspective" });
  });
  it("keeps curated opinions ahead of reverse links and does not imply opposition", async () => {
    const current = post("guide", { contentKind: "explainer", relatedPostIds: ["curated"] });
    const result = selectRelatedReading(current, [current, post("reverse", { contentKind: "opinion", editorial: { backgroundPostId: "guide" } }), post("curated", { contentKind: "opinion" })]);
    expect(result.perspective?.id).toBe("curated");
    expect(result.perspectiveUsesCurrentExplainer).toBe(false);
    await act(async () => root.render(React.createElement(EditorialReading, { postId: current.id, ...result })));
    expect(host.textContent).toContain("Explore a related argument");
  });
  it("omits unavailable recommendations and excludes drafts, future posts and self links", async () => {
    const current = post("current", { contentKind: "explainer" });
    const result = selectRelatedReading(current, [current, post("draft", { contentKind: "opinion", isDraft: true }), post("future", { contentKind: "opinion", publishAt: "2099-01-01" })]);
    expect(result.background).toBeUndefined(); expect(result.perspective).toBeUndefined();
    await act(async () => root.render(React.createElement(EditorialReading, { postId: current.id, ...result })));
    expect(host.innerHTML).toBe("");
  });
});
