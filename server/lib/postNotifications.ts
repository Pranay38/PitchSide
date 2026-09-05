import { sendBatchEmails, isMailerConfigured } from "../_mailer";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isPostLive(post: { isDraft?: boolean | null; publishAt?: string | null }): boolean {
  if (post.isDraft) return false;
  if (!post.publishAt) return true;
  return new Date(post.publishAt) <= new Date();
}

function buildPostUrl(postId?: string): string {
  if (!postId) return "https://www.thetouchlinedribble.in";
  return `https://www.thetouchlinedribble.in/post/${postId}`;
}

import { buildEditorialEmail } from "../utils/emailTemplate";

function buildPostEmailHtml(title: string, excerpt: string | undefined, postUrl: string): string {
  const safeTitle = escapeHtml(title);
  const safeExcerpt = excerpt ? escapeHtml(excerpt) : "";

  return buildEditorialEmail({
    title: `New Post: ${title}`,
    previewText: excerpt ? safeExcerpt.substring(0, 80) + "..." : "New tactical analysis available.",
    content: `
      <div class="kicker sans">New Article</div>
      <h2 class="headline serif">${safeTitle}</h2>
      ${safeExcerpt ? `<p class="body-text sans" style="font-size: 18px; color: #475569;">${safeExcerpt}</p>` : ""}
      <div style="margin-top: 32px; margin-bottom: 32px;">
        <a href="${postUrl}" class="btn sans">Read the full article</a>
      </div>
      <p class="body-text sans">
        Thanks for reading,<br>
        <strong>Pranay Agarwal</strong>
      </p>
    `
  });
}

export async function notifySubscribersAboutPost(
  db: any,
  post: { id?: string; title: string; excerpt?: string | null },
): Promise<{ sent: number; skippedReason?: string }> {
  if (!isMailerConfigured()) {
    return { sent: 0, skippedReason: "mailer-not-configured" };
  }

  const subscribers = await db.collection("subscribers").find({}).toArray();
  if (subscribers.length === 0) {
    return { sent: 0, skippedReason: "no-subscribers" };
  }

  const postUrl = buildPostUrl(post.id);
  const html = buildPostEmailHtml(post.title, post.excerpt ?? undefined, postUrl);
  const batchList = subscribers.map((subscriber: { email: string }) => ({
    to: subscriber.email,
    subject: `New Post: ${post.title} ⚽`,
    html,
  }));

  await sendBatchEmails(batchList);
  return { sent: subscribers.length };
}
