import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const { preferences } = vi.hoisted(() => ({ preferences: { loading: false, newsletterOptIn: false, setNewsletterOptIn: vi.fn() } }));
vi.mock("../src/app/hooks/useUserPreferences", () => ({ useUserPreferences: () => preferences }));
vi.mock("../src/app/hooks/useNewsletterTracking", () => ({ useNewsletterTracking: () => ({ subscribe: vi.fn(), exposureRef: vi.fn() }) }));
import { OneLineNewsletter } from "../src/app/components/OneLineNewsletter";
// Existing Vitest config uses classic JSX for TSX modules without an explicit React import.
vi.stubGlobal("React", React);
describe("standalone newsletter states", () => {
  it("renders an accessible email form for a guest", () => {
    preferences.loading = false; preferences.newsletterOptIn = false;
    const html = renderToStaticMarkup(React.createElement(OneLineNewsletter));
    expect(html).toContain('aria-label="Email address"'); expect(html).toContain('type="email"');
    expect(html).toContain("The Weekly Whistle"); expect(html).not.toContain("move it to Primary");
  });
  it("shows a loading state instead of prematurely saying subscribed", () => {
    preferences.loading = true;
    const html = renderToStaticMarkup(React.createElement(OneLineNewsletter));
    expect(html).not.toContain("move it to Primary"); expect(html).toContain("Checking your subscription"); expect(html).not.toContain('<form');
  });
  it("offers an actual next article to an existing subscriber", () => {
    preferences.loading = false; preferences.newsletterOptIn = true;
    const html = renderToStaticMarkup(React.createElement(OneLineNewsletter, { nextArticle: { href: "/post/midfield", title: "Understanding midfield" } }));
    expect(html).toContain("move it to Primary"); expect(html).toContain("You’re subscribed"); expect(html).toContain('href="/post/midfield"'); expect(html).not.toContain('<form');
  });
});
