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
  if (!postId) return "https://pitchside-orcin.vercel.app";
  return `https://pitchside-orcin.vercel.app/post/${postId}`;
}

function buildPostEmailHtml(title: string, excerpt: string | undefined, postUrl: string): string {
  const safeTitle = escapeHtml(title);
  const safeExcerpt = excerpt ? escapeHtml(excerpt) : "";

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #fff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #16A34A, #15803d); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: white;">The Touchline Dribble</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">New Article Published!</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #fff; margin: 0 0 12px; font-size: 22px;">${safeTitle}</h2>
        ${safeExcerpt ? `<p style="color: #94A3B8; line-height: 1.6; margin: 0 0 24px;">${safeExcerpt}</p>` : ""}
        <a href="${postUrl}" style="display: inline-block; padding: 12px 28px; background: #16A34A; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Read Now -></a>
      </div>
      <div style="padding: 16px 32px; border-top: 1px solid #1E293B; text-align: center;">
        <p style="color: #64748B; font-size: 12px; margin: 0;">© 2026 The Touchline Dribble. All rights reserved.</p>
      </div>
    </div>
  `;
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
