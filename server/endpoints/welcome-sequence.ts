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

import { buildEditorialEmail } from "../utils/emailTemplate";

        const day1Batch = day1Subscribers.map(sub => ({
            to: sub.email,
            subject: "The Best of Touchline Dribble 🏆",
            html: buildEditorialEmail({
                title: "The Best of Touchline Dribble",
                previewText: "Three of our absolute best tactical pieces to get you started.",
                unsubscribeUrl: `https://www.thetouchlinedribble.in/api/subscribers?action=unsubscribe&email=${encodeURIComponent(sub.email)}`,
                content: `
                    <h2 class="headline serif">The Editor's Selection.</h2>
                    <p class="body-text sans">
                        Hi again,<br><br>
                        It's been a day since you joined the list. While we prepare our next tactical breakdown, I wanted to share three of our most popular, timeless pieces. 
                    </p>
                    <p class="body-text sans">
                        These are the articles that define what we do here at The Touchline Dribble.
                    </p>
                    
                    <hr class="divider">

                    <div style="margin-bottom: 32px;">
                        <div class="kicker sans">Tactics 101</div>
                        <h3 class="subheadline serif" style="margin-bottom: 8px;"><a href="https://www.thetouchlinedribble.in/post/football-formations" style="color: #0f172a; text-decoration: none;">Football Formations Explained</a></h3>
                        <p class="body-text sans" style="margin-bottom: 12px; font-size: 15px;">Every system from the classic 4-4-2 to Pep's 3-2-4-1, broken down step-by-step.</p>
                        <a href="https://www.thetouchlinedribble.in/post/football-formations" class="sans" style="font-size: 13px; font-weight: 600;">Read piece &rarr;</a>
                    </div>
                    
                    <div style="margin-bottom: 32px;">
                        <div class="kicker sans">Player Roles</div>
                        <h3 class="subheadline serif" style="margin-bottom: 8px;"><a href="https://www.thetouchlinedribble.in/post/death-of-number-10" style="color: #0f172a; text-decoration: none;">The Death of the Number 10</a></h3>
                        <p class="body-text sans" style="margin-bottom: 12px; font-size: 15px;">Why the classic playmaker vanished, and how the role evolved into the modern '8'.</p>
                        <a href="https://www.thetouchlinedribble.in/post/death-of-number-10" class="sans" style="font-size: 13px; font-weight: 600;">Read piece &rarr;</a>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <div class="kicker sans">Systems</div>
                        <h3 class="subheadline serif" style="margin-bottom: 8px;"><a href="https://www.thetouchlinedribble.in/post/high-press" style="color: #0f172a; text-decoration: none;">High Press vs. Mid Block</a></h3>
                        <p class="body-text sans" style="margin-bottom: 12px; font-size: 15px;">A tactical deep dive into defensive structures and when elite teams choose to use them.</p>
                        <a href="https://www.thetouchlinedribble.in/post/high-press" class="sans" style="font-size: 13px; font-weight: 600;">Read piece &rarr;</a>
                    </div>

                    <hr class="divider">

                    <p class="body-text sans" style="margin-top: 24px;">
                        Dive in, and let me know what you think.<br>
                        <strong>Pranay Agarwal</strong>
                    </p>
                `
            })
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
            html: buildEditorialEmail({
                title: "Join the Debate",
                previewText: "We want to hear your take on football's greatest modern manager.",
                unsubscribeUrl: `https://www.thetouchlinedribble.in/api/subscribers?action=unsubscribe&email=${encodeURIComponent(sub.email)}`,
                content: `
                    <div class="kicker sans">The Debate</div>
                    <h2 class="headline serif">Who is the greatest modern manager?</h2>
                    
                    <p class="body-text sans" style="margin-top: 24px;">
                        Hi,<br><br>
                        We pride ourselves on having the sharpest tactical community on the internet. And today, I want to hear directly from you.
                    </p>
                    
                    <div class="editors-note sans">
                        <strong>The Question:</strong><br>
                        Who is the greatest modern manager, and what is their defining tactical innovation?
                    </div>

                    <p class="body-text sans">
                        Is it Pep Guardiola's inverted fullbacks? Jurgen Klopp's heavy-metal Gegenpressing? Jose Mourinho's impenetrable low block? Or maybe someone else entirely?
                    </p>
                    <p class="body-text sans">
                        <strong>Reply directly to this email</strong> with your take. I read every single reply, and the best answers get featured in our weekly digest.
                    </p>
                    
                    <p class="body-text sans" style="margin-top: 24px;">
                        Looking forward to your thoughts,<br>
                        <strong>Pranay Agarwal</strong>
                    </p>
                `
            })
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
