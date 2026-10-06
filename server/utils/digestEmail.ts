import { newsletterReading } from "../../src/app/lib/newsletterReading";
import { buildSubscriberEmail, escapeEmailHtml as escape } from "./emailTemplate";
import { SITE_URL } from "./welcomeJourney";

export function buildDigestEmail(email: string, reading: ReturnType<typeof newsletterReading>, subject: string) {
  const sections = [{ label: "One strong opinion", post: reading.opinion }, { label: "One useful lesson", post: reading.explainer }];
  const content = sections.map(({ label, post }) => `<h2>${label}</h2>${post
    ? `<p><a href="${escape(new URL(post.href, SITE_URL).toString())}">${escape(post.title)}</a></p><p>${escape(post.excerpt)}</p>`
    : "<p>We don’t have a new pick for this section this week.</p>"}`).join("");
  return { to: email, subject, ...buildSubscriberEmail({ email, title: subject,
    previewText: "This week’s opinion and a useful football lesson.",
    content: `<p>Hi there,</p><p>Here are this week’s reading picks from The Touchline Dribble.</p>${content}<p>Thanks for reading,<br>Pranay<br>The Touchline Dribble</p>`,
  }) };
}
