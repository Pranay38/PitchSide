import { it, expect } from "vitest";
import { getArticleContentModel } from "../src/app/lib/articleModel";
import { encodeHtmlSection } from "../src/app/lib/htmlSection";
import { wrapHtmlDocument } from "../src/app/lib/htmlDocument";
it("preserves section order during server-side rendering without DOMParser", () => {
    const source = wrapHtmlDocument('<canvas></canvas><script>drawChart()</script>');
    const model = getArticleContentModel(`<p>Intro</p><div data-html-section="${encodeHtmlSection(source)}"></div><p>Conclusion</p>`);
    expect(model.richBlocks).toEqual([{ type: 'html', content: '<p>Intro</p>' }, { type: 'html-section', content: source }, { type: 'html', content: '<p>Conclusion</p>' }]);
});
