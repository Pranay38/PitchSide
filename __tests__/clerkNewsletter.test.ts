import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "../app/api/webhooks/clerk/route";
const mocks = vi.hoisted(() => ({ verify: vi.fn(), findOne: vi.fn(), updateOne: vi.fn(), send: vi.fn() }));
vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook: mocks.verify }));
vi.mock("../server/_db", () => ({ connectToDatabase: async () => ({ db: { collection: () => ({ findOne: mocks.findOne, updateOne: mocks.updateOne }) } }) }));
vi.mock("../server/_mailer", () => ({ sendEmail: mocks.send, isMailerConfigured: () => true }));
vi.mock("../server/utils/welcomeJourney", () => ({ loadWelcomeReading: async () => ({}), welcomeMessage: () => ({ to: "reader@example.com", subject: "Welcome", html: "Welcome", text: "Welcome" }) }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", "test-webhook-secret");
  mocks.verify.mockResolvedValue({ type: "user.created", data: { primary_email_address_id: "primary", email_addresses: [{ id: "primary", email_address: "Reader@example.com" }] } });
  mocks.findOne.mockResolvedValue(null);
  mocks.send.mockResolvedValue(undefined);
});
it("rejects unsigned requests before looking up or emailing readers", async () => {
  mocks.verify.mockRejectedValueOnce(new Error("Bad signature"));
  expect((await POST(new NextRequest("https://example.com", { method: "POST" }))).status).toBe(400);
  expect(mocks.findOne).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
});
it("does not enroll account holders or send to opted-out or already-welcomed readers", async () => {
  await POST(new NextRequest("https://example.com", { method: "POST" }));
  expect(mocks.findOne).toHaveBeenCalledWith({ email: "reader@example.com", status: { $ne: "unsubscribed" }, welcomeSequenceState: 0 });
  expect(mocks.updateOne).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
});
it("uses the shared welcome idempotency key for a pending opted-in reader", async () => {
  mocks.findOne.mockResolvedValue({ _id: "reader", email: "reader@example.com", welcomeSequenceState: 0 });
  expect((await POST(new NextRequest("https://example.com", { method: "POST" }))).status).toBe(200);
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: "welcome-reader-0" }));
  expect(mocks.updateOne).toHaveBeenCalledWith(expect.objectContaining({ status: { $ne: "unsubscribed" }, welcomeSequenceState: 0 }), { $set: expect.objectContaining({ welcomeSequenceState: 1 }) });
});
it("keeps provider failures retryable without advancing the sequence", async () => {
  mocks.findOne.mockResolvedValue({ _id: "reader", email: "reader@example.com" });
  mocks.send.mockRejectedValueOnce(new Error("Provider unavailable"));
  expect((await POST(new NextRequest("https://example.com", { method: "POST" }))).status).toBe(503);
  expect(mocks.updateOne).not.toHaveBeenCalled();
});
