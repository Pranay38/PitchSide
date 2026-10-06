import { createRequire } from "node:module";
import { afterAll, describe, expect, it, vi } from "vitest";
import { renderMarkdown } from "../src/app/lib/markdownImport";
import { storyFromImportedHtml } from "../src/app/lib/storyMarkdownImport";

const { JSDOM } = createRequire(import.meta.url)("jsdom");
vi.stubGlobal("DOMParser", new JSDOM("").window.DOMParser);
afterAll(() => vi.unstubAllGlobals());

describe("story Markdown import", () => {
  it("extracts the title and preserves introduction, chapters, and rich content", () => {
    const result = storyFromImportedHtml(renderMarkdown("# A match\n\nOpening & context.\n\n## First half\n\n**Pressure**\n\n### Shape\n\n![Pitch](https://example.com/pitch.png)\n\n## Second half\n\nThe finish."));
    expect(result.title).toBe("A match");
    expect(result.chapters.map(chapter => chapter.title)).toEqual(["Introduction", "First half", "Second half"]);
    expect(result.chapters[1].body[0]).toContain("<strong>Pressure</strong>");
    expect(result.chapters[1].body[0]).toContain("<h3>Shape</h3>");
    expect(result.chapters[1].body[0]).toContain('src="https://example.com/pitch.png"');
    expect(new Set(result.chapters.map(chapter => chapter.id)).size).toBe(3);
  });
  it("handles files without headings as one chapter", () => {
    const result = storyFromImportedHtml(renderMarkdown("A story without headings."));
    expect(result.title).toBe("");
    expect(result.chapters).toHaveLength(1);
  });
  it("does not create a blank introduction before the first chapter", () => {
    expect(storyFromImportedHtml(renderMarkdown("# Title\n\n## Chapter\n\nBody")).chapters).toHaveLength(1);
  });
  it("rejects a title-only document", () => {
    expect(() => storyFromImportedHtml(renderMarkdown("# Title"))).toThrow("Add some story content");
  });
});
