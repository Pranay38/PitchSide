import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureCampaign } from "../src/app/lib/campaignAttribution";
import { newsletterSignup } from "../src/app/lib/newsletterSignup";
import { observeExposure } from "../src/app/lib/visibleExposure";
import { newsletterReading } from "../src/app/lib/newsletterReading";
import { selectRelatedReading } from "../src/app/lib/matchdayContent";
import { welcomeMessage } from "../server/utils/welcomeJourney";
import type { BlogPost } from "../src/app/data/posts";

const storage = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
};
let win: any;
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { vi.stubEnv("JWT_SECRET", "test-unsubscribe-secret");
  win = { location: { search: "?utm_source=x&utm_campaign=midfield&utm_content=evidence" }, localStorage: storage(), sessionStorage: storage(), gtag: vi.fn() };
  vi.stubGlobal("window", win);
  fetchMock = vi.fn().mockImplementation(async (url: string) => new Response(JSON.stringify(url === "/api/subscribers" ? { emailSent: true } : { success: true }), { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const events = () => fetchMock.mock.calls.filter(([url]) => url === "/api/growth-events").map(([, options]) => JSON.parse(options.body));
describe("newsletter attribution and outcomes", () => {
  it("retains campaign context across untagged navigation, replacing it on a new campaign", () => {
    captureCampaign();
    win.location.search = "";
    expect(captureCampaign()).toEqual({ utm_source: "x", utm_campaign: "midfield", utm_content: "evidence" });
    win.location.search = "?utm_source=weekly_whistle&utm_medium=email";
    expect(captureCampaign()).toEqual({ utm_source: "weekly_whistle", utm_medium: "email" });
  });
  it("does not retain email query parameters or email-shaped UTM values", () => {
    win.location.search = "?email=reader@example.com&utm_source=reader%40example.com&utm_content=https%3A%2F%2Fprivate.example";
    expect(captureCampaign()).toEqual({});
  });
  it("continues signup when storage is blocked", async () => {
    win.sessionStorage.setItem = () => { throw new Error("blocked"); };
    expect((await newsletterSignup({ email: "reader@example.com" }, { placement: "subscribe_page", readerState: "guest" })).ok).toBe(true);
  });
  it.each(["guest", "signed_in"] as const)("records a new %s signup once without email in analytics", async readerState => {
    captureCampaign(); win.location.search = "";
    await newsletterSignup({ email: "reader@example.com" }, { placement: "subscribe_page", readerState });
    expect(events()).toEqual([expect.objectContaining({ event: "cta_subscribe", placement: "subscribe_page", readerState, campaign: { utm_source: "x", utm_campaign: "midfield", utm_content: "evidence" } })]);
    expect(JSON.stringify(events())).not.toContain("reader@example.com");
    expect(JSON.stringify(win.gtag.mock.calls)).not.toContain("reader@example.com");
  });
  it("separates existing subscribers from new conversions", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ alreadySubscribed: true })));
    await newsletterSignup({ email: "reader@example.com" }, { placement: "footer", readerState: "subscriber" });
    expect(events().map(e => e.event)).toEqual(["cta_already_subscribed"]);
  });
  it("records rejected and network requests as failures", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: "Try again" }), { status: 500 }));
    await newsletterSignup({ email: "reader@example.com" }, { placement: "footer", readerState: "guest" });
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(newsletterSignup({ email: "reader@example.com" }, { placement: "footer", readerState: "guest" })).rejects.toThrow("offline");
    expect(events().map(e => e.event)).toEqual(["cta_subscribe_failed", "cta_subscribe_failed"]);
  });
  it("does not confirm a malformed success response", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not json"));
    await expect(newsletterSignup({ email: "reader@example.com" }, { placement: "footer", readerState: "guest" })).rejects.toThrow("Could not confirm");
    expect(events().map(e => e.event)).toEqual(["cta_subscribe_failed"]);
  });
  it("does not let failed analytics or declined tracking prevent signup", async () => {
    win.gtag = () => { throw new Error("blocked"); };
    const details = { placement: "footer", readerState: "guest" as const };
    expect((await newsletterSignup({ email: "a@b.com" }, details)).ok).toBe(true);
    win.localStorage.setItem("pitchside_cookie_consent", "declined");
    fetchMock.mockClear();
    await newsletterSignup({ email: "a@b.com" }, details);
    expect(events()).toHaveLength(0);
    expect(captureCampaign()).toEqual({});
  });
});

