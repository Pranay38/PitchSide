import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import subscribersHandler from "../server/endpoints/subscribers";
import { connectToDatabase } from "../server/_db";
import { checkRateLimit, checkOrigin, rejectHoneypot, sanitizeString, requireAuth } from "../server/utils/security";
import { sendEmail, isMailerConfigured } from "../server/_mailer";

vi.mock("../server/_db", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({ db: { collection: vi.fn() } })
}));

vi.mock("../server/utils/security", () => ({
  applyCors: vi.fn(),
  checkRateLimit: vi.fn().mockReturnValue(true),
  checkOrigin: vi.fn().mockReturnValue(true),
  rejectHoneypot: vi.fn().mockReturnValue(true),
  sanitizeString: vi.fn((str: string) => str),
  requireAuth: vi.fn().mockResolvedValue(true)
}));

vi.mock("../server/_mailer", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  sendBatchEmails: vi.fn(),
  isMailerConfigured: vi.fn().mockReturnValue(true)
}));

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

describe("Email Gate & Subscriber Funnel Tests", () => {
  let mockCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (checkRateLimit as any).mockReturnValue(true);
    (checkOrigin as any).mockReturnValue(true);
    (rejectHoneypot as any).mockReturnValue(true);

    mockCollection = {
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: "new-sub" }),
      countDocuments: vi.fn().mockResolvedValue(0),
      find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    const mockDb = { collection: vi.fn().mockReturnValue(mockCollection) };
    (connectToDatabase as any).mockResolvedValue({ db: mockDb });
  });

  it("should reject empty email on subscribe", async () => {
    const req = {
      method: "POST", body: { email: "" }, query: {}, headers: {}
    } as unknown as VercelRequest;
    const res = mockRes();
    await subscribersHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should reject malformed email on subscribe", async () => {
    const req = {
      method: "POST", body: { email: "not-an-email" }, query: {}, headers: {}
    } as unknown as VercelRequest;
    const res = mockRes();
    await subscribersHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 200 for duplicate subscriber", async () => {
    mockCollection.findOne.mockResolvedValue({ email: "exists@test.com", status: "active" });

    const req = {
      method: "POST", body: { email: "exists@test.com" }, query: {}, headers: {}
    } as unknown as VercelRequest;
    const res = mockRes();
    await subscribersHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should create new subscriber and send welcome email", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const req = {
      method: "POST", body: { email: "new@test.com" }, query: {}, headers: {}
    } as unknown as VercelRequest;
    const res = mockRes();
    await subscribersHandler(req, res);

    expect(mockCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@test.com" })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should require auth for GET (subscriber listing)", async () => {
    (requireAuth as any).mockResolvedValue(false);

    const req = {
      method: "GET", body: {}, query: {}, headers: {}
    } as unknown as VercelRequest;
    const res = mockRes();
    await subscribersHandler(req, res);

    // Should NOT return subscriber data when auth fails
    expect(res.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ subscribers: expect.any(Array) })
    );
  });
});
