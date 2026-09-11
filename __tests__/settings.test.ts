import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/settings";
import { connectToDatabase } from "../server/_db";
import { applyCors, checkRateLimit, requireAuth } from "../server/utils/security";

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
    headers: {}
  } as unknown as VercelRequest;
}

describe("Settings API Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (checkRateLimit as any).mockReturnValue(true);
    (requireAuth as any).mockResolvedValue(true);
  });

  it("handles OPTIONS request", async () => {
    const req = createMockRequest("OPTIONS");
    const res = createMockResponse();

    await handler(req, res);

    expect(applyCors).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });

  it("GET returns settings with defaults applied if empty", async () => {
    const mockCollection = {
      findOne: vi.fn().mockResolvedValue(null)
    };
    (connectToDatabase as any).mockResolvedValue({
      db: { collection: vi.fn().mockReturnValue(mockCollection) }
    });

    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const settings = (res.json as any).mock.calls[0][0];
    expect(settings).toBeDefined();
    expect(settings.socialWallEnabled).toBe(false);
  });

  it("GET returns existing settings normalized", async () => {
    const mockCollection = {
      findOne: vi.fn().mockResolvedValue({
        _id: "site-settings",
        socialWallEnabled: true,
        socialWallTitle: "Test Wall"
      })
    };
    (connectToDatabase as any).mockResolvedValue({
      db: { collection: vi.fn().mockReturnValue(mockCollection) }
    });

    const req = createMockRequest("GET");
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const settings = (res.json as any).mock.calls[0][0];
    expect(settings.socialWallEnabled).toBe(true);
    expect(settings.socialWallTitle).toBe("Test Wall");
  });

  it("PUT updates settings when authenticated", async () => {
    const mockCollection = {
      findOne: vi.fn().mockResolvedValue({ _id: "site-settings", socialWallEnabled: false }),
      updateOne: vi.fn().mockResolvedValue({})
    };
    (connectToDatabase as any).mockResolvedValue({
      db: { collection: vi.fn().mockReturnValue(mockCollection) }
    });

    const req = createMockRequest("PUT", { socialWallEnabled: true });
    const res = createMockResponse();

    await handler(req, res);

    expect(requireAuth).toHaveBeenCalled();
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { _id: "site-settings" },
      { $set: expect.objectContaining({ socialWallEnabled: true }) },
      { upsert: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("PUT returns 401 when not authenticated (mocked by requireAuth)", async () => {
    (requireAuth as any).mockImplementationOnce(async (req: any, res: any) => {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    });

    const mockCollection = {
      findOne: vi.fn(),
      updateOne: vi.fn()
    };
    (connectToDatabase as any).mockResolvedValue({
      db: { collection: vi.fn().mockReturnValue(mockCollection) }
    });

    const req = createMockRequest("PUT", { socialWallEnabled: true });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockCollection.updateOne).not.toHaveBeenCalled();
  });
});
