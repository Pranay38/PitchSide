import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "./_db.js";
import { sendEmail, isMailerConfigured } from "./_mailer.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        if (!isMailerConfigured()) {
            return res.status(500).json({ error: "Email not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD." });
        }

        const { db } = await connectToDatabase();

        // Fetch subscribers
        const subscribers = await db.collection("subscribers").find({}).toArray();
        if (subscribers.length === 0) {
            return res.status(200).json({ message: "No subscribers yet.", sent: 0 });
        }

        // Fetch latest 5 posts
        const posts = await db.collection("posts").find({}).sort({ _id: -1 }).limit(5).toArray();

        // Fetch upcoming fixtures
        let fixturesHtml = "";
        try {
            const API_KEY = process.env.FOOTBALL_DATA_KEY || "";
            if (API_KEY) {
                const now = new Date();
                const future = new Date(now);
                future.setDate(future.getDate() + 7);
                const dateFrom = now.toISOString().split("T")[0];
                const dateTo = future.toISOString().split("T")[0];

                const fixturesRes = await fetch(
                    `https://api.football-data.org/v4/competitions/PL/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
                    { headers: { "X-Auth-Token": API_KEY } }
                );

                if (fixturesRes.ok) {
                    const data = await fixturesRes.json();
                    const matches = (data.matches || []).slice(0, 6);
                    if (matches.length > 0) {
                        fixturesHtml = `
                            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #1E293B;">
                                <h3 style="color: #4ade80; margin: 0 0 16px; font-size: 16px;">⚽ Upcoming PL Fixtures</h3>
                                ${matches.map((m: any) => {
                            const date = new Date(m.utcDate);
                            const dateStr = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                            const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                            return `<div style="padding: 8px 0; color: #CBD5E1; font-size: 13px;">
                                        <span style="color: #64748B; font-size: 11px;">${dateStr}, ${timeStr}</span><br/>
                                        ${m.homeTeam?.shortName || m.homeTeam?.name || "TBD"} vs ${m.awayTeam?.shortName || m.awayTeam?.name || "TBD"}
                                    </div>`;
                        }).join("")}
                            </div>
                        `;
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch fixtures for digest:", e);
        }

        // Build post cards HTML
        const postsHtml = posts.map((p) => {
            const postId = p.id || String(p._id);
            const url = `https://pitchside-orcin.vercel.app/post/${postId}`;
            return `
                <div style="margin-bottom: 20px; padding: 16px; background: #1E293B; border-radius: 12px;">
                    <h3 style="color: #fff; margin: 0 0 8px; font-size: 16px;">
                        <a href="${url}" style="color: #fff; text-decoration: none;">${p.title || "Untitled"}</a>
                    </h3>
                    ${p.excerpt ? `<p style="color: #94A3B8; margin: 0 0 12px; font-size: 13px; line-height: 1.5;">${p.excerpt.slice(0, 120)}...</p>` : ""}
                    <a href="${url}" style="color: #4ade80; text-decoration: none; font-size: 13px; font-weight: 600;">Read more →</a>
                </div>
            `;
        }).join("");

        const emails = subscribers.map((s) => s.email);
        const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

        await sendEmail({
            to: emails,
            subject: `📬 Weekly Digest — The Touchline Dribble (${today})`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F172A; color: #fff; border-radius: 16px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #16A34A, #15803d); padding: 32px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; color: white;">⚽ The Touchline Dribble</h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Weekly Digest — ${today}</p>
                    </div>
                    <div style="padding: 32px;">
                        <h2 style="color: #fff; margin: 0 0 20px; font-size: 18px;">📰 Latest Articles</h2>
                        ${postsHtml || '<p style="color: #94A3B8;">No new posts this week.</p>'}
                        ${fixturesHtml}
                        <div style="margin-top: 32px; text-align: center;">
                            <a href="https://pitchside-orcin.vercel.app" style="display: inline-block; padding: 12px 28px; background: #16A34A; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Visit The Blog →</a>
                        </div>
                    </div>
                    <div style="padding: 16px 32px; border-top: 1px solid #1E293B; text-align: center;">
                        <p style="color: #64748B; font-size: 12px; margin: 0;">© 2026 The Touchline Dribble. All rights reserved.</p>
                    </div>
                </div>
            `,
        });

        return res.status(200).json({ message: `Weekly digest sent to ${emails.length} subscriber(s)!`, sent: emails.length });
    } catch (error: any) {
        console.error("Digest API Error:", error);
        return res.status(500).json({ error: error.message || "Failed to send digest." });
    }
}
