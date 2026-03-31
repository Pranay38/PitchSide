import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth, hasAdminAuth } from "../server/utils/security";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";
import { connectToDatabase } from "./_db";
import { isPostLive, notifySubscribersAboutPost } from "../server/lib/postNotifications";

// Default seed posts (used when DB is empty on first run)
import { blogPosts as defaultPosts } from "../src/app/data/posts";

const COLLECTION = "posts";

function buildIdFilter(id: string) {
    const filters: Array<Record<string, unknown>> = [{ id }, { _id: id }];
    if (ObjectId.isValid(id)) {
        filters.push({ _id: new ObjectId(id) });
    }
    return { $or: filters };
}

function sanitizePostResponse(post: Record<string, any>) {
    const { _id, ...rest } = post;
    const normalized: Record<string, any> = { ...rest, id: rest.id || String(_id) };

    for (const [key, value] of Object.entries(normalized)) {
        if (value === null) {
            delete normalized[key];
        }
    }

    return normalized;
}

async function promoteLatestPostToMainStory(collection: any): Promise<string | null> {
    const latestPost = await collection.find({}).sort({ _id: -1 }).limit(1).next();
    if (!latestPost) return null;

    await collection.updateMany({ mainStory: true }, { $set: { mainStory: false } });
    await collection.updateOne({ _id: latestPost._id }, { $set: { mainStory: true } });

    return (latestPost.id as string | undefined) || String(latestPost._id);
}

