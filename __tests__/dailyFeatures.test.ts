import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/daily-features";
import { connectToDatabase } from "../server/_db";

// Mock the database
vi.mock("../server/_db", () => ({
  connectToDatabase: vi.fn()
}));

// Mock global fetch for RSS feeds
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function createMockRequest(method: string, headers?: Record<string, string>): VercelRequest {
  return {
    method,
    body: {},
    query: {},
    headers: headers || {}
  } as unknown as VercelRequest;
}

describe("Daily Features Cron Endpoint", () => {
  let mockCollection: any;
  let mockCronLogsCollection: any;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCollection = {
      findOne: vi.fn().mockResolvedValue(null),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockCronLogsCollection = {
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockDb = {
      collection: vi.fn((name: string) => {
        if (name === "cron_logs") return mockCronLogsCollection;
        return mockCollection;
      }),
    };

    (connectToDatabase as any).mockResolvedValue({ db: mockDb });

    // Default: RSS feeds return empty
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<rss><channel></channel></rss>"),
    });
  });

  it("should reject non-GET/POST methods with 405", async () => {
    const req = createMockRequest("DELETE");
    const res = createMockResponse();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("should return cached data for GET without cron header", async () => {
    const mockDoc = {
      lastUpdated: "2026-04-30T00:00:00Z",
      rumorMill: { text: "Test rumour", sentimentScore: 50 },
      managerPressure: [],
      onThisDay: { year: "2026", event: "Test event" },
    };
    mockCollection.findOne.mockResolvedValue(mockDoc);

    const req = createMockRequest("GET");
    const res = createMockResponse();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ rumorMill: mockDoc.rumorMill })
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      expect.stringContaining("s-maxage")
    );
  });

  it("should log to cron_logs on cron trigger", async () => {
    const req = createMockRequest("GET", { "x-vercel-cron": "true" });
    const res = createMockResponse();
    await handler(req, res);

    expect(mockCronLogsCollection.updateOne).toHaveBeenCalledWith(
      { jobName: "daily-features" },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "success" }),
      }),
      { upsert: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should upsert daily_features document on cron trigger", async () => {
    const req = createMockRequest("GET", { "x-vercel-cron": "true" });
    const res = createMockResponse();
    await handler(req, res);

    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: expect.stringContaining("daily-") }),
      expect.objectContaining({ $set: expect.objectContaining({ rumorMill: expect.any(Object) }) }),
      { upsert: true }
    );
  });

  it("should scrape fresh data when no cache exists for today (GET)", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const req = createMockRequest("GET");
    const res = createMockResponse();
    await handler(req, res);

    // Should attempt to updateOne (upsert) since no cache was found
    expect(mockCollection.updateOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
