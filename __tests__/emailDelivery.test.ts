import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createUnsubscribeUrl, verifyUnsubscribeToken } from "../server/utils/unsubscribe";
import { buildSubscriberEmail, emailToText } from "../server/utils/emailTemplate";
import { welcomeMessage } from "../server/utils/welcomeJourney";
import { buildDigestEmail } from "../server/utils/digestEmail";
import { GMAIL_INBOX_GUIDANCE } from "../src/app/lib/newsletterDelivery";
import { GET, POST } from "../app/api/unsubscribe/route";
const { updateOne } = vi.hoisted(() => ({ updateOne: vi.fn() }));
vi.mock("../server/_db", () => ({ connectToDatabase: vi.fn(async () => ({ db: { collection: () => ({ updateOne }) } })) }));
beforeEach(() => { vi.stubEnv("JWT_SECRET", "test-secret-for-unsubscribe"); updateOne.mockReset(); updateOne.mockResolvedValue({ matchedCount: 1 }); });

afterEach(() => vi.unstubAllEnvs());

describe("subscriber email content", () => {
  it("includes readable links and a recipient-specific unsubscribe in both alternatives", () => {
    const result = buildSubscriberEmail({ email: "reader@example.com", title: "Football & tactics", content: '<p>A useful <a href="https://example.com/lesson">lesson</a>.</p>' });
    expect(result.text).toContain("https://example.com/lesson");
    expect(result.text).toContain(result.unsubscribeUrl);
    expect(result.html).toContain(result.unsubscribeUrl);
    expect(result.html).not.toContain("fonts.googleapis.com");
    expect(result.html).toContain("Football &amp; tactics");
  });
  it("keeps the first welcome guidance and the weekly opinion-and-lesson sections", () => {
    const reading = { opinion: { title: "An opinion", href: "/post/opinion", excerpt: "The argument", date: "2026-10-06" }, explainer: { title: "A lesson", href: "/post/lesson", excerpt: "The explanation", date: "2026-10-06" } };
    const first = welcomeMessage(0, "reader@example.com", reading);
    expect(first.text).toContain(GMAIL_INBOX_GUIDANCE);
    expect(first.text).toContain("Hit reply");
    expect(welcomeMessage(1, "reader@example.com", reading).text).not.toContain(GMAIL_INBOX_GUIDANCE);
    const digest = buildDigestEmail("reader@example.com", reading, "Weekly Whistle");
    for (const label of ["One strong opinion", "One useful lesson", "An opinion", "A lesson"]) expect(digest.text).toContain(label);
    expect(digest.html.match(/<img/g)).toBeNull();
  });
  it("preserves lists and removes styles, scripts, and hidden preview text", () => {
    const text = emailToText('<style>bad css</style><script>bad js</script><div data-email-preview="true">Hidden preview</div><ul><li>First &amp; second</li></ul>');
    expect(text).toContain("First & second");
    expect(text).not.toMatch(/bad css|bad js|Hidden preview/);
  });
});
describe("signed unsubscribe", () => {
  it("normalizes and binds the token to its recipient, rejecting tampering", () => {
    const token = new URL(createUnsubscribeUrl("Reader@Example.com")).searchParams.get("token")!;
    expect(verifyUnsubscribeToken(token)).toBe("reader@example.com");
    expect(verifyUnsubscribeToken(token + "x")).toBeNull();
    expect(verifyUnsubscribeToken(Buffer.from("another@example.com").toString("base64url") + "." + token.split(".")[1])).toBeNull();
    expect(verifyUnsubscribeToken("invalid")).toBeNull();
  });
  it("fails closed without a signing secret", () => {
    vi.stubEnv("JWT_SECRET", "");
    expect(() => createUnsubscribeUrl("reader@example.com")).toThrow();
  });
  it("GET only renders confirmation; provider POST needs neither cookies nor login", async () => {
    const url = createUnsubscribeUrl("reader@example.com");
    const get = await GET(new NextRequest(url));
    expect(get.status).toBe(200);
    expect(await get.text()).toContain('method="post"');
    expect(updateOne).not.toHaveBeenCalled();
    for (let i = 0; i < 2; i++) {
      const result = await POST(new NextRequest(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "List-Unsubscribe=One-Click" }));
      expect(result.status).toBe(200);
    }
    expect(updateOne).toHaveBeenCalledWith({ email: "reader@example.com", status: { $ne: "unsubscribed" } }, expect.objectContaining({ $set: expect.objectContaining({ status: "unsubscribed", "preferences.digest": false, "preferences.newArticles": false }) }));
  });
  it("accepts multipart provider requests and exposes retryable database failure", async () => {
    const form = new FormData(); form.set("List-Unsubscribe", "One-Click");
    const url = createUnsubscribeUrl("reader@example.com");
    expect((await POST(new NextRequest(url, { method: "POST", body: form }))).status).toBe(200);
    updateOne.mockRejectedValueOnce(new Error("Database unavailable"));
    expect((await POST(new NextRequest(url, { method: "POST", body: form }))).status).toBe(503);
  });
  it("rejects invalid tokens and malformed POSTs without mutating subscribers", async () => {
    expect((await POST(new NextRequest("https://example.com/api/unsubscribe?token=bad", { method: "POST", body: "List-Unsubscribe=One-Click", headers: { "content-type": "application/x-www-form-urlencoded" } }))).status).toBe(400);
    expect((await POST(new NextRequest(createUnsubscribeUrl("reader@example.com"), { method: "POST", body: "" }))).status).toBe(400);
    expect(updateOne).not.toHaveBeenCalled();
  });
});
