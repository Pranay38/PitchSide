import { describe, expect, it, vi } from "vitest";
import handler from "../_api/posts";
import nextHandler from "../pages/api/posts";
import { connectToDatabase } from "../_api/_db";

vi.mock("../_api/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/utils/security", () => ({
    applyCors: vi.fn(), checkRateLimit: () => true, hasAdminAuth: async () => false, requireAuth: vi.fn(),
}));
vi.mock("../server/lib/postNotifications", () => ({ isPostLive: vi.fn(), notifySubscribersAboutPost: vi.fn() }));

describe.each([handler, nextHandler])("public post feed freshness (%#)", (handler) => {
    it("returns newly published posts without allowing CDN caching and hides drafts", async () => {
        let records = [{ id: "old", title: "Old" }, { id: "draft", isDraft: true }];
        vi.mocked(connectToDatabase).mockResolvedValue({ db: { collection: () => ({
            find: () => ({ sort: () => ({ toArray: async () => records }) }),
        }) } } as any);
        const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() };
        await handler({ method: "GET", query: {} } as any, res);
        expect(res.json.mock.calls[0][0].map((post: any) => post.id)).toEqual(["old"]);
        records = [{ id: "new", title: "Just published" }, ...records];
        await handler({ method: "GET", query: {} } as any, res);
        expect(res.json.mock.calls[1][0].map((post: any) => post.id)).toEqual(["new", "old"]);
        expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache, no-store, must-revalidate");
    });

    it("keeps summary feeds small while preserving complete articles on regular requests", async () => {
        const records = [
            { id: "new", title: "Just published", content: "x".repeat(5 * 1024 * 1024), html: "large HTML", blocks: ["large blocks"], richBlocks: ["large rich blocks"] },
            { id: "draft", isDraft: true },
            { id: "scheduled", publishAt: "2099-01-01T00:00:00Z" },
        ];
        const find = vi.fn((_query, options = {} as any) => ({ sort: () => ({
            toArray: async () => records.map((post) => Object.fromEntries(
                Object.entries(post).filter(([key]) => options.projection?.[key] !== 0),
            )),
        }) }));
        vi.mocked(connectToDatabase).mockResolvedValue({ db: { collection: () => ({ find }) } } as any);
        const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() };

        await handler({ method: "GET", query: { summary: "1" } } as any, res);
        expect(res.json.mock.calls[0][0]).toEqual([{ id: "new", title: "Just published" }]);
        expect(Buffer.byteLength(JSON.stringify(res.json.mock.calls[0][0]))).toBeLessThan(1024);

        await handler({ method: "GET", query: {} } as any, res);
        expect(res.json.mock.calls[1][0][0].content).toHaveLength(5 * 1024 * 1024);
    });
});
