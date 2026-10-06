import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifySubscribersAboutPost } from "../server/lib/postNotifications";
import { sendBatchEmails } from "../server/_mailer";
vi.mock("../server/_mailer", () => ({ sendBatchEmails: vi.fn(), isMailerConfigured: () => true }));
beforeEach(() => { vi.stubEnv("JWT_SECRET", "test-unsubscribe-secret"); vi.clearAllMocks(); });
describe("article notification subscription preferences", () => {
  it("queries opted-in readers and creates different unsubscribe links for each", async () => {
    const find = vi.fn(() => ({ toArray: async () => [{ email: "one@example.com" }, { email: "two@example.com" }] }));
    await notifySubscribersAboutPost({ collection: () => ({ find }) }, { id: "post", title: "An opinion", excerpt: "A football argument" });
    expect(find).toHaveBeenCalledWith({ status: { $ne: "unsubscribed" }, "preferences.newArticles": { $ne: false } });
    const messages = vi.mocked(sendBatchEmails).mock.calls[0][0];
    expect(messages[0].unsubscribeUrl).not.toBe(messages[1].unsubscribeUrl);
    for (const message of messages) {
      expect(message.text).toContain("A football argument");
      expect(message.text).toContain(message.unsubscribeUrl);
      expect(message.html).toContain(message.unsubscribeUrl);
    }
  });
});
