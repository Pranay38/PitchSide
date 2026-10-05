// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { importMarkdownFiles } from "../src/app/lib/markdownImport";

function markdownFile(source: string) {
    const file = new File([source], "article.md", { type: "text/markdown" });
    Object.defineProperty(file, "text", { value: async () => source });
    return file;
}

describe("Markdown editor round trip", () => {
    it("preserves tables, checklists and images through editing and reload", async () => {
        const result = await importMarkdownFiles([markdownFile('## Analysis\n\n| Club | Points |\n| --- | --- |\n| Arsenal | 30 |\n\n- [x] Verified\n\n![Shape](https://example.com/shape.png)')]);
        const editor = new Editor({ extensions: [StarterKit, Image, TableKit, TaskList, TaskItem], content: result.html });
        editor.commands.insertContentAt(editor.state.doc.content.size, '<p>More analysis</p>');
        const saved = editor.getHTML();
        editor.commands.setContent(saved);
        expect(editor.getHTML()).toContain('<table');
        expect(editor.getHTML()).toContain('Arsenal');
        expect(editor.getHTML()).toContain('data-checked="true"');
        expect(editor.getHTML()).toContain('src="https://example.com/shape.png"');
        expect(editor.getHTML()).toContain('More analysis');
        editor.destroy();
    });
    it("embeds selected local images and identifies missing images", async () => {
        const file = markdownFile('![Chart](images/chart.png)\n\n![Missing](missing.png)');
        const image = new File(["image data"], "chart.png", { type: "image/png" });
        const result = await importMarkdownFiles([file, image]);
        expect(result.html).toContain('src="data:image/png;base64,');
        expect(result.missingImages).toEqual(["missing.png"]);
    });
    it("rejects ambiguous uploads", async () => {
        await expect(importMarkdownFiles([markdownFile("a"), markdownFile("b")])).rejects.toThrow("one .md");
    });
});
