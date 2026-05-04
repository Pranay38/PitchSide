import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/welcome-sequence";
import { connectToDatabase } from "../server/_db";
import { sendBatchEmails, isMailerConfigured } from "../server/_mailer";

vi.mock("../server/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/_mailer", () => ({
  sendBatchEmails: vi.fn().mockResolvedValue(undefined),
  isMailerConfigured: vi.fn().mockReturnValue(true)
}));

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function cronReq(): VercelRequest {
  return { method: "GET", body: {}, query: {}, headers: { "x-vercel-cron": "true" } } as unknown as VercelRequest;
}

function setupDb(findResults?: { day1: any[]; day3: any[] }) {
  const day1 = findResults?.day1 ?? [];
  const day3 = findResults?.day3 ?? [];
  let callIdx = 0;

  const cronUpdateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });
  const subFind = vi.fn().mockImplementation(() => ({
    toArray: vi.fn().mockResolvedValue(callIdx++ === 0 ? day1 : day3)
  }));
  const subUpdateMany = vi.fn().mockResolvedValue({ modifiedCount: 0 });

  const mockDb = {
    collection: vi.fn().mockImplementation((name: string) => {
      if (name === "cron_logs") return { updateOne: cronUpdateOne };
      return { find: subFind, updateMany: subUpdateMany };
    })
  };

  (connectToDatabase as any).mockResolvedValue({ db: mockDb });
  return { cronUpdateOne, subFind, subUpdateMany };
}

describe("Welcome Sequence Cron Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isMailerConfigured as any).mockReturnValue(true);
  });

  it("should reject non-GET/POST methods with 405", async () => {
    setupDb();
    const req = { method: "DELETE", body: {}, query: {}, headers: {} } as unknown as VercelRequest;
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("should return 500 when mailer is not configured", async () => {
    setupDb();
    (isMailerConfigured as any).mockReturnValue(false);
    const res = mockRes();
    await handler(cronReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(sendBatchEmails).not.toHaveBeenCalled();
  });

  it("should send Day 1 emails for state=1 subscribers", async () => {
    const day1Sub = { _id: "sub1", email: "day1@test.com" };
    const { subUpdateMany } = setupDb({ day1: [day1Sub], day3: [] });

    const res = mockRes();
    await handler(cronReq(), res);

    expect(sendBatchEmails).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ to: "day1@test.com" })])
    );
    expect(subUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: ["sub1"] } },
      { $set: { welcomeSequenceState: 2 } }
    );
  });

  it("should send Day 3 emails for state=2 subscribers", async () => {
    const day3Sub = { _id: "sub2", email: "day3@test.com" };
    const { subUpdateMany } = setupDb({ day1: [], day3: [day3Sub] });

    const res = mockRes();
    await handler(cronReq(), res);

    expect(sendBatchEmails).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ to: "day3@test.com" })])
    );
    expect(subUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: ["sub2"] } },
      { $set: { welcomeSequenceState: 3 } }
    );
  });

  it("should log to cron_logs on cron trigger", async () => {
    const { cronUpdateOne } = setupDb();
    const res = mockRes();
    await handler(cronReq(), res);

    expect(cronUpdateOne).toHaveBeenCalledWith(
      { jobName: "welcome-sequence" },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "success", day1Sent: 0, day3Sent: 0 })
      }),
      { upsert: true }
    );
  });

  it("should return 200 with zero counts when no emails are due", async () => {
    setupDb();
    const res = mockRes();
    await handler(cronReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, day1EmailsSent: 0, day3EmailsSent: 0 })
    );
    expect(sendBatchEmails).not.toHaveBeenCalled();
  });
});