async function markPostSubscribersNotified(collection: any, id: string) {
    await collection.updateOne(buildIdFilter(id), {
        $set: { notifiedSubscribersAt: new Date().toISOString() },
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    applyCors(req, res);
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);

        // ─── GET: Fetch all posts ───
        if (req.method === "GET") {
            // Preview mode: fetch a single draft by its secret preview token
            const previewToken = req.query.preview as string | undefined;
            if (previewToken) {
                const draft = await collection.findOne({ previewToken });
                if (!draft) return res.status(404).json({ error: "Preview not found or token expired" });
                return res.status(200).json(sanitizePostResponse(draft));
            }

            let posts = await collection.find({}).sort({ _id: -1 }).toArray();

            // If empty, seed with defaults
            if (posts.length === 0 && defaultPosts.length > 0) {
                await collection.insertMany(
                    defaultPosts.map((p) => ({ ...p, _id: p.id as any }))
                );
                posts = await collection.find({}).sort({ _id: -1 }).toArray();
            }

            // Map _id → id for client compatibility
            let result = posts.map((p) => sanitizePostResponse(p));

            // Admin-authenticated requests can see everything. Public requests
            // should not receive drafts or future-scheduled posts.
            const isAdmin = hasAdminAuth(req);
            if (!isAdmin) {
                const now = new Date();
                result = result.filter((p: any) => {
                    if (p.isDraft) return false;
                    if (!p.publishAt) return true; // No schedule = visible immediately
                    return new Date(p.publishAt) <= now;
                });
            }

            res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
            return res.status(200).json(result);
        }

        // ─── POST: Create a new post ───
        if (req.method === "POST") {
            if (!requireAuth(req, res)) return;
            const postData = { ...req.body };
            const id = Date.now().toString();
            if (postData.previewToken == null) delete postData.previewToken;
            if (postData.publishAt == null) delete postData.publishAt;
            // Auto-generate preview token for drafts
            if (postData.isDraft && !postData.previewToken) {
                postData.previewToken = randomBytes(12).toString("hex");
            }

            if (!postData.slug && postData.title) {
                const baseSlug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                if (baseSlug) {
                    let finalSlug = baseSlug;
                    let counter = 1;
                    while (await collection.findOne({ slug: finalSlug })) {
                        finalSlug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                    postData.slug = finalSlug;
                }
            }

            const newPost = { ...postData, id, _id: id as any };
            await collection.insertOne(newPost);

            if (isPostLive(newPost) && !newPost.notifiedSubscribersAt) {
                try {
                    const result = await notifySubscribersAboutPost(db, newPost);
                    if (result.sent > 0) {
                        await markPostSubscribersNotified(collection, id);
                    }
                } catch (notificationError) {
                    console.error("Failed to auto-notify subscribers for new post:", notificationError);
                }
            }

            return res.status(201).json(sanitizePostResponse(newPost));
        }

        // ─── PUT: Update a post ───
        if (req.method === "PUT") {
            if (!requireAuth(req, res)) return;
            const { id, ...updates } = req.body;
            if (!id) return res.status(400).json({ error: "Missing post id" });

            const existing = await collection.findOne(buildIdFilter(id));
            const setUpdates = { ...updates } as Record<string, any>;
            const unsetUpdates: Record<string, "" | 1> = {};

            // Auto-generate preview token for drafts that don't have one
            if (setUpdates.isDraft && !setUpdates.previewToken) {
                if (existing && !existing.previewToken) {
                    setUpdates.previewToken = randomBytes(12).toString("hex");
                }
            }

            const wasDraft = existing?.isDraft !== false;
            const isPublishingNow = setUpdates.isDraft === false;

            // Constantly update the slug while in draft form or during the exact moment of publishing.
            // Never update it after it's been published to avoid breaking SEO/links.
            if (existing && (!existing.slug || wasDraft || isPublishingNow)) {
                const titleToSlugify = setUpdates.title || existing.title;
                if (titleToSlugify && titleToSlugify !== "Untitled Draft") {
                    const baseSlug = titleToSlugify.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    if (baseSlug) {
                        let finalSlug = baseSlug;
                        let counter = 1;
                        // Avoid colliding with other posts, ignoring THIS post
                        while (await collection.findOne({ slug: finalSlug, ...({ $nor: [buildIdFilter(id)] }) })) {
                            finalSlug = `${baseSlug}-${counter}`;
                            counter++;
                        }
                        setUpdates.slug = finalSlug;
                    }
                }
            }

            if (Object.prototype.hasOwnProperty.call(setUpdates, "publishAt") && (setUpdates.publishAt == null || setUpdates.publishAt === "")) {
                delete setUpdates.publishAt;
                unsetUpdates.publishAt = "";
            }

            // Clear preview token when publishing or when null sneaks into the payload.
            if (setUpdates.isDraft === false || setUpdates.previewToken == null) {
                delete setUpdates.previewToken;
                unsetUpdates.previewToken = "";
            }

            const updateOperation: Record<string, any> = {};
            if (Object.keys(setUpdates).length > 0) {
                updateOperation.$set = setUpdates;
            }
            if (Object.keys(unsetUpdates).length > 0) {
                updateOperation.$unset = unsetUpdates;
            }

            const result = await collection.updateOne(buildIdFilter(id), updateOperation);
            if (result.matchedCount === 0) {
                if (setUpdates.mainStory === true) {
                    const fallbackMainStoryId = await promoteLatestPostToMainStory(collection);
                    if (fallbackMainStoryId) {
                        return res.status(200).json({
                            success: true,
                            fallbackApplied: true,
                            mainStoryId: fallbackMainStoryId,
                            message: "No matching post found. Latest post promoted to Main Story.",
                        });
                    }
                    return res.status(404).json({ error: "Post not found and no posts are available for Main Story fallback" });
                }
                return res.status(404).json({ error: "Post not found" });
            }

            if (existing) {
                const mergedPost = {
                    ...existing,
                    ...setUpdates,
                    id: existing.id || id,
                } as Record<string, any>;

                if (unsetUpdates.previewToken) delete mergedPost.previewToken;
                if (unsetUpdates.publishAt) delete mergedPost.publishAt;

                const shouldNotifyNow =
                    !existing.notifiedSubscribersAt &&
                    !isPostLive(existing as { isDraft?: boolean | null; publishAt?: string | null }) &&
                    isPostLive(mergedPost);

                if (shouldNotifyNow) {
                    try {
                        const notificationResult = await notifySubscribersAboutPost(db, mergedPost as any);
                        if (notificationResult.sent > 0) {
                            await markPostSubscribersNotified(collection, id);
                        }
                    } catch (notificationError) {
                        console.error("Failed to auto-notify subscribers for published post:", notificationError);
                    }
                }
            }

            return res.status(200).json({ success: true });
        }

        // ─── DELETE: Delete a post ───
        if (req.method === "DELETE") {
            if (!requireAuth(req, res)) return;
            const id = req.query.id as string;
            if (!id) return res.status(400).json({ error: "Missing post id" });

            const result = await collection.deleteOne(buildIdFilter(id));
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Post not found" });
            }
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
