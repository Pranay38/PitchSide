import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/subscribers";
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
  sanitizeString: vi.fn((str) => str),
  requireAuth: vi.fn().mockResolvedValue(true)
}));

vi.mock("../server/_mailer", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  sendBatchEmails: vi.fn(),
  isMailerConfigured: vi.fn().mockReturnValue(true)
}));

function createMockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
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

describe("Subscribers API Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkRateLimit as any).mockReturnValue(true);
    (checkOrigin as any).mockReturnValue(true);
    (rejectHoneypot as any).mockReturnValue(true);
  });

  it("handles OPTIONS request", async () => {
    const req = createMockRequest("OPTIONS");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it("rejects non-POST/GET requests", async () => {
    const req = createMockRequest("PUT");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  describe("POST /", () => {
    it("returns error for invalid email", async () => {
      const req = createMockRequest("POST", { email: "invalid-email" });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Please enter a valid email address." });
    });

    it("handles new subscription successfully", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: "123" }),
        updateOne: vi.fn().mockResolvedValue({})
      };
      (connectToDatabase as any).mockResolvedValue({ 
        db: { collection: vi.fn().mockReturnValue(mockCollection) } 
      });

      const req = createMockRequest("POST", { email: "test@example.com", preferences: ["tactics"] });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockCollection.insertOne).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData).toHaveProperty("message", "Subscribed successfully! Check your inbox for a welcome email ⚽");
      expect(responseData).toHaveProperty("emailSent", true);
      expect(res.setHeader).toHaveBeenCalledWith("Set-Cookie", expect.stringContaining("ttd_newsletter="));
    });

    it("handles email failure gracefully", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: "123" }),
        updateOne: vi.fn().mockResolvedValue({})
      };
      
      const mockErrorCollection = {
        insertOne: vi.fn()
      };

      (connectToDatabase as any).mockResolvedValue({ 
        db: { 
          collection: vi.fn((name) => {
            if (name === "error_logs") return mockErrorCollection;
            return mockCollection;
          })
        } 
      });
      
      (sendEmail as any).mockRejectedValueOnce(new Error("SMTP failure"));

      const req = createMockRequest("POST", { email: "fail@example.com" });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockCollection.insertOne).toHaveBeenCalled();
      expect(mockErrorCollection.insertOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData).toHaveProperty("emailSent", false);
    });

    it("returns 409 if already subscribed", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue({ email: "exist@example.com", _id: "123", bannerTokenHashes: [] }),
        updateOne: vi.fn().mockResolvedValue({})
      };
      (connectToDatabase as any).mockResolvedValue({ 
        db: { collection: vi.fn().mockReturnValue(mockCollection) } 
      });

      const req = createMockRequest("POST", { email: "exist@example.com" });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "You're already subscribed! 🎉", alreadySubscribed: true });
    });
  });

  describe("POST /?action=send-digest", () => {
    it("requires authentication", async () => {
      (requireAuth as any).mockResolvedValueOnce(false);
      const req = createMockRequest("POST", { subject: "Test", htmlContent: "<p>Test</p>" });
      req.query = { action: "send-digest" };
      const res = createMockResponse();

      await handler(req, res);

      expect(isMailerConfigured).not.toHaveBeenCalled();
    });

    it("returns error if mailer is not configured", async () => {
      (isMailerConfigured as any).mockReturnValueOnce(false);
      const req = createMockRequest("POST", { subject: "Test", htmlContent: "<p>Test</p>" });
      req.query = { action: "send-digest" };
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Mailer is not configured." });
    });

    it("returns error if subject or htmlContent is missing", async () => {
      const req = createMockRequest("POST", { subject: "Test" }); // missing htmlContent
      req.query = { action: "send-digest" };
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Subject and HTML are required." });
    });

    it("returns error if no subscribers found", async () => {
      const mockCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
      };
      (connectToDatabase as any).mockResolvedValue({ 
        db: { collection: vi.fn().mockReturnValue(mockCollection) } 
      });

      const req = createMockRequest("POST", { subject: "Test", htmlContent: "<p>Test</p>" });
      req.query = { action: "send-digest" };
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "No subscribers found." });
    });

    it("sends batch emails successfully", async () => {
      const mockSubscribers = [{ email: "test1@example.com" }, { email: "test2@example.com" }];
      const mockCollection = {
        find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue(mockSubscribers) })
      };
      (connectToDatabase as any).mockResolvedValue({ 
        db: { collection: vi.fn().mockReturnValue(mockCollection) } 
      });
      const { sendBatchEmails } = await import("../server/_mailer");

      const req = createMockRequest("POST", { subject: "Weekly Digest", htmlContent: "<p>Digest content</p>" });
      req.query = { action: "send-digest" };
      const res = createMockResponse();

      await handler(req, res);

      expect(sendBatchEmails).toHaveBeenCalledWith([
        { to: "test1@example.com", subject: "Weekly Digest", html: "<p>Digest content</p>" },
        { to: "test2@example.com", subject: "Weekly Digest", html: "<p>Digest content</p>" }
      ]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Digest sent to 2 subscribers!" });
    });
  });
});
