import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../server/endpoints/welcome-sequence";
import { connectToDatabase } from "../server/_db";
import { isMailerConfigured } from "../server/_mailer";

vi.mock("../server/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/_mailer", () => ({
  sendBatchEmails: vi.fn().mockResolvedValue(undefined),
  isMailerConfigured: vi.fn().mockReturnValue(true)
}));

describe("debug", () => {
  it("captures error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSubCol = {
      find: vi.fn().mockImplementation(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
    };
    const mockCronCol = { updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }) };
    const mockDb = {
      collection: vi.fn().mockImplementation((n: string) => n === "cron_logs" ? mockCronCol : mockSubCol),
    };
    (connectToDatabase as any).mockResolvedValue({ db: mockDb });

    const req = { method: "GET", body: {}, query: {}, headers: { "x-vercel-cron": "true" } } as unknown as VercelRequest;
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.setHeader = vi.fn().mockReturnValue(res);

    await handler(req, res);
    
    if (errSpy.mock.calls.length > 0) {
      console.log("CAPTURED ERROR:", errSpy.mock.calls[0][0], String(errSpy.mock.calls[0][1]));
    }
    console.log("STATUS:", res.status.mock.calls);
    errSpy.mockRestore();
  });
});
