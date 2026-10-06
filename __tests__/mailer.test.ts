import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { send, batchSend } = vi.hoisted(() => ({ send: vi.fn(), batchSend: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send }; batch = { send: batchSend }; } }));
beforeEach(() => { vi.resetModules(); vi.stubEnv("RESEND_API_KEY", "test-key"); send.mockReset(); batchSend.mockReset(); });
afterEach(() => vi.unstubAllEnvs());
describe("email provider acknowledgement", () => {
  it("throws on a resolved provider error instead of falsely reporting success", async () => {
    send.mockResolvedValue({ data: null, error: { message: "invalid sender" } });
    const { sendEmail } = await import("../server/_mailer");
    await expect(sendEmail({ to: "test@example.com", subject: "test", html: "test" })).rejects.toThrow("invalid sender");
  });
  it("passes a stable idempotency key to the provider", async () => {
    send.mockResolvedValue({ data: { id: "email" }, error: null });
    const { sendEmail } = await import("../server/_mailer");
    await sendEmail({ to: "test@example.com", subject: "test", html: "test", idempotencyKey: "welcome-1-0" });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: ["test@example.com"] }), { idempotencyKey: "welcome-1-0" });
  });
  it("reports batch rejection and missing configuration", async () => {
    batchSend.mockResolvedValue({ error: { message: "batch rejected" } });
    const { sendBatchEmails } = await import("../server/_mailer");
    await expect(sendBatchEmails([{ to: "test@example.com", subject: "test", html: "test" }])).rejects.toThrow("batch rejected");
    vi.resetModules(); vi.stubEnv("RESEND_API_KEY", "");
    const { sendEmail } = await import("../server/_mailer");
    await expect(sendEmail({ to: "test@example.com", subject: "test", html: "test" })).rejects.toThrow("not configured");
  });
});


describe("subscriber delivery headers", () => {
  it("sets the approved identity, reply inbox, text, and one-click headers in single and batch sends", async () => {
    send.mockResolvedValue({ error: null }); batchSend.mockResolvedValue({ error: null });
    const { sendEmail, sendBatchEmails } = await import("../server/_mailer");
    const message = { to: "reader@example.com", subject: "Weekly Whistle", html: "<p>Hello</p>", text: "Hello", unsubscribeUrl: "https://www.thetouchlinedribble.in/api/unsubscribe?token=signed" };
    await sendEmail(message); await sendBatchEmails([message]);
    const expected = expect.objectContaining({ from: "Pranay at The Touchline Dribble <noreply@thetouchlinedribble.in>", replyTo: "thetouchlinedribble@gmail.com", text: "Hello", html: "<p>Hello</p>", headers: { "List-Unsubscribe": `<${message.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
    expect(send).toHaveBeenCalledWith(expected, undefined);
    expect(batchSend).toHaveBeenCalledWith([expected]);
  });
});
