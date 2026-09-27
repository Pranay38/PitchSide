import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/growth-events";
import { connectToDatabase } from "../server/_db";
import { checkOrigin, checkRateLimit } from "../server/utils/security";

vi.mock("../server/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/utils/security", () => ({
  applyCors: vi.fn(),
  checkOrigin: vi.fn().mockReturnValue(true),
  checkRateLimit: vi.fn().mockReturnValue(true),
  sanitizeString: vi.fn((value) => typeof value === "string" ? value.trim() : null),
}));

function response() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function request(body: unknown): VercelRequest {
  return { method: "POST", body, headers: {}, query: {} } as unknown as VercelRequest;
}

describe("growth events endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue(true);
    vi.mocked(checkOrigin).mockReturnValue(true);
  });

  it("records a valid CTA event", async () => {
    const insertOne = vi.fn().mockResolvedValue({ insertedId: "event-1" });
    vi.mocked(connectToDatabase).mockResolvedValue({ db: { collection: vi.fn(() => ({ insertOne })) } } as any);
    const res = response();

    await handler(request({ event: "cta_subscribe", postId: "post-1", readerState: "guest" }), res);

    expect(insertOne).toHaveBeenCalledWith(expect.objectContaining({
      event: "cta_subscribe",
      postId: "post-1",
      readerState: "guest",
      createdAt: expect.any(Date),
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("rejects unknown events", async () => {
    const res = response();
    await handler(request({ event: "arbitrary", postId: "post-1", readerState: "guest" }), res);
    expect(connectToDatabase).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
