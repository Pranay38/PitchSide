import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { sendBatchEmails, isMailerConfigured } from "../_mailer";

const COLLECTION = "subscribers";

export default async function welcomeSequenceHandler(req: VercelRequest, res: VercelResponse) {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // Allow vercel cron or manual POST trigger
        const isCronTrigger = req.method === "GET" && !!req.headers["x-vercel-cron"];
        const isManualRefresh = req.method === "POST";

        if (!isCronTrigger && !isManualRefresh) {
            return res.status(405).json({ error: "Method not allowed" });
        }

        if (!isMailerConfigured()) {
            return res.status(500).json({ error: "Mailer not configured. Cannot send sequence emails." });
        }

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

        // --- Sequence Email 2: The Best of Touchline Dribble (Day 1) ---
        // State 1 = received immediate welcome email. Send Email 2 if subscribed > 24 hours ago.
        const day1Subscribers = await collection.find({
            welcomeSequenceState: 1,
            subscribedAt: { $lt: twentyFourHoursAgo },
            status: { $ne: "unsubscribed" }
        }).toArray();

        const day1Batch = day1Subscribers.map(sub => ({
            to: sub.email,
            subject: "The Best of Touchline Dribble 🏆",
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #fff; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #16A34A, #15803d); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; color: white;">The Best of Touchline Dribble</h1>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px;">
                            Hey there,<br><br>
                            It's been a day since you joined us. While we prepare our next tactical breakdown, here are three of our absolute best pieces to get you started:
                        </p>
                        
                        <div style="background: #1E293B; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
                            <h3 style="margin: 0 0 8px; color: #4ade80;">1. Football Formations Explained</h3>
                            <p style="margin: 0; color: #94A3B8; font-size: 14px;">Every system from the classic 4-4-2 to Pep's 3-2-4-1, broken down.</p>
                        </div>
                        
                        <div style="background: #1E293B; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
                            <h3 style="margin: 0 0 8px; color: #4ade80;">2. The Death of the Number 10</h3>
                            <p style="margin: 0; color: #94A3B8; font-size: 14px;">Why the classic playmaker vanished, and how the role evolved into the modern '8'.</p>
                        </div>
                        
                        <div style="background: #1E293B; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
                            <h3 style="margin: 0 0 8px; color: #4ade80;">3. High Press vs. Mid Block</h3>
                            <p style="margin: 0; color: #94A3B8; font-size: 14px;">A tactical deep dive into defensive structures and when teams choose to use them.</p>
                        </div>

                        <p style="color: #94A3B8; line-height: 1.6; margin: 24px 0 0;">
                            Dive in, and let us know what you think.<br>
                            — The Touchline Dribble Team
                        </p>
                    </div>
                    <div style="padding: 16px 32px; border-top: 1px solid #1E293B; text-align: center;">
                        <p style="color: #64748B; font-size: 12px; margin: 0;">© 2026 The Touchline Dribble</p>
                        <p style="margin-top: 10px;"><a href="https://thetouchlinedribble.in/api/subscribers?action=unsubscribe&email=${encodeURIComponent(sub.email)}" style="color: #64748b; text-decoration: underline; font-size: 12px;">Unsubscribe</a></p>
                    </div>
                </div>
            `
        }));

        if (day1Batch.length > 0) {
            await sendBatchEmails(day1Batch);
            await collection.updateMany(
                { _id: { $in: day1Subscribers.map(s => s._id) } },
                { $set: { welcomeSequenceState: 2 } }
            );
        }

        // --- Sequence Email 3: Join the Debate (Day 3) ---
        // State 2 = received Email 2. Send Email 3 if subscribed > 72 hours ago.
        const day3Subscribers = await collection.find({
            welcomeSequenceState: 2,
            subscribedAt: { $lt: seventyTwoHoursAgo },
            status: { $ne: "unsubscribed" }
        }).toArray();

        const day3Batch = day3Subscribers.map(sub => ({
            to: sub.email,
            subject: "Who is the greatest modern manager? 🤔",
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #fff; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #16A34A, #15803d); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; color: white;">Join the Debate</h1>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px;">
                            Hey,<br><br>
                            We pride ourselves on having the sharpest tactical community on the internet. And today, we want to hear from you.
                        </p>
                        <p style="color: #F8FAFC; font-size: 18px; font-weight: bold; margin: 24px 0;">
                            Who is the greatest modern manager, and what is their defining tactical innovation?
                        </p>
                        <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 24px;">
                            Is it Pep's inverted fullbacks? Klopp's Gegenpressing? Mourinho's impenetrable low block?
                        </p>
                        <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px;">
                            <strong>Reply directly to this email</strong> with your take. We read every single reply, and the best answers get featured in our weekly digest.
                        </p>
                        <p style="color: #94A3B8; line-height: 1.6; margin: 24px 0 0;">
                            Speak soon,<br>
                            — The Touchline Dribble Team
                        </p>
                    </div>
                    <div style="padding: 16px 32px; border-top: 1px solid #1E293B; text-align: center;">
                        <p style="color: #64748B; font-size: 12px; margin: 0;">© 2026 The Touchline Dribble</p>
                        <p style="margin-top: 10px;"><a href="https://thetouchlinedribble.in/api/subscribers?action=unsubscribe&email=${encodeURIComponent(sub.email)}" style="color: #64748b; text-decoration: underline; font-size: 12px;">Unsubscribe</a></p>
                    </div>
                </div>
            `
        }));

        if (day3Batch.length > 0) {
            await sendBatchEmails(day3Batch);
            await collection.updateMany(
                { _id: { $in: day3Subscribers.map(s => s._id) } },
                { $set: { welcomeSequenceState: 3 } } // 3 = sequence complete
            );
        }

        if (isCronTrigger) {
            await db.collection("cron_logs").updateOne(
                { jobName: "welcome-sequence" },
                { $set: { lastRunAt: new Date().toISOString(), status: "success", day1Sent: day1Batch.length, day3Sent: day3Batch.length } },
                { upsert: true }
            );
        }

        return res.status(200).json({ 
            success: true, 
            message: "Welcome sequence emails processed",
            day1EmailsSent: day1Batch.length,
            day3EmailsSent: day3Batch.length
        });

    } catch (error: any) {
        console.error("Welcome Sequence Cron Error:", error);
        try {
            const { db } = await connectToDatabase();
            if (req.method === "GET" && !!req.headers["x-vercel-cron"]) {
                await db.collection("cron_logs").updateOne(
                    { jobName: "welcome-sequence" },
                    { $set: { lastRunAt: new Date().toISOString(), status: "failed", error: String(error) } },
                    { upsert: true }
                );
            }
        } catch (e) {}
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
