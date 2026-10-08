import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../server/_db";
import { deliverStoryEmails } from "../../../server/lib/storyNotifications";

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { db } = await connectToDatabase();
    const stories = await db.collection("stories").find({ isDraft: { $ne: true }, publicationEmail: { $exists: true }, "publicationEmail.completedAt": { $exists: false } }).sort({ "publicationEmail.lastRunAt": 1 }).limit(25).toArray();
    const started = Date.now();
    let processed = 0;
    for (const story of stories) {
      if (Date.now() - started > 40_000) break;
      await db.collection("stories").updateOne({ _id: story._id }, { $set: { "publicationEmail.lastRunAt": new Date().toISOString() } });
      await deliverStoryEmails(db, String(story.id));
      processed++;
    }
    return NextResponse.json({ processed });
  } catch (error) {
    console.error("Story email worker failed:", error);
    return NextResponse.json({ error: "Could not process story emails" }, { status: 500 });
  }
}
