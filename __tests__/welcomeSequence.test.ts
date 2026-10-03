import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../server/endpoints/welcome-sequence";
import { connectToDatabase } from "../server/_db";
import { sendEmail, isMailerConfigured } from "../server/_mailer";
import { requireAuth } from "../server/utils/security";
vi.mock("../server/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/_mailer", () => ({ sendEmail: vi.fn(), isMailerConfigured: vi.fn() }));
vi.mock("../server/utils/security", () => ({ requireAuth: vi.fn(), checkOrigin: vi.fn(() => true) }));
const res = () => { const r: any = {}; r.status = vi.fn(() => r); r.json = vi.fn(() => r); return r; };
const req = (headers = { authorization: "Bearer test-secret" }) => ({ method: "GET", headers, query: {} } as any);
function setup(subs: any[] = []) {
  const updateOne = vi.fn(); const insertOne = vi.fn();
  const findOne = vi.fn(async ({ _id }: any) => subs.find(s => s._id === _id));
  vi.mocked(connectToDatabase).mockResolvedValue({ db: { collection: (name: string) => name === "posts"
    ? { find: () => ({ toArray: async () => [] }) }
    : { find: () => ({ toArray: async () => subs }), findOne, updateOne, insertOne } } } as any);
  return { updateOne, findOne };
}
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("CRON_SECRET", "test-secret"); vi.mocked(isMailerConfigured).mockReturnValue(true); vi.mocked(sendEmail).mockResolvedValue(undefined); });
afterEach(() => vi.unstubAllEnvs());
const subscriber = (stage: number) => ({ _id: "reader", email: "reader@example.com", welcomeSequenceState: stage, subscribedAt: "2025-01-01", welcomeLastSentAt: "2025-01-02" });
describe("welcome journey dispatch", () => {
  it("rejects spoofed cron headers and unauthenticated manual sends before database access", async () => {
    const response = res(); await handler(req({ "x-vercel-cron": "true" } as any), response);
    expect(response.status).toHaveBeenCalledWith(401);
    vi.mocked(requireAuth).mockResolvedValue(false);
    await handler({ ...req(), method: "POST" }, res());
    expect(connectToDatabase).not.toHaveBeenCalled();
  });
  it("rejects unsupported methods and unconfigured email", async () => {
    const response = res(); await handler({ ...req(), method: "DELETE" }, response);
    expect(response.status).toHaveBeenCalledWith(405);
    vi.mocked(isMailerConfigured).mockReturnValue(false);
    await handler(req(), response); expect(response.status).toHaveBeenCalledWith(500);
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it.each([0, 1, 2])("sends stage %s once and advances only after provider acceptance", async stage => {
    const { updateOne } = setup([subscriber(stage)]);
    await handler(req(), res());
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "reader@example.com", idempotencyKey: `welcome-reader-${stage}` }));
    expect(updateOne).toHaveBeenCalledWith({ _id: "reader", welcomeSequenceState: stage }, { $set: { welcomeSequenceState: stage + 1, welcomeLastSentAt: expect.any(String) } });
  });
  it("keeps failed sends retryable and reports partial failure", async () => {
    const { updateOne } = setup([subscriber(1)]);
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("provider rejected"));
    const response = res(); await handler(req(), response);
    expect(updateOne).not.toHaveBeenCalledWith(expect.objectContaining({ _id: "reader" }), expect.anything());
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, failed: 1, day1EmailsSent: 0 }));
  });
  it("skips a reader who unsubscribes before dispatch", async () => {
    const { findOne } = setup([subscriber(1)]); findOne.mockResolvedValueOnce(undefined);
    await handler(req(), res()); expect(sendEmail).not.toHaveBeenCalled();
  });
  it("does not send the next stage within 24 hours of a delayed welcome", async () => {
    setup([{ ...subscriber(1), welcomeLastSentAt: new Date().toISOString() }]);
    await handler(req(), res()); expect(sendEmail).not.toHaveBeenCalled();
  });
});
