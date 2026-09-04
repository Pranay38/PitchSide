import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import analyticsHandler from "../server/endpoints/analytics";
import { connectToDatabase } from "../server/_db";
import { applyCors, checkRateLimit, requireAuth } from "../server/utils/security";

vi.mock("../server/_db", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({ db: { collection: vi.fn() } })
}));

vi.mock("../server/utils/security", () => ({
  applyCors: vi.fn(),
  checkRateLimit: vi.fn().mockReturnValue(true),
  requireAuth: vi.fn().mockResolvedValue(true)
}));

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function mockReq(method: string): VercelRequest {
  return { method, body: {}, query: {}, headers: {} } as unknown as VercelRequest;
}

describe("Auth Gate Tests", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should reject unauthenticated requests", async () => {
    (requireAuth as any).mockResolvedValue(false);
    const res = mockRes();
    await analyticsHandler(mockReq("GET"), res);
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({ kpis: expect.any(Object) }));
  });

  it("should reject non-GET methods with 405", async () => {
    const res = mockRes();
    await analyticsHandler(mockReq("POST"), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("should handle OPTIONS for CORS preflight", async () => {
    const res = mockRes();
    await analyticsHandler(mockReq("OPTIONS"), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(applyCors).toHaveBeenCalled();
  });

  it("should return early when rate limit exceeded", async () => {
    (checkRateLimit as any).mockReturnValue(false);
    const res = mockRes();
    await analyticsHandler(mockReq("GET"), res);
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it("should return generic error on 500 (no internal leak)", async () => {
    (checkRateLimit as any).mockReturnValue(true);
    (requireAuth as any).mockResolvedValue(true);
    (connectToDatabase as any).mockRejectedValue(new Error("MongoDB creds invalid"));
    const res = mockRes();
    await analyticsHandler(mockReq("GET"), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
