import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";
import { createStoryEmailJob, deliverStoryEmails, storyEmail, storyEmailStatus } from "../server/lib/storyNotifications";
import handler from "../_api/stories";
import { connectToDatabase } from "../_api/_db";
import { isMailerConfigured, sendEmail } from "../server/_mailer";
import { requireAuth } from "../server/utils/security";

vi.mock("../_api/_db", () => ({ connectToDatabase: vi.fn() }));
vi.mock("../server/_mailer", () => ({ sendEmail: vi.fn(), isMailerConfigured: vi.fn() }));
vi.mock("../server/utils/security", () => ({ applyCors: vi.fn(), checkRateLimit: () => true, requireAuth: vi.fn() }));

// Stateful Mongo double: exercise atomic conditions and persisted retry behavior,
// rather than accepting every update regardless of its filter.
function database() {
  const tables: Record<string, any[]> = {};
  const get = (row: any, path: string): any => path.split(".").reduce((value, key) => value?.[key], row);
  function matches(row: any, query: any): boolean {
    return Object.entries(query).every(([key, value]: [string, any]) => {
      if (key === "$or") return value.some((q: any) => matches(row, q));
      if (key === "$and") return value.every((q: any) => matches(row, q));
      const actual = get(row, key);
      if (value === null) return actual == null;
      if (value && typeof value === "object" && !(value instanceof Date)) return Object.entries(value).every(([op, operand]: [string, any]) => {
        if (op === "$ne") return actual !== operand;
        if (op === "$exists") return (actual !== undefined) === operand;
        if (op === "$in") return operand.includes(actual);
        if (op === "$lt") return actual < operand;
        return false;
      });
      return actual === value;
    });
  }
  function set(row: any, key: string, value: any, remove = false) {
    const parts = key.split("."); const last = parts.pop()!;
    let target = row;
    for (const part of parts) target = target[part] ||= {};
    if (remove) delete target[last]; else target[last] = structuredClone(value);
  }
  function update(row: any, change: any, inserting = false) {
    for (const [key, value] of Object.entries({ ...(inserting ? change.$setOnInsert : {}), ...change.$set })) set(row, key, value);
    for (const key of Object.keys(change.$unset || {})) set(row, key, undefined, true);
  }
  const db = { collection(name: string) {
    const rows = tables[name] ||= [];
    return {
      find(query: any = {}) {
        let result = rows.filter(row => matches(row, query));
        const cursor = { sort: () => cursor, limit: (n: number) => { result = result.slice(0, n); return cursor; }, toArray: async () => structuredClone(result) };
        return cursor;
      },
      findOne: async (query: any) => structuredClone(rows.find(row => matches(row, query)) || null),
      async insertOne(row: any) { if (rows.some(r => r._id === row._id)) throw Object.assign(new Error("duplicate"), { code: 11000 }); rows.push(structuredClone(row)); return { insertedId: row._id }; },
      async updateOne(query: any, change: any, options?: any) {
        let row = rows.find(row => matches(row, query)); let inserting = false;
        if (!row && options?.upsert) { row = { ...query }; rows.push(row); inserting = true; }
        if (!row) return { modifiedCount: 0 };
        update(row, change, inserting); return { modifiedCount: 1 };
      },
      async findOneAndUpdate(query: any, change: any) { const row = rows.find(row => matches(row, query)); if (!row) return null; update(row, change); return structuredClone(row); },
      countDocuments: async (query: any) => rows.filter(row => matches(row, query)).length,
      aggregate(pipeline: any[]) { const counts: Record<string, number> = {}; rows.filter(row => matches(row, pipeline[0].$match)).forEach(row => { counts[row.state] = (counts[row.state] || 0) + 1; }); return { toArray: async () => Object.entries(counts).map(([_id, count]) => ({ _id, count })) }; },
    };
  } } as unknown as Db;
  return { db, tables };
}
let db: Db, tables: Record<string, any[]>;
const content = { id: "story-1", slug: "a-match", title: "A match", excerpt: "Football", isDraft: false };
async function request(method: string, body?: any, query = {}) {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), end: vi.fn(), setHeader: vi.fn() };
  await handler({ method, body, query, headers: {} } as any, res);
  return res;
}
function seedJob() { tables.stories = [{ ...content, publicationEmail: createStoryEmailJob(content) }]; }
beforeEach(() => {
  vi.stubEnv("JWT_SECRET", "story-test-signing-secret");
  ({ db, tables } = database());
  vi.mocked(connectToDatabase).mockResolvedValue({ db } as any);
  vi.mocked(requireAuth).mockResolvedValue(true);
  vi.mocked(isMailerConfigured).mockReturnValue(true);
  vi.mocked(sendEmail).mockReset().mockResolvedValue();
  tables.subscribers = [{ email: "reader@example.com", subscribedAt: "2020-01-01" }];
});

