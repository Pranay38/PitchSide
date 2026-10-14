/** Shared public identity; internal legacy storage keys are intentionally unchanged. */
export const PUBLICATION_NAME = "The Touchline Dribble";
export const PUBLICATION_URL = "https://www.thetouchlinedribble.in";
export const PUBLICATION_DESCRIPTION = "The Touchline Dribble is an independent football publication offering evidence-backed opinions and plain-English explainers on tactics, transfers, rules, and the decisions shaping the game.";
export const PUBLICATION_ID = `${PUBLICATION_URL}/#publication`;
export const WEBSITE_ID = `${PUBLICATION_URL}/#website`;
export const EDITOR_ID = `${PUBLICATION_URL}/about#pranay-agrawal`;

export function articleAuthor(name?: string) {
  const author = name?.trim() || "Pranay Agrawal";
  return {
    "@type": "Person",
    name: author,
    ...(author === "Pranay Agrawal"
      ? { "@id": EDITOR_ID, url: `${PUBLICATION_URL}/about` }
      : {}),
  };
}

export const publicationPublisher = {
  "@type": "Organization",
  "@id": PUBLICATION_ID,
  name: PUBLICATION_NAME,
  url: PUBLICATION_URL,
  logo: { "@type": "ImageObject", url: `${PUBLICATION_URL}/logo.png` },
};

export function validContentDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
