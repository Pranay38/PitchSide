import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it, vi } from "vitest";
import { OfflineIndicator } from "../src/app/components/OfflineIndicator";
import { articleAuthor, EDITOR_ID, PUBLICATION_ID, publicationPublisher, serializeJsonLd, validContentDate } from "../src/app/lib/publication";

vi.stubGlobal("React", React);
afterAll(() => vi.unstubAllGlobals());

describe("public publication identity", () => {
  it("does not attribute guest writers to the founder's identity", () => {
    expect(articleAuthor()["@id"]).toBe(EDITOR_ID);
    expect(articleAuthor("Guest writer")).toEqual({ "@type": "Person", name: "Guest writer" });
    expect(publicationPublisher["@id"]).toBe(PUBLICATION_ID);
  });
  it("serializes user-controlled titles without terminating a JSON-LD script", () => {
    const title = "A </script><script>alert(1)</script> title";
    const result = serializeJsonLd({ headline: title });
    expect(result).not.toContain("</script>");
    expect(JSON.parse(result).headline).toBe(title);
  });
  it("omits unknown and invalid dates without inventing freshness", () => {
    expect(validContentDate()).toBeUndefined();
    expect(validContentDate("not a date")).toBeUndefined();
    expect(validContentDate("2026-10-09")?.toISOString()).toBe("2026-10-09T00:00:00.000Z");
  });
  it("renders the offline utility without browser globals", () => {
    vi.stubGlobal("navigator", undefined);
    expect(() => renderToStaticMarkup(React.createElement(OfflineIndicator))).not.toThrow();
  });
});
