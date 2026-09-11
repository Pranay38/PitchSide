import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (fn: any) => {
    return (req: any, evt: any) => fn(null, req, evt);
  }
}));

import middleware from "../middleware";

describe("Slug Redirect Middleware", () => {
  it("redirects numeric ID to slug if found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "12345", slug: "some-slug" }]
    });

    const req = new NextRequest("http://localhost:3000/post/12345");
    const res = await middleware(req, null as any);
    
    expect(res).toBeDefined();
    expect(res!.status).toBe(308);
    expect(res!.headers.get("location")).toBe("http://localhost:3000/post/some-slug");
  });

  it("passes through if numeric ID not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "12345", slug: "some-slug" }]
    });

    const req = new NextRequest("http://localhost:3000/post/99999");
    const res = await middleware(req, null as any);
    
    expect(res).toBeUndefined(); // no redirect
  });

  it("passes through if already a slug", async () => {
    const req = new NextRequest("http://localhost:3000/post/some-slug");
    const res = await middleware(req, null as any);
    
    expect(res).toBeUndefined(); // no fetch even called
  });
});
