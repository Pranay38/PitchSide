import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/digest";
import { connectToDatabase } from "../server/_db";
import { sendBatchEmails, isMailerConfigured } from "../server/_mailer";
import { requireAuth } from "../server/utils/security";

vi.mock("../server/_db", () => ({
  connectToDatabase: vi.fn()
}));

vi.mock("../server/_mailer", () => ({
  sendBatchEmails: vi.fn().mockResolvedValue(undefined),
  isMailerConfigured: vi.fn().mockReturnValue(true)
}));

vi.mock("../server/utils/security", () => ({
  requireAuth: vi.fn().mockResolvedValue(true),
  applyCors: vi.fn(),
  checkRateLimit: vi.fn().mockReturnValue(true),
}));

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function createCronRequest(): VercelRequest {
  return {
    method: "GET",
    body: {},
    query: {},
    headers: { authorization: `Bearer ${process.env.CRON_SECRET || "test-secret"}` }
  } as unknown as VercelRequest;
}

describe("Digest Cron Endpoint", () => {
  let mockDb: any;
  let mockSubscribersCollection: any;
  let mockPostsCollection: any;
  let mockCronLogsCollection: any;
  let mockNewsletterLogCollection: any;
  let mockUserPrefsCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";

    mockSubscribersCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { email: "test@example.com", status: "active" },
          { email: "user2@example.com", status: "active" }
        ])
      })
    };

    mockPostsCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              {
                title: "Test Post",
                slug: "test-post",
                excerpt: "A test post",
                publishAt: new Date().toISOString(),
                club: "Arsenal",
                readTime: "5 min",
                isDraft: false
              }
            ])
          })
        })
      })
    };

    mockCronLogsCollection = {
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 })
    };

    mockUserPrefsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      })
    };

    mockDb = {
      collection: vi.fn((name: string) => {
        if (name === "subscribers") return mockSubscribersCollection;
        if (name === "posts") return mockPostsCollection;
        if (name === "cron_logs") return mockCronLogsCollection;
        if (name === "user_preferences") return mockUserPrefsCollection;
        return { find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }) };
      })
    };

    (connectToDatabase as any).mockResolvedValue({ db: mockDb });

    // Mock global fetch for Clerk API
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve([])
    }));
  });

  it("should skip when no active subscribers exist", async () => {
    mockSubscribersCollection.find.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([])
    });

    const req = createCronRequest();
    const res = createMockResponse();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("No active subscribers") })
    );
    expect(sendBatchEmails).not.toHaveBeenCalled();
  });

  it("should skip when no recent posts exist", async () => {
    // Posts all older than 7 days
    mockPostsCollection.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            {
              title: "Old Post",
              publishAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              isDraft: false
            }
          ])
        })
      })
    });

    const req = createCronRequest();
    const res = createMockResponse();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("No new posts") })
    );
  });

  it("should send batch emails and log to cron_logs on success", async () => {
    const req = createCronRequest();
    const res = createMockResponse();
    await handler(req, res);

    expect(sendBatchEmails).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ to: "test@example.com" }),
        expect.objectContaining({ to: "user2@example.com" })
      ])
    );

    expect(mockCronLogsCollection.updateOne).toHaveBeenCalledWith(
      { jobName: "digest" },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "success", emailsSent: 2 })
      }),
      { upsert: true }
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 500 and log failure when mailer is not configured", async () => {
    (isMailerConfigured as any).mockReturnValue(false);

    const req = createCronRequest();
    const res = createMockResponse();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(sendBatchEmails).not.toHaveBeenCalled();
  });
});
