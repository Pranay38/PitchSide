import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HtmlDocumentFrame } from "../src/app/components/HtmlDocumentFrame";
import { wrapHtmlDocument, readHtmlDocument } from "../src/app/lib/htmlDocument";

describe("preserved HTML isolation", () => {
    it("keeps scripts inside srcdoc without same-origin, navigation or popup privileges", () => {
        const content = wrapHtmlDocument('<script>document.body.dataset.test="yes"</script><svg></svg>');
        const markup = renderToStaticMarkup(React.createElement(HtmlDocumentFrame, { content }));
        expect(markup).toContain('sandbox="allow-scripts"');
        expect(markup).toContain('referrerPolicy="no-referrer"');
        expect(markup).not.toContain('allow-same-origin');
        expect(markup).not.toContain('<script>');
        expect(markup).toContain('&lt;script&gt;');
        expect(readHtmlDocument('<p>Normal content</p>')).toBeNull();
    });
});
