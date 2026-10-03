import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/preferences/route";
import { connectToDatabase } from "../server/_db";
vi.mock("../server/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/utils/security", () => ({ sanitizeString: (value: unknown) => typeof value === "string" ? value : null }));
describe("active preferences route", () => {
  it("returns current opt-out state and saves an unsubscribe", async () => {
    const updateOne = vi.fn();
    vi.mocked(connectToDatabase).mockResolvedValue({ db: { collection: () => ({ findOne: async () => ({ status: "unsubscribed" }), updateOne }) } } as any);
    const result = await GET(new NextRequest("https://www.thetouchlinedribble.in/api/preferences?email=test%40example.com"));
    expect(await result.json()).toEqual({ preferences: { digest: false, newArticles: false, productUpdates: false, unsubscribed: true } });
    const saved = await POST(new NextRequest("https://www.thetouchlinedribble.in/api/preferences", { method: "POST", body: JSON.stringify({ email: "test@example.com", preferences: { unsubscribed: true } }) }));
    expect(saved.status).toBe(200);
    expect(updateOne).toHaveBeenCalledWith({ email: "test@example.com" }, { $set: expect.objectContaining({ status: "unsubscribed", preferences: { digest: false, newArticles: false, productUpdates: false } }) });
  });
});
