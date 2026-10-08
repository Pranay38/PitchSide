import { createHash, randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { isMailerConfigured, sendEmail } from "../_mailer";
import { createUnsubscribeUrl } from "../utils/unsubscribe";
import { buildEditorialEmail } from "../utils/emailTemplate";

const SITE = "https://www.thetouchlinedribble.in";
const COLLECTION = "story_email_deliveries";
const LEASE_MS = 5 * 60_000;
// Resend keys expire after 24 hours. Never automatically retry an ambiguous
// acceptance outside that window: it could deliver the same email twice.
const SAFE_RETRY_MS = 23 * 60 * 60_000;
export interface StoryEmailJob {
  createdAt: string;
  title: string;
  excerpt: string;
  slug: string;
  audienceReady?: boolean;
  error?: string;
}
export function createStoryEmailJob(story: { title: string; excerpt?: string; slug: string }): StoryEmailJob {
  return { createdAt: new Date().toISOString(), title: story.title, excerpt: story.excerpt || "", slug: story.slug };
}
export function eligibleForStoryEmail(subscriber: any): boolean {
  return !!subscriber && subscriber.status !== "unsubscribed" && subscriber.preferences?.newArticles !== false;
}
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
export function storyEmail(job: StoryEmailJob, email: string) {
  const url = `${SITE}/stories/${encodeURIComponent(job.slug)}`;
  const unsubscribeUrl = createUnsubscribeUrl(email);
  return {
    unsubscribeUrl,
    to: email,
    subject: `New story: ${job.title.replace(/[\r\n]/g, " ")}`,
    html: buildEditorialEmail({
      title: `New story: ${job.title}`,
      previewText: job.excerpt,
      unsubscribeUrl,
      content: `<p style="color:#15803d;font-size:12px;letter-spacing:.1em;text-transform:uppercase">New story</p>
        <h2 style="font-family:Georgia,serif;font-size:32px;line-height:1.15;margin:16px 0">${escapeHtml(job.title)}</h2>
        ${job.excerpt ? `<p style="font-size:18px;line-height:1.6;margin:24px 0">${escapeHtml(job.excerpt)}</p>` : ""}
        <p style="margin:28px 0"><a href="${url}" style="color:#15803d;font-weight:600;text-decoration:underline">Read the story</a></p>`,
    }),
  };
}

export async function storyEmailStatus(db: Db, storyId: string) {
  const story = await db.collection("stories").findOne({ id: storyId });
  if (!story) return null;
  const job = story.publicationEmail as StoryEmailJob | undefined;
  if (!job) return { state: "not-scheduled", accepted: 0, pending: 0, failed: 0, skipped: 0, review: 0 };
  const rows = await db.collection(COLLECTION).aggregate([{ $match: { storyId } }, { $group: { _id: "$state", count: { $sum: 1 } } }]).toArray();
  const counts = Object.fromEntries(rows.map(row => [row._id, row.count]));
  const pending = (counts.pending || 0) + (counts.processing || 0);
  return { state: !job.audienceReady || pending ? "pending" : counts.failed ? "failed" : counts.review ? "review" : "complete", accepted: counts.accepted || 0, pending, failed: counts.failed || 0, skipped: counts.skipped || 0, review: counts.review || 0, error: job.error };
}

export async function deliverStoryEmails(db: Db, storyId: string) {
  const stories = db.collection("stories");
  const story = await stories.findOne({ id: storyId });
  const job = story?.publicationEmail as StoryEmailJob | undefined;
  if (!story || !job || story.isDraft) return;
  const deliveries = db.collection<any>(COLLECTION);
  const started = Date.now();
  try {
    if (!isMailerConfigured()) throw new Error("Email sending is not configured. Pending emails can be retried after configuration.");
    if (!job.audienceReady) {
      const subscribers = await db.collection("subscribers").find({ status: { $ne: "unsubscribed" }, "preferences.newArticles": { $ne: false } }).toArray();
      for (const subscriber of subscribers) {
        if (subscriber.subscribedAt && Date.parse(String(subscriber.subscribedAt)) > Date.parse(job.createdAt)) continue;
        const email = String(subscriber.email || "").trim().toLowerCase();
        if (!email.includes("@")) continue;
        // The built-in unique _id index enforces one delivery per story/address.
        const key = createHash("sha256").update(`${storyId}\0${email}`).digest("hex");
        try {
          await deliveries.updateOne({ _id: key }, { $setOnInsert: { storyId, email, state: "pending", createdAt: job.createdAt, message: storyEmail(job, email) } }, { upsert: true });
        } catch (error: any) { if (error.code !== 11000) throw error; }
      }
      await stories.updateOne({ id: storyId }, { $set: { "publicationEmail.audienceReady": true } });
    }
    const candidates = await deliveries.find({ storyId, state: { $in: ["pending", "failed", "processing"] } }).limit(100).toArray();
    for (const candidate of candidates) {
      if (Date.now() - started > 8_000) break;
      const now = new Date();
      const claim = randomUUID();
      const delivery = await deliveries.findOneAndUpdate({ _id: candidate._id, $or: [
        { state: { $in: ["pending", "failed"] } },
        { state: "processing", leaseUntil: { $lt: now } },
      ] }, { $set: { state: "processing", claim, leaseUntil: new Date(now.getTime() + LEASE_MS) } }, { returnDocument: "after" });
      if (!delivery) continue;
      const owned = { _id: delivery._id, claim };
      if (delivery.firstAttemptAt && now.getTime() - Date.parse(delivery.firstAttemptAt) >= SAFE_RETRY_MS) {
        await deliveries.updateOne(owned, { $set: { state: "review", error: "Delivery could not be confirmed within the safe retry window. Check the email provider before sending again." } });
        continue;
      }
      const subscriber = await db.collection("subscribers").findOne({ email: delivery.email });
      const currentStory = await stories.findOne({ id: storyId });
      if (!currentStory || currentStory.isDraft) {
        await deliveries.updateOne(owned, { $set: { state: "pending" } });
        break;
      }
      if (!eligibleForStoryEmail(subscriber)) {
        await deliveries.updateOne(owned, { $set: { state: "skipped" } });
        continue;
      }
      // Persist before calling the provider so a process crash can be retried safely.
      await deliveries.updateOne(owned, { $set: { firstAttemptAt: delivery.firstAttemptAt || now.toISOString() } });
      try {
        await sendEmail({ ...(delivery.message || storyEmail(job, delivery.email)), idempotencyKey: `story-${delivery._id}` });
        await deliveries.updateOne(owned, { $set: { state: "accepted", acceptedAt: new Date().toISOString() }, $unset: { error: "" } });
      } catch (error) {
        await deliveries.updateOne(owned, { $set: { state: "failed", error: String(error) } });
      }
    }
    const remaining = await deliveries.countDocuments({ storyId, state: { $in: ["pending", "failed", "processing"] } });
    await stories.updateOne({ id: storyId }, {
      $unset: { "publicationEmail.error": "" },
      ...(remaining === 0 ? { $set: { "publicationEmail.completedAt": new Date().toISOString() } } : {}),
    });
  } catch (error) {
    console.error("Story email delivery paused:", error);
    // The publication is already durable; delivery failure must not undo it.
    await stories.updateOne({ id: storyId }, { $set: { "publicationEmail.error": String(error) } }).catch(() => {});
  }
}
