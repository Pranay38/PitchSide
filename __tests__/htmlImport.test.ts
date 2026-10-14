// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { importHtmlFile } from "../src/app/lib/htmlImport";

function file(source: string, name = "article.html") {
    const result = new File([source], name, { type: "text/html" });
    Object.defineProperty(result, "text", { value: async () => source });
    return result;
}

describe("HTML article import", () => {
    it("imports document body as editable content that survives save and reload", async () => {
        const html = await importHtmlFile(file('<!doctype html><html><head><title>Metadata</title></head><body><h2>Match report</h2><p>Original text</p><ul><li>One point</li></ul><table><tr><th>Club</th></tr><tr><td>Arsenal</td></tr></table></body></html>'));
        const editor = new Editor({ extensions: [StarterKit, TableKit], content: html });
        try {
            editor.commands.selectAll();
            editor.commands.insertContent('<p>Edited text</p>' + editor.getHTML());
            const saved = editor.getHTML();
            editor.commands.setContent(saved);
            expect(editor.getText()).toContain("Edited text");
            expect(saved).toContain('<h2>Match report</h2>');
            expect(saved).toContain('<table');
            expect(saved).toContain('Arsenal');
            expect(saved).not.toContain('Metadata');
        } finally { editor.destroy(); }
    });

    it("removes active content and page styles while keeping article text", async () => {
        const html = await importHtmlFile(file('<style>p{display:none}</style><script>alert(1)</script><p style="color:red" onclick="alert(1)">Safe <a href="javascript:alert(1)">link</a></p><iframe src="https://example.com"></iframe>'));
        expect(html).toContain('Safe');
        expect(html).not.toMatch(/script|onclick|style=|iframe|display:none/);
    });

    it("accepts htm fragments and rejects wrong, empty, and oversized files", async () => {
        expect(await importHtmlFile(file('<p>Fragment</p>', 'article.HTM'))).toContain('Fragment');
        await expect(importHtmlFile(file('text', 'article.txt'))).rejects.toThrow('HTML');
        await expect(importHtmlFile(file('<script>alert(1)</script>'))).rejects.toThrow('empty');
        const oversized = file('text');
        Object.defineProperty(oversized, 'size', { value: 6 * 1024 * 1024 });
        await expect(importHtmlFile(oversized)).rejects.toThrow('5 MB');
    });
});
