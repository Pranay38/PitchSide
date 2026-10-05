import { describe, expect, it, vi } from "vitest";
import { MAX_POST_BODY_BYTES, serializePostPayload } from "../src/app/lib/postPayload";

describe("post payload size", () => {
    it("preserves small posts without changing images or editorial classification", async () => {
        const optimize = vi.fn();
        const post = { contentKind: "explainer", content: '<p>Hello</p><img src="data:image/png;base64,YQ==">' };
        expect(JSON.parse(await serializePostPayload(post, optimize))).toEqual(post);
        expect(optimize).not.toHaveBeenCalled();
    });
    it("optimizes oversized cover and inline images while retaining article data", async () => {
        const image = 'data:image/png;base64,' + 'A'.repeat(MAX_POST_BODY_BYTES);
        const post = { id: "42", title: "An explainer", contentKind: "explainer", coverImage: image, content: `<table><tr><td>Data</td></tr></table><img src="${image}">` };
        const optimize = vi.fn().mockResolvedValue('data:image/webp;base64,YQ==');
        const body = await serializePostPayload(post, optimize);
        const result = JSON.parse(body);
        expect(new TextEncoder().encode(body).length).toBeLessThan(MAX_POST_BODY_BYTES);
        expect(result.contentKind).toBe('explainer');
        expect(result.content).toContain('<table>');
        expect(result.coverImage).toBe('data:image/webp;base64,YQ==');
        expect(result.content).toContain(result.coverImage);
        expect(post.coverImage).toBe(image);
        expect(optimize).toHaveBeenCalledTimes(1);
    });
    it("rejects oversized text before sending and counts UTF-8 bytes", async () => {
        await expect(serializePostPayload({ content: '界'.repeat(MAX_POST_BODY_BYTES / 2) }, vi.fn())).rejects.toThrow('too large');
    });
    it("rejects images that cannot be reduced rather than discarding them", async () => {
        const image = 'data:image/gif;base64,' + 'A'.repeat(MAX_POST_BODY_BYTES);
        await expect(serializePostPayload({ coverImage: image }, async src => src)).rejects.toThrow('editor content has been kept');
    });
});
