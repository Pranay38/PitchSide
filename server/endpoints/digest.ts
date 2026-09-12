import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { sendBatchEmails, isMailerConfigured } from "../_mailer";
import { requireAuth } from "../utils/security";
import { buildEditorialEmail } from "../utils/emailTemplate";

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
            return posts.map((post, idx) => {
                const postHref = `${SITE_URL}/post/${post.slug || post.id || post._id}`;
                return `
            <div style="margin-bottom: 32px; ${idx < posts.length - 1 ? 'padding-bottom: 28px; border-bottom: 1px solid #E2E8F0;' : ''}">
                ${post.coverImage ? `<a href="${postHref}" style="display: block; margin-bottom: 16px; border-radius: 10px; overflow: hidden;"><img src="${post.coverImage}" alt="${post.title}" style="width: 100%; max-height: 300px; object-fit: cover; display: block; border-radius: 10px;" /></a>` : ''}
                <p style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: #16A34A; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px 0;">
                    ${post.club || "Analysis"} &bull; ${post.readTime || "5 min read"}
                </p>
                <h3 style="font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em; margin: 0 0 10px 0;">
                    <a href="${postHref}" style="color: #0F172A; text-decoration: none;">${post.title}</a>
                </h3>
                <p style="font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 18px 0;">
                    ${post.excerpt || ""}
                </p>
                <div>
                    <a href="${postHref}" style="display: inline-block; padding: 12px 24px; background-color: #16A34A; color: #ffffff; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; border-radius: 8px; text-decoration: none; letter-spacing: 0.02em;">Read Article &rarr;</a>
                </div>
            </div>
        `}).join('');
        };

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const subjectA = `The Touchline Dribble: Weekly Digest (${dateStr})`;
        const subjectB = `Top Football Stories This Week ⚽ (${dateStr})`;

        let sentVariantA = 0;
        let sentVariantB = 0;

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
            let editorsNoteTitle = "From the Editor";
            if (activeClub) {
                personalizedGreeting = `I put together this digest specifically for you, featuring the latest ${activeClub} updates alongside our top football stories.`;
                editorsNoteTitle = `Your ${activeClub} Digest`;
            } else if (isTransfer) {
                personalizedGreeting = "Here is your weekly digest, packed with the latest transfer rumors and top football news.";
                editorsNoteTitle = "Transfer & News Digest";
            } else if (isStory) {
                personalizedGreeting = "Here is your weekly digest, featuring our best longform reads and top football stories.";
                editorsNoteTitle = "Longform & Analysis Digest";
            }

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
            let customBacklink = `<p style="margin: 0;"><a href="${SITE_URL}" style="color: #16A34A; text-decoration: none; font-weight: 600;">Visit the Website</a></p>`;
            if (activeClub) {
                const clubSlug = activeClub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                customBacklink = `<p style="margin: 0;"><a href="${SITE_URL}/tag/${clubSlug}" style="color: #16A34A; text-decoration: none; font-weight: 600;">Read More ${activeClub} News</a> <span style="color: #CBD5E1;">&nbsp;|&nbsp;</span> <a href="${SITE_URL}" style="color: #64748B; text-decoration: none;">Visit Homepage</a></p>`;
            } else if (isTransfer) {
                customBacklink = `<p style="margin: 0;"><a href="${SITE_URL}/transfers" style="color: #16A34A; text-decoration: none; font-weight: 600;">View Transfer Tracker</a> <span style="color: #CBD5E1;">&nbsp;|&nbsp;</span> <a href="${SITE_URL}" style="color: #64748B; text-decoration: none;">Visit Homepage</a></p>`;
            } else if (isStory) {
                customBacklink = `<p style="margin: 0;"><a href="${SITE_URL}/stories" style="color: #16A34A; text-decoration: none; font-weight: 600;">Read More Longform Stories</a> <span style="color: #CBD5E1;">&nbsp;|&nbsp;</span> <a href="${SITE_URL}" style="color: #64748B; text-decoration: none;">Visit Homepage</a></p>`;
            }

            const isVariantA = Math.random() > 0.5;
            const finalSubject = isVariantA ? subjectA : subjectB;
            if (isVariantA) sentVariantA++; else sentVariantB++;

            const emailHtml = buildEditorialEmail({
                title: finalSubject,
                previewText: personalizedGreeting,
                unsubscribeUrl: `${SITE_URL}/api/subscribers?action=unsubscribe&email=${encodeURIComponent(sub.email)}`,
                content: `
                    <div style="background-color: #F8FAFC; border-left: 3px solid #16A34A; border-radius: 0 10px 10px 0; padding: 20px 24px; margin-bottom: 28px; font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.6; color: #475569;">
                        <strong style="color: #0F172A;">${editorsNoteTitle}</strong><br><br>
                        Hi there,<br><br>
                        ${personalizedGreeting}
                    </div>

                    ${postsHtml}

                    <hr style="height: 1px; background-color: #E2E8F0; margin: 32px 0; border: none;">
                    <p style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.7; color: #334155; margin-bottom: 20px;">
                        Thanks for reading,<br>
                        <strong style="color: #0F172A;">Pranay Agarwal</strong><br>
                        <span style="color: #16A34A; font-weight: 500;">Editor, The Touchline Dribble</span>
                    </p>
                    <div style="text-align: center; font-family: 'Inter', sans-serif; font-size: 13px; margin-top: 32px;">
                        ${customBacklink}
                    </div>
                `
            });

            return {
                to: sub.email,
                subject: finalSubject,
                html: emailHtml
            };
        });

        await sendBatchEmails(batchList);

        await db.collection("cron_logs").updateOne(
            { jobName: "digest" },
            { $set: { 
                lastRunAt: new Date().toISOString(), 
                status: "success", 
                emailsSent: subscribers.length,
                variantASent: sentVariantA,
                variantBSent: sentVariantB 
            } },
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
