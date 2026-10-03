import type { Db } from "mongodb";
import type { BlogPost } from "../../src/app/data/posts";
import { newsletterReading, NEWSLETTER_PROMISE } from "../../src/app/lib/newsletterReading";
import { buildEditorialEmail } from "./emailTemplate";

export const SITE_URL = "https://www.thetouchlinedribble.in";
export async function loadWelcomeReading(db: Pick<Db, "collection">) {
  try {
    const posts = await db.collection("posts").find({ isDraft: { $ne: true }, status: { $ne: "draft" } }).toArray();
    return newsletterReading(posts.map(p => ({ ...p, id: p.id || String(p._id), title: p.title || "", tags: p.tags || [] })) as unknown as BlogPost[]);
  } catch {
    // Reading suggestions must not prevent subscription when the content store is unavailable.
    return { opinion: undefined, explainer: undefined };
  }
}
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));

export function welcomeMessage(stage: 0 | 1 | 2, email: string, reading: ReturnType<typeof newsletterReading>) {
  const chosen = stage === 0 ? reading.opinion : reading.explainer;
  const subject = ["Welcome to The Weekly Whistle", "One useful lesson about football", "Bring your perspective to the debate"][stage];
  const text = [
    `Thanks for joining The Weekly Whistle from The Touchline Dribble. ${NEWSLETTER_PROMISE} Over the next few days, we’ll introduce an opinion, an explainer and a place to share your perspective. Then look out for the weekly edition.`,
    "Good opinions start with understanding the game. Here is an explainer to help you follow the reasoning behind the next big football debate.",
    "You’ve met our writing. Now bring your own perspective: choose a discussion and add an observation or a fair counterargument. Reading the debates is open; contributing may require signing in.",
  ][stage];
  const href = stage === 2 ? "/debates" : chosen?.href || (stage === 0 ? "/archive" : "/learn");
  const label = stage === 2 ? "Explore the debates" : chosen?.title || (stage === 0 ? "Explore our latest writing" : "Find a useful explainer");
  const url = new URL(href, SITE_URL);
  url.search = new URLSearchParams({ utm_source: "weekly_whistle", utm_medium: "email", utm_campaign: "welcome", utm_content: `day_${[0, 1, 3][stage]}` }).toString();
  return {
    to: email,
    subject,
    html: buildEditorialEmail({
      title: subject,
      previewText: stage === 0 ? NEWSLETTER_PROMISE : text,
      unsubscribeUrl: `${SITE_URL}/api/subscribers?action=unsubscribe&email=${encodeURIComponent(email)}`,
      content: `<h2>${escape(subject)}</h2><p>${escape(text)}</p>${stage !== 2 && chosen?.excerpt ? `<p>${escape(chosen.excerpt)}</p>` : ""}<p><a href="${escape(url.toString())}">${escape(label)} →</a></p><p>Pranay Agarwal<br>The Touchline Dribble</p>`,
    }),
  };
}
