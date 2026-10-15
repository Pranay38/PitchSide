// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { HtmlSectionExtension } from "../src/app/components/extensions/HtmlSectionExtension";
import { getArticleContentModel } from "../src/app/lib/articleModel";
import { wrapHtmlDocument } from "../src/app/lib/htmlDocument";
import { splitHtmlSections } from "../src/app/lib/htmlSection";

describe("HTML sections within editable articles", () => {
    it("inserts multiple graphics between paragraphs, preserves surrounding text, and survives reload", () => {
        const editor = new Editor({ extensions: [StarterKit, HtmlSectionExtension], content: '<p>Before the stats</p><p>After the stats</p>' });
        const source = wrapHtmlDocument('<style>p{color:red}</style><button onclick="this.textContent=42">Stats</button><script>window.chart="✓"</script>');
        try {
            const position = editor.state.doc.firstChild!.nodeSize;
            editor.commands.insertContentAt(position, [{ type: 'htmlSection', attrs: { source } }, { type: 'htmlSection', attrs: { source: wrapHtmlDocument('<svg><circle r="5" /></svg>') } }]);
            const saved = editor.getHTML();
            editor.commands.setContent(saved);
            expect(editor.getText()).toContain('Before the stats');
            expect(editor.getText()).toContain('After the stats');
            expect(editor.getHTML()).toBe(saved);
            const model = getArticleContentModel(saved);
            expect(model.richBlocks?.map(b => b.type)).toEqual(['html', 'html-section', 'html-section', 'html']);
            expect(model.richBlocks?.[1]).toEqual({ type: 'html-section', content: source });
            expect(saved).not.toContain('<script>');
            editor.commands.deleteRange({ from: position, to: position + 1 });
            expect(splitHtmlSections(editor.getHTML()).filter(b => b.type === 'html-section')).toHaveLength(1);
            expect(editor.getText()).toContain('After the stats');
        } finally { editor.destroy(); }
    });
});
