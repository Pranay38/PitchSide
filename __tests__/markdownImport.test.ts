import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../src/app/lib/markdownImport";

describe("Markdown import", () => {
    it("renders tables, images, links and rich formatting", () => {
        const html = renderMarkdown('# Title\n\n| Club | Points |\n| --- | ---: |\n| Arsenal | **30** |\n\n![Shape](https://example.com/shape.png "Formation")\n\n> Quote\n\n- One\n- Two\n\n[Source](https://example.com)\n\n```js\nconst score = 1;\n```');
        for (const tag of ["<h1>", "<table>", "<th", "<td", "<strong>", "<img", "<blockquote>", "<ul>", "<a", "<pre><code"]) expect(html).toContain(tag);
        expect(html).toContain('alt="Shape"');
        expect(html).toContain('src="https://example.com/shape.png"');
    });
    it("removes executable HTML and unsafe links", () => {
        const html = renderMarkdown('<script>alert(1)</script>\n\n<img src="https://example.com/a.png" onerror="alert(1)">\n\n[bad](javascript:alert%281%29)');
        expect(html).not.toMatch(/<script|onerror|javascript:/);
        expect(html).toContain("https://example.com/a.png");
    });
    it("rejects empty files", () => expect(() => renderMarkdown(" \n")).toThrow("empty"));
});
