import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/analytics";
import { connectToDatabase } from "../server/_db";
import { checkRateLimit, requireAuth, applyCors } from "../server/utils/security";

vi.mock("../server/_db", () => ({
  connectToDatabase: vi.fn()
}));

vi.mock("../server/utils/security", () => ({
  applyCors: vi.fn(),
  checkRateLimit: vi.fn().mockReturnValue(true),
  requireAuth: vi.fn().mockResolvedValue(true)
}));

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function createMockRequest(method: string, body?: any): VercelRequest {
  return {
    method,
    body,
    query: {},
    headers: {}
  } as unknown as VercelRequest;
}

describe("Analytics API Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkRateLimit as any).mockReturnValue(true);
    (requireAuth as any).mockResolvedValue(true);
  });

  it("handles OPTIONS request", async () => {
    const req = createMockRequest("OPTIONS");
    const res = createMockResponse();

    await handler(req, res);

    expect(applyCors).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it("rejects non-GET requests", async () => {
    const req = createMockRequest("POST");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("requires authentication", async () => {
    (requireAuth as any).mockResolvedValue(false);
    
    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    // requireAuth handles the response when it fails, so handler should return early
    expect(connectToDatabase).not.toHaveBeenCalled();
  });

  it("returns analytics data when authenticated", async () => {
    const mockDb = {
      collection: vi.fn((name) => {
        const mockCursor = (data: any[]) => ({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          project: vi.fn().mockReturnThis(),
          toArray: vi.fn().mockResolvedValue(data)
        });

        if (name === "subscribers") {
          return {
            countDocuments: vi.fn().mockResolvedValue(100),
            find: vi.fn().mockReturnValue(mockCursor([
              { subscribedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
            ])),
            aggregate: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([
                { _id: "2023-10-01", count: 5 }
              ])
            })
          };
        }
        if (name === "posts") {
          return {
            countDocuments: vi.fn().mockResolvedValue(50),
            find: vi.fn().mockReturnValue(mockCursor([
              { title: "Test Post", views: 100, likes: ["user1"] }
            ]))
          };
        }
        if (name === "comments") {
          return { countDocuments: vi.fn().mockResolvedValue(15) };
        }
        if (name === "debates") {
          return { countDocuments: vi.fn().mockResolvedValue(10) };
        }
        if (name === "newsletter_log") {
          return {
            find: vi.fn().mockReturnValue(mockCursor([
              { subject: "Test", sentAt: new Date(), sent: 100, failed: 0 }
            ]))
          };
        }
        if (name === "polls") {
          return {
            aggregate: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([{ totalVotes: 50 }])
            })
          };
        }
        if (name === "cron_logs") {
          return {
            find: vi.fn().mockReturnValue(mockCursor([
              { jobName: "syncMatches", status: "success", executionTimeMs: 120, timestamp: new Date() }
            ]))
          };
        }
        if (name === "error_logs") {
          return {
            find: vi.fn().mockReturnValue(mockCursor([
              { severity: "error", message: "Failed email", timestamp: new Date() }
            ]))
          };
        }
        return {
          countDocuments: vi.fn().mockResolvedValue(50)
        };
      })
    };

    (connectToDatabase as any).mockResolvedValue({ db: mockDb });

    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    const responseData = (res.json as any).mock.calls[0][0];
    
    expect(responseData).toHaveProperty("kpis");
    expect(responseData.kpis).toHaveProperty("totalSubscribers", 100);
    expect(responseData).toHaveProperty("subscriberGrowth");
    expect(responseData).toHaveProperty("cronHealth");
    expect(responseData).toHaveProperty("recentErrors");
    expect(responseData.cronHealth[0].jobName).toBe("syncMatches");
    expect(responseData.recentErrors).toHaveLength(1);
  });
});
