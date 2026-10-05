import { describe, expect, it, vi } from "vitest";
import handler from "../_api/posts";
import { connectToDatabase } from "../_api/_db";

vi.mock("../_api/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/utils/security", () => ({
    applyCors: vi.fn(), checkRateLimit: () => true, hasAdminAuth: async () => false, requireAuth: vi.fn(),
}));
vi.mock("../server/lib/postNotifications", () => ({ isPostLive: vi.fn(), notifySubscribersAboutPost: vi.fn() }));

describe("public post feed freshness", () => {
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
});