describe("story publication emails", () => {
  it("sends on direct publication with a canonical story link", async () => {
    const res = await request("POST", content);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendEmail).mock.calls[0][0].html).toContain("/stories/a-match");
    expect(await storyEmailStatus(db, content.id)).toMatchObject({ state: "complete", accepted: 1 });
  });
  it("sends once when concurrent saves first publish a draft", async () => {
    await request("POST", { ...content, isDraft: true });
    expect(sendEmail).not.toHaveBeenCalled();
    await Promise.all([request("PUT", content), request("PUT", content)]);
    await request("PUT", { ...content, title: "Edited" });
    await request("PUT", { ...content, isDraft: true });
    await request("PUT", content);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("does not backfill legacy publications or broadcast their republishing", async () => {
    tables.stories = [{ ...content }];
    await request("PUT", { ...content, isDraft: true });
    await request("PUT", content);
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it("rejects client-controlled state, including dotted field writes", async () => {
    for (const override of [{ publicationEmail: {} }, { everPublished: false }, { "publicationEmail.completedAt": null }]) {
      const res = await request("POST", { ...content, ...override });
      expect(res.status).toHaveBeenCalledWith(400);
    }
  });
  it("requires admin authentication for retries and status", async () => {
    vi.mocked(requireAuth).mockResolvedValue(false);
    await request("POST", undefined, { action: "retry-emails", id: content.id });
    await request("GET", undefined, { action: "email-status", id: content.id });
    expect(requireAuth).toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it("filters opt-outs and subscribers who joined after publication", async () => {
    seedJob();
    tables.subscribers.push({ email: "off@example.com", preferences: { newArticles: false } }, { email: "gone@example.com", status: "unsubscribed" }, { email: "later@example.com", subscribedAt: "2099-01-01" });
    await deliverStoryEmails(db, content.id);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "reader@example.com" }));
  });
  it("keeps publication successful with no mail configuration and supports retry", async () => {
    vi.mocked(isMailerConfigured).mockReturnValue(false);
    expect((await request("POST", content)).status).toHaveBeenCalledWith(201);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(await storyEmailStatus(db, content.id)).toMatchObject({ state: "pending", error: expect.stringContaining("not configured") });
    vi.mocked(isMailerConfigured).mockReturnValue(true);
    await deliverStoryEmails(db, content.id);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("retries only failed recipients with stable payloads and keys", async () => {
    seedJob(); tables.subscribers.push({ email: "second@example.com" });
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("timeout"));
    await deliverStoryEmails(db, content.id);
    const first = vi.mocked(sendEmail).mock.calls[0][0];
    tables.stories[0].title = "Edited after publishing";
    await Promise.all([deliverStoryEmails(db, content.id), deliverStoryEmails(db, content.id)]);
    expect(sendEmail).toHaveBeenCalledTimes(3);
    expect(vi.mocked(sendEmail).mock.calls[2][0]).toEqual(first);
    expect(await storyEmailStatus(db, content.id)).toMatchObject({ accepted: 2, pending: 0, failed: 0 });
  });
  it("rechecks preferences on retries and pauses unpublished stories", async () => {
    seedJob(); vi.mocked(sendEmail).mockRejectedValueOnce(new Error("timeout"));
    await deliverStoryEmails(db, content.id);
    tables.stories[0].isDraft = true;
    await deliverStoryEmails(db, content.id);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    tables.stories[0].isDraft = false;
    tables.subscribers[0].preferences = { newArticles: false };
    await deliverStoryEmails(db, content.id);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(await storyEmailStatus(db, content.id)).toMatchObject({ skipped: 1 });
  });
  it("does not resend ambiguous attempts after the provider deduplication window", async () => {
    seedJob(); vi.mocked(sendEmail).mockRejectedValueOnce(new Error("timeout"));
    await deliverStoryEmails(db, content.id);
    tables.story_email_deliveries[0].firstAttemptAt = "2020-01-01";
    await deliverStoryEmails(db, content.id);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(await storyEmailStatus(db, content.id)).toMatchObject({ review: 1 });
  });
  it("escapes content and provides a recipient-specific unsubscribe link", () => {
    const message = storyEmail(createStoryEmailJob({ ...content, title: '<img src=x onerror="bad">', excerpt: "A & B" }), "reader+tag@example.com");
    expect(message.html).not.toContain('<img src=x');
    expect(message.html).toContain("&lt;img");
    expect(message.html).toContain("A &amp; B");
    expect(message.unsubscribeUrl).toContain("/api/unsubscribe?token=");
    expect(message.html).toContain(message.unsubscribeUrl);
  });
});
