import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { sendBatchEmails, isMailerConfigured } from "../_mailer";
import { requireAuth } from "../utils/security";

const SITE_URL = "https://www.thetouchlinedribble.in";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Authentication Check
    // We allow GET (from Cron) or POST (from Admin dashboard)
    const authHeader = req.headers.authorization;
    const isCron = req.method === 'GET' && (
        authHeader === `Bearer ${process.env.CRON_SECRET}` || 
        req.query.secret === process.env.CRON_SECRET
    );

    const isAdmin = req.method === 'POST' && requireAuth(req, res);

    if (!isCron && !isAdmin) {
        // requireAuth already sends 401/403 if it fails and returns false
        if (req.method !== 'POST' && req.method !== 'GET') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
        if (!isCron && req.method === 'GET') {
            return res.status(401).json({ error: 'Unauthorized: Invalid Cron Secret' });
        }
        return; // requireAuth handled the response
    }

    if (!isMailerConfigured()) {
        return res.status(500).json({ error: "Mailer is not configured (missing env vars)" });
    }

    try {
        const { db } = await connectToDatabase();

        // 1. Fetch active subscribers
        const subscribers = await db.collection("subscribers")
            .find({ status: { $ne: "unsubscribed" } })
            .toArray();

        if (subscribers.length === 0) {
            return res.status(200).json({ message: "No active subscribers found. Skipping." });
        }

        const bccList = subscribers.map(s => s.email).join(",");

        // 2. Fetch posts from the last 7 days
        // 2. Fetch recent posts
        const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

        const candidatePosts = await db.collection("posts")
            .find({ 
                isDraft: { $ne: true },
                status: { $ne: "draft" }
            })
            .sort({ _id: -1 })
            .limit(20)
            .toArray();

        // Filter manually in JS to avoid MongoDB string-to-ISO date comparison bugs for old string-formatted dates
        const recentPostsResult = candidatePosts.filter(p => {
            const timeMs = p.publishAt ? new Date(p.publishAt).getTime() : new Date(p.date).getTime();
            return timeMs >= sevenDaysAgoMs;
        });

        if (recentPostsResult.length === 0) {
            return res.status(200).json({ message: "No new posts in the last 7 days. Skipping." });
        }

        // 3. Fetch User Preferences and Clerk Users to personalize
        let clerkUsers: any[] = [];
        if (process.env.CLERK_SECRET_KEY) {
            try {
                const clerkRes = await fetch("https://api.clerk.com/v1/users?limit=500", {
                    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
                });
                if (clerkRes.ok) {
                    const data = await clerkRes.json();
                    clerkUsers = Array.isArray(data) ? data : (data.data || []);
                }
            } catch (e) {
                console.error("Failed to fetch Clerk users", e);
            }
        }
        
        const emailToUserId: Record<string, string> = {};
        clerkUsers.forEach(u => {
            const emailObj = u.email_addresses?.find((e: any) => e.email_address);
            if (emailObj) {
                emailToUserId[emailObj.email_address.toLowerCase()] = u.id;
            }
        });

        const userPrefs = await db.collection("user_preferences").find({}).toArray();
        const userIdToPrefs: Record<string, any> = {};
        userPrefs.forEach(p => {
            userIdToPrefs[p.userId] = p;
        });

        const generateHtmlForPosts = (posts: any[]) => {
            return posts.map(post => {
                const postHref = `${SITE_URL}/post/${post.slug || post.id || post._id}`;
                return `
            <div style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #e2e8f0;">
                ${post.coverImage ? `<a href="${postHref}"><img src="${post.coverImage}" alt="${post.title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 20px;" /></a>` : ''}
                <div style="font-size: 11px; font-weight: bold; color: #16A34A; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">
                    ${post.club || "Football"} • ${post.readTime || "5 min read"}
                </div>
                <h3 style="margin: 0 0 15px 0; font-size: 24px; color: #0f172a; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.3;">
                    <a href="${postHref}" style="color: #0f172a; text-decoration: none;">${post.title}</a>
                </h3>
                <div style="margin: 0 0 20px 0; font-size: 16px; color: #334155; line-height: 1.7; font-family: 'Segoe UI', Arial, sans-serif;">
                    ${post.excerpt || ""}
                </div>
                <div style="text-align: left;">
                    <a href="${postHref}" style="display: inline-block; padding: 12px 24px; background-color: #16A34A; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: bold; letter-spacing: 0.5px;">
                        Read Article →
                    </a>
                </div>
            </div>
        `}).join('');
        };

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const subject = `The Touchline Dribble: Weekly Digest (${dateStr})`;

        const batchList = subscribers.map(sub => {
            const userId = emailToUserId[sub.email.toLowerCase()];
            const prefs = userId ? userIdToPrefs[userId] : null;

            const followedClubs = prefs?.followedClubs || [];
            if (prefs?.fanClub?.name && !followedClubs.includes(prefs.fanClub.name)) {
                followedClubs.unshift(prefs.fanClub.name);
            }
            const primaryClub = followedClubs.length > 0 ? followedClubs[0] : null;

            // Optional fallback for old alertPreferences if they literally typed "arsenal" there
            const fallbackClub = sub.alertPreferences?.arsenal ? "Arsenal" : null;
            const activeClub = primaryClub || fallbackClub;
            
            const isTransfer = 
                (prefs?.followedTransfers && prefs.followedTransfers.length > 0) || 
                prefs?.followedTags?.some((t: string) => t.toLowerCase().includes("transfer")) ||
                sub.alertPreferences?.transfer;

            const isStory = 
                prefs?.followedTags?.some((t: string) => t.toLowerCase().includes("story")) ||
                sub.alertPreferences?.story;

            let personalizedGreeting = "Here is a roundup of our top football analysis and stories from the past week.";
            if (activeClub) personalizedGreeting = `Here's your personalized digest, featuring the latest ${activeClub} updates and top football stories.`;
            else if (isTransfer) personalizedGreeting = "Here's your weekly digest, packed with the latest transfer rumors and top football news.";
            else if (isStory) personalizedGreeting = "Here's your weekly digest, featuring our best longform reads and top football stories.";

            const personalizedPosts = [...recentPostsResult].sort((a, b) => {
                let scoreA = (a.reactions?.fire || 0) + (a.reactions?.mindblown || 0);
                let scoreB = (b.reactions?.fire || 0) + (b.reactions?.mindblown || 0);

                const getScoreModifiers = (post: any) => {
                    let modifier = 0;
                    const postClub = (post.club || "").toLowerCase();
                    const postTags = Array.isArray(post.tags) ? post.tags.map((t: string) => t.toLowerCase()) : [];
                    
                    if (activeClub && (postClub.includes(activeClub.toLowerCase()) || postTags.some((t: any) => t.includes(activeClub.toLowerCase())))) modifier += 100;
                    if (isTransfer && (postClub.includes("transfer") || postTags.includes("transfer") || post.category?.toLowerCase() === "transfer")) modifier += 80;
                    if (isStory && (postTags.includes("story") || parseInt(post.readTime || "0") > 5 || post.type?.toLowerCase() === "longform")) modifier += 60;
                    
                    return modifier;
                };

                scoreA += getScoreModifiers(a);
                scoreB += getScoreModifiers(b);

                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date(b.publishAt || b.date).getTime() - new Date(a.publishAt || a.date).getTime();
            }).slice(0, 5);

            const postsHtml = generateHtmlForPosts(personalizedPosts);
            
            // Generate backlink structure tailored for the user persona
            let customBacklink = `<p><a href="${SITE_URL}" style="color: #16A34A; text-decoration: none;">Visit the Website</a></p>`;
            if (activeClub) {
                const clubSlug = activeClub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                customBacklink = `<p><a href="${SITE_URL}/tag/${clubSlug}" style="color: #16A34A; text-decoration: none;">Read More ${activeClub} News</a> | <a href="${SITE_URL}" style="color: #334155; text-decoration: none;">Visit Homepage</a></p>`;
            } else if (isTransfer) {
                customBacklink = `<p><a href="${SITE_URL}/transfers" style="color: #16A34A; text-decoration: none;">View Transfer Tracker</a> | <a href="${SITE_URL}" style="color: #334155; text-decoration: none;">Visit Homepage</a></p>`;
            } else if (isStory) {
                customBacklink = `<p><a href="${SITE_URL}/stories" style="color: #16A34A; text-decoration: none;">Read More Longform Stories</a> | <a href="${SITE_URL}" style="color: #334155; text-decoration: none;">Visit Homepage</a></p>`;
            }

            const emailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                <div style="text-align: center; padding-bottom: 20px; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9;">
                    <h1 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">The Touchline Dribble</h1>
                    <p style="margin: 5px 0 0 0; color: #16A34A; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Weekly Digest</p>
                </div>
                
                <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
                    ${personalizedGreeting}
                </p>

                ${postsHtml}

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                    <p>You received this email because you subscribed to The Touchline Dribble.</p>
                    ${customBacklink}
                    <p style="margin-top: 15px;"><a href="${SITE_URL}/api/subscribers?action=unsubscribe&email=${encodeURIComponent(sub.email)}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a></p>
                </div>
            </div>
            `;

            return {
                to: sub.email,
                subject: subject,
                html: emailHtml
            };
        });

        await sendBatchEmails(batchList);

        await db.collection("cron_logs").updateOne(
            { jobName: "digest" },
            { $set: { lastRunAt: new Date().toISOString(), status: "success", emailsSent: subscribers.length } },
            { upsert: true }
        );

        return res.status(200).json({ 
            message: "Weekly digest sent successfully", 
            emailsSent: subscribers.length,
            postsIncluded: batchList.length > 0 ? 5 : 0
        });

    } catch (error) {
        console.error("Cron Digest Error:", error);
        try {
            const { db } = await connectToDatabase();
            await db.collection("cron_logs").updateOne(
                { jobName: "digest" },
                { $set: { lastRunAt: new Date().toISOString(), status: "failed", error: String(error) } },
                { upsert: true }
            );
        } catch (e) {}
        return res.status(500).json({ error: "Failed to send digest" });
    }
}
