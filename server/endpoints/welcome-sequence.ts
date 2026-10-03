import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { sendEmail, isMailerConfigured } from "../_mailer";
import { requireAuth, checkOrigin } from "../utils/security";
import { loadWelcomeReading, welcomeMessage } from "../utils/welcomeJourney";

export default async function welcomeSequenceHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const isCron = req.method === "GET";
  if (isCron) {
    if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else if (!checkOrigin(req, res) || !(await requireAuth(req, res))) return;
  if (!isMailerConfigured()) return res.status(500).json({ error: "Mailer not configured. Cannot send sequence emails." });

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("subscribers");
    // Snapshot before sending: a reader can advance only one stage per run.
    const subscribers = await collection.find({ welcomeSequenceState: { $in: [0, 1, 2] }, status: { $ne: "unsubscribed" } }).toArray();
    const reading = await loadWelcomeReading(db);
    const counts = [0, 0, 0];
    let failed = 0;
    for (const sub of subscribers) {
      const stage = sub.welcomeSequenceState as 0 | 1 | 2;
      if (![0, 1, 2].includes(stage)) continue;
      const subscribedAt = Date.parse(sub.subscribedAt);
      const lastSent = Date.parse(sub.welcomeLastSentAt || sub.subscribedAt);
      if (stage > 0 && (!Number.isFinite(lastSent) || !Number.isFinite(subscribedAt)
        || Date.now() - lastSent < 86400000 || Date.now() - subscribedAt < (stage === 1 ? 1 : 3) * 86400000)) continue;
      // Recheck opt-out immediately before dispatch.
      const active = await collection.findOne({ _id: sub._id, welcomeSequenceState: stage, status: { $ne: "unsubscribed" } });
      if (!active) continue;
      try {
        await sendEmail({ ...welcomeMessage(stage, sub.email, reading), idempotencyKey: `welcome-${sub._id}-${stage}` });
        await collection.updateOne({ _id: sub._id, welcomeSequenceState: stage }, { $set: {
          welcomeSequenceState: stage + 1,
          welcomeLastSentAt: new Date().toISOString(),
        } });
        counts[stage]++;
      } catch (error) {
        failed++;
        await db.collection("error_logs").insertOne({ type: "welcome_email", stage, error: String(error), timestamp: new Date().toISOString() });
      }
    }
    await db.collection("cron_logs").updateOne({ jobName: "welcome-sequence" }, { $set: {
      lastRunAt: new Date().toISOString(), status: failed ? "partial_failure" : "success",
      welcomeSent: counts[0], day1Sent: counts[1], day3Sent: counts[2], failed,
    } }, { upsert: true });
    return res.status(200).json({ success: failed === 0, welcomeEmailsSent: counts[0], day1EmailsSent: counts[1], day3EmailsSent: counts[2], failed });
  } catch (error) {
    console.error("Welcome sequence failed", error);
    return res.status(500).json({ error: "Could not process welcome emails" });
  }
}
