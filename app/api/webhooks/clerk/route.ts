import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { connectToDatabase } from "../../../../server/_db";
import { sendEmail, isMailerConfigured } from "../../../../server/_mailer";
import { loadWelcomeReading, welcomeMessage } from "../../../../server/utils/welcomeJourney";

export async function POST(request: NextRequest) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || process.env.CLERK_WEBHOOK_SECRET;
  if (!signingSecret) return NextResponse.json({ error: "Webhook verification is not configured" }, { status: 503 });
  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request, { signingSecret });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
  if (event.type !== "user.created") return NextResponse.json({ success: true });
  const email = event.data.email_addresses.find(address => address.id === event.data.primary_email_address_id)?.email_address.trim().toLowerCase();
  if (!email) return NextResponse.json({ success: true });
  try {
    const { db } = await connectToDatabase();
    const subscribers = db.collection("subscribers");
    // Account creation is not newsletter consent. Never create or reactivate an audience contact here.
    const reader = await subscribers.findOne({ email, status: { $ne: "unsubscribed" }, welcomeSequenceState: 0 });
    if (!reader) return NextResponse.json({ success: true });
    if (!isMailerConfigured()) return NextResponse.json({ error: "Email is temporarily unavailable" }, { status: 503 });
    const reading = await loadWelcomeReading(db);
    // Recheck after loading content, just as the scheduled welcome sender does.
    const filter = { _id: reader._id, status: { $ne: "unsubscribed" }, welcomeSequenceState: 0 };
    if (!await subscribers.findOne(filter)) return NextResponse.json({ success: true });
    await sendEmail({ ...welcomeMessage(0, email, reading), idempotencyKey: `welcome-${reader._id}-0` });
    await subscribers.updateOne(filter, { $set: { welcomeSequenceState: 1, welcomeLastSentAt: new Date().toISOString() } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not process welcome email" }, { status: 503 });
  }
}
