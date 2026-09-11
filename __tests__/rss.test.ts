import { describe, it, expect, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/rss";

// Mock the exact path that rss.ts imports
vi.mock("../../_api/_db", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({
    db: {
      collection: vi.fn().mockReturnValue({
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([
                {
                  id: "1",
                  slug: "test-post",
                  title: "Test Post",
                  excerpt: "This is a test post.",
                  date: "2023-01-01T00:00:00Z",
                  club: "Arsenal",
                  tags: ["Premier League"]
                }
              ])
            })
          })
        })
      })
    }
  })
}));

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function createMockRequest(method: string): VercelRequest {
  return {
    method
  } as unknown as VercelRequest;
}

describe("RSS Endpoint", () => {
  it("rejects non-GET requests", async () => {
    const req = createMockRequest("POST");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns RSS XML feed", async () => {
    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "application/rss+xml; charset=utf-8");
    expect(res.status).toHaveBeenCalledWith(200);
    
    const responseData = (res.send as any).mock.calls[0][0];
    expect(responseData).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    expect(responseData).toContain("<rss version=\"2.0\"");
    expect(responseData).toContain("<channel>");
    expect(responseData).toContain("<title>Test Post</title>");
    expect(responseData).toContain("<link>https://www.thetouchlinedribble.in/post/test-post</link>");
    expect(responseData).toContain("<category>Arsenal</category>");
    expect(responseData).toContain("<category>Premier League</category>");
  });
});
