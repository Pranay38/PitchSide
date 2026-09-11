import { describe, it, expect, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/search";
import { connectToDatabase } from "../../_api/_db";

vi.mock("../../_api/_db", () => ({
  connectToDatabase: vi.fn()
}));

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function createMockRequest(method: string, query: any): VercelRequest {
  return {
    method,
    query
  } as unknown as VercelRequest;
}

describe("Search API Endpoint", () => {
  it("rejects non-GET requests", async () => {
    const req = createMockRequest("POST", {});
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("returns 400 for empty or short query", async () => {
    const req = createMockRequest("GET", { q: "a" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Search query must be at least 2 characters" });
  });

  it("performs search and returns results", async () => {
    const mockResults = [
      { id: "1", title: "Arsenal Tactics" }
    ];

    const mockCollection = {
      aggregate: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockResults)
      })
    };

    (connectToDatabase as any).mockResolvedValue({
      db: { collection: vi.fn().mockReturnValue(mockCollection) }
    });

    const req = createMockRequest("GET", { q: "arsenal" });
    const res = createMockResponse();

    await handler(req, res);

    expect(mockCollection.aggregate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      results: mockResults,
      count: 1,
      query: "arsenal"
    });
  });

  it("falls back to regex search if Atlas Search fails", async () => {
    const mockResults = [
      { id: "2", title: "Fallback Arsenal Tactics" }
    ];

    const mockCollection = {
      aggregate: vi.fn().mockImplementation(() => {
        throw new Error("Atlas search not supported");
      }),
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            project: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue(mockResults)
            })
          })
        })
      })
    };

    (connectToDatabase as any).mockResolvedValue({
      db: { collection: vi.fn().mockReturnValue(mockCollection) }
    });

    const req = createMockRequest("GET", { q: "arsenal" });
    const res = createMockResponse();

    await handler(req, res);

    expect(mockCollection.aggregate).toHaveBeenCalled();
    expect(mockCollection.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      results: mockResults,
      count: 1,
      query: "arsenal"
    });
  });
});
