import { describe, it, expect, vi } from "vitest";
import sitemap from "../app/sitemap";

vi.mock("@/lib/server-data", () => ({
  getPublishedPostsServer: vi.fn().mockResolvedValue([
    { id: "1", slug: "post-1", date: "2023-01-01T00:00:00Z" },
    { id: "2", slug: "post-2", updatedAt: "2023-01-02T00:00:00Z", club: "Arsenal" }
  ]),
  getStoriesServer: vi.fn().mockResolvedValue([
    { id: "1", slug: "story-1", date: "2023-01-03T00:00:00Z" }
  ]),
  getSiteSettingsServer: vi.fn().mockResolvedValue({})
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(false)
  }
}));

describe("Sitemap", () => {
  it("includes the newsletter and does not fabricate static modification dates", async () => {
    const entries = await sitemap();
    expect(entries.find(e => e.url.endsWith("/subscribe"))).toBeDefined();
    expect(entries.find(e => e.url.endsWith("/about"))?.lastModified).toBeUndefined();
    expect(entries.find(e => e.url.endsWith("/post/post-2"))?.lastModified).toEqual(new Date("2023-01-02T00:00:00Z"));
    for (const entry of entries) {
      if (entry.lastModified) expect(Number.isFinite(new Date(entry.lastModified).getTime())).toBe(true);
    }
  });
  it("generates sitemap with static and dynamic routes", async () => {
    const sitemapData = await sitemap();
    
    // Check it returns an array
    expect(Array.isArray(sitemapData)).toBe(true);
    
    const urls = sitemapData.map(entry => entry.url);
    
    // Check base routes
    expect(urls).toContain("https://www.thetouchlinedribble.in");
    expect(urls).toContain("https://www.thetouchlinedribble.in/stories");
    expect(urls).toContain("https://www.thetouchlinedribble.in/tactics");
    
    // Check post routes
    expect(urls).toContain("https://www.thetouchlinedribble.in/post/post-1");
    expect(urls).toContain("https://www.thetouchlinedribble.in/post/post-2");
    
    // Check story routes
    expect(urls).toContain("https://www.thetouchlinedribble.in/stories/story-1");
    
    // Check club routes
    expect(urls).toContain("https://www.thetouchlinedribble.in/club/arsenal");
  });
});
