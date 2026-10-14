// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

describe("Selected text hyperlinks", () => {
    it("links only the selected words, reloads, updates and removes the link without changing text", () => {
        const editor = new Editor({
            extensions: [StarterKit.configure({ link: false }), Link.configure({ openOnClick: false })],
            content: "<p>Read this match report today.</p>",
        });
        try {
            // The dialog restores this range after the URL input takes focus.
            const range = { from: 11, to: 23 };
            editor.chain().setTextSelection(range).setLink({ href: "https://example.com/report" }).run();
            const saved = editor.getHTML();
            expect(saved).toMatch(/<a [^>]*href="https:\/\/example.com\/report"[^>]*>match report<\/a>/);
            expect(editor.getText()).toBe("Read this match report today.");
            editor.commands.setContent(saved);
            editor.chain().setTextSelection(15).extendMarkRange("link").setLink({ href: "https://example.com/new" }).run();
            expect(editor.getHTML()).toContain('href="https://example.com/new"');
            editor.chain().unsetLink().run();
            expect(editor.getHTML()).not.toContain("<a ");
            expect(editor.getText()).toBe("Read this match report today.");
        } finally { editor.destroy(); }
    });
});