describe("visible CTA exposure", () => {
  let intersect: (entries: any[]) => void;
  let visibility: () => void;
  let doc: any;
  beforeEach(() => {
    vi.useFakeTimers();
    doc = { visibilityState: "visible", addEventListener: vi.fn((_, callback) => { visibility = callback; }), removeEventListener: vi.fn() };
    vi.stubGlobal("document", doc);
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: any) { intersect = callback; }
      observe() {} disconnect() {}
    });
  });
  it("requires 50% continuous visibility for one second and records once", () => {
    const record = vi.fn(); observeExposure({} as Element, record);
    vi.advanceTimersByTime(2000); expect(record).not.toHaveBeenCalled();
    intersect([{ isIntersecting: true, intersectionRatio: 0.49 }]);
    vi.advanceTimersByTime(2000); expect(record).not.toHaveBeenCalled();
    intersect([{ isIntersecting: true, intersectionRatio: 0.5 }]);
    vi.advanceTimersByTime(999); expect(record).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(record).toHaveBeenCalledTimes(1);
    intersect([{ isIntersecting: true, intersectionRatio: 1 }]);
    vi.advanceTimersByTime(3000); expect(record).toHaveBeenCalledTimes(1);
  });
  it("resets the timer after scrolling away or hiding the tab, and cleans up on unmount", () => {
    const record = vi.fn(); const cleanup = observeExposure({} as Element, record);
    intersect([{ isIntersecting: true, intersectionRatio: 1 }]); vi.advanceTimersByTime(600);
    intersect([{ isIntersecting: false, intersectionRatio: 0 }]); vi.advanceTimersByTime(600);
    intersect([{ isIntersecting: true, intersectionRatio: 1 }]); vi.advanceTimersByTime(600);
    doc.visibilityState = "hidden"; visibility(); vi.advanceTimersByTime(1000);
    expect(record).not.toHaveBeenCalled();
    doc.visibilityState = "visible"; visibility(); vi.advanceTimersByTime(999);
    expect(record).not.toHaveBeenCalled();
    cleanup(); vi.advanceTimersByTime(1000); expect(record).not.toHaveBeenCalled();
  });
});

const post = (id: string, extra: Partial<BlogPost> = {}) => ({ id, title: id, date: "2026-01-01", tags: [], ...extra } as BlogPost);
describe("newsletter reading and welcome content", () => {
  it("uses published ungated editorial picks, never drafts or future content", () => {
    const reading = newsletterReading([
      post("draft", { isDraft: true, contentKind: "opinion", editorPick: true }),
      post("future", { publishAt: "2099-01-01", contentKind: "opinion" }),
      post("gated", { gatekeepPoint: 50, contentKind: "opinion" }),
      post("opinion", { contentKind: "opinion", editorial: { backgroundPostId: "explainer" } }),
      post("explainer", { contentKind: "explainer" }),
    ]);
    expect(reading.opinion?.href).toBe("/post/opinion");
    expect(reading.explainer?.href).toBe("/post/explainer");
  });
  it("links an explainer back to an opinion that explicitly references it", () => {
    const explainer = post("explainer", { contentKind: "explainer" });
    expect(selectRelatedReading(explainer, [explainer, post("opinion", { contentKind: "opinion", editorial: { backgroundPostId: "explainer" } })]).perspective?.id).toBe("opinion");
  });
  it.each([0, 1, 2] as const)("stage %s has one tracked primary CTA and an unsubscribe link", stage => {
    const message = welcomeMessage(stage, "reader@example.com", { opinion: undefined, explainer: undefined });
    expect(message.html).toContain("/api/unsubscribe?token=");
    expect((message.html.match(/utm_campaign=welcome/g) || [])).toHaveLength(1);
    expect(message.html).not.toContain("post/football-formations");
  });
});
