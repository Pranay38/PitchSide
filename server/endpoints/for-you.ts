import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const userId = req.query.userId as string | undefined;
        const { db } = await connectToDatabase();

        // 1. Fetch all published posts
        const posts = await db.collection("posts")
            .find({ 
                isDraft: { $ne: true },
                status: { $ne: "draft" }
            })
            .toArray();

        // If no user ID, just return top posts sorted by engagement
        if (!userId) {
            const sortedPosts = posts.sort((a, b) => {
                const scoreA = (a.reactions?.fire || 0) + (a.reactions?.mindblown || 0);
                const scoreB = (b.reactions?.fire || 0) + (b.reactions?.mindblown || 0);
                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date((b as any).publishAt || (b as any).date).getTime() - new Date((a as any).publishAt || (a as any).date).getTime();
            }).slice(0, 30);
            
            return res.status(200).json({ posts: sortedPosts, preferences: null });
        }

        // 2. Fetch user preferences
        const userPrefs = await db.collection("user_preferences").findOne({ userId });
        
        if (!userPrefs) {
             const sortedPosts = posts.sort((a, b) => {
                const scoreA = (a.reactions?.fire || 0) + (a.reactions?.mindblown || 0);
                const scoreB = (b.reactions?.fire || 0) + (b.reactions?.mindblown || 0);
                if (scoreB !== scoreA) return scoreB - scoreA;
                return new Date(b.publishAt || b.date).getTime() - new Date(a.publishAt || a.date).getTime();
            }).slice(0, 30);
            
            return res.status(200).json({ posts: sortedPosts, preferences: null });
        }

        const followedClubs = Array.isArray(userPrefs.followedClubs) ? userPrefs.followedClubs.map((c: string) => c.toLowerCase()) : [];
        if (userPrefs.fanClub?.name) {
            followedClubs.push(userPrefs.fanClub.name.toLowerCase());
        }
        const followedTags = Array.isArray(userPrefs.followedTags) ? userPrefs.followedTags.map((t: string) => t.toLowerCase()) : [];
        const readPostIds = Array.isArray(userPrefs.readingHistory) ? userPrefs.readingHistory.map((h: any) => h.postId) : [];

        const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

        // 3. Apply scoring algorithm
        const scoredPosts = posts.map(post => {
            let score = (post.reactions?.fire || 0) + (post.reactions?.mindblown || 0);
            let matchReason = "";
            const postClub = (post.club || "").toLowerCase();
            const postTags = Array.isArray(post.tags) ? post.tags.map((t: string) => t.toLowerCase()) : [];

            // Club match (+100)
            const matchesClub = followedClubs.includes(postClub) || followedClubs.some((c: string) => postTags.includes(c));
            if (matchesClub) {
                score += 100;
                matchReason = `Matches: ${post.club || followedClubs.find((c: string) => postTags.includes(c))}`;
            }

            // Tag match (+80)
            const matchedTag = followedTags.find((t: string) => postTags.includes(t));
            if (matchedTag && !matchesClub) {
                score += 80;
                matchReason = `Matches: ${matchedTag.charAt(0).toUpperCase() + matchedTag.slice(1)}`;
            } else if (matchedTag) {
                score += 80;
            }

            // Recency match (+40)
            const timeMs = post.publishAt ? new Date(post.publishAt).getTime() : new Date(post.date).getTime();
            if (timeMs >= sevenDaysAgoMs) {
                score += 40;
                if (!matchReason) matchReason = "Recent updates";
            }

            // Read history penalty (-50)
            const postIdStr = post.id || post._id?.toString() || post.slug;
            if (readPostIds.includes(postIdStr)) {
                score -= 50;
            }

            if (!matchReason) {
                matchReason = "Trending";
            }

            return { ...post, _score: score, matchReason };
        });

        // 4. Sort and return top 30
        const sortedPosts = scoredPosts.sort((a, b) => {
            if (b._score !== a._score) return b._score - a._score;
            return new Date((b as any).publishAt || (b as any).date).getTime() - new Date((a as any).publishAt || (a as any).date).getTime();
        }).slice(0, 30);

        // Remove the temporary _score field before sending to client
        const finalPosts = sortedPosts.map(p => {
            const { _score, ...rest } = p;
            return rest;
        });

        return res.status(200).json({ posts: finalPosts, preferences: userPrefs });

    } catch (error) {
        console.error("For You Endpoint Error:", error);
        return res.status(500).json({ error: "Failed to generate personalized feed" });
    }
}
