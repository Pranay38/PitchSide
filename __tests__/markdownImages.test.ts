// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { importMarkdownFiles } from "../src/app/lib/markdownImport";
import { resizeImage } from "../src/app/lib/postPayload";
vi.mock('../src/app/lib/postPayload', () => ({ resizeImage: vi.fn(async () => 'data:image/webp;base64,YQ==') }));
it('optimizes large local images once even when referenced repeatedly', async () => {
    const md = new File([''], 'article.md');
    Object.defineProperty(md, 'text', { value: async () => '# Article\n\n![One](chart.png)\n\n![Two](chart.png)\n\nText remains editable.' });
    const image = new File([new Uint8Array(400 * 1024)], 'chart.png', { type: 'image/png' });
    const result = await importMarkdownFiles([md, image]);
    expect(result.missingImages).toEqual([]);
    expect(resizeImage).toHaveBeenCalledTimes(1);
    expect(result.html.match(/data:image\/webp;base64,YQ==/g)).toHaveLength(2);
    expect(result.html).toContain('Text remains editable.');
});
