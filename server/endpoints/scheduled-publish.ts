import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { isPostLive, notifySubscribersAboutPost } from "../lib/postNotifications";

export default async function scheduledPublishHandler(req: VercelRequest, res: VercelResponse) {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection("posts");
        
        const isCronTrigger = req.method === "GET" && !!req.headers["x-vercel-cron"];
        const isManualRefresh = req.method === "POST";
        
        if (isCronTrigger || isManualRefresh) {
            const now = new Date().toISOString();
            
            const filter = {
                isDraft: true,
                publishAt: { $lte: now }
            };
            
            const postsToPublish = await collection.find(filter).toArray();
            
            if (postsToPublish.length > 0) {
                await collection.updateMany(
                    filter,
                    { 
                        $set: { isDraft: false, date: now },
                        $unset: { previewToken: "", publishAt: "" }
                    }
                );
                
                for (const p of postsToPublish) {
                    const publishedPost: any = { ...p, isDraft: false, date: now };
                    delete publishedPost.previewToken;
                    delete publishedPost.publishAt;
                    
                    if (!p.notifiedSubscribersAt && isPostLive(publishedPost as any)) {
                        try {
                            const result = await notifySubscribersAboutPost(db, publishedPost as any);
                            if (result.sent > 0) {
                                await collection.updateOne({ _id: p._id }, {
                                    $set: { notifiedSubscribersAt: new Date().toISOString() }
                                });
                            }
                        } catch (err) {
                            console.error("Failed to notify for scheduled post", err);
                        }
                    }
                }
            }
            
            if (isCronTrigger) {
                await db.collection("cron_logs").updateOne(
                    { jobName: "scheduled-publish" },
                    { $set: { lastRunAt: new Date().toISOString(), status: "success", count: postsToPublish.length } },
                    { upsert: true }
                );
            }
            
            return res.status(200).json({ success: true, count: postsToPublish.length });
        }
        
        return res.status(405).json({ error: "Method not allowed" });
    } catch (error: any) {
        console.error("scheduled-publish error:", error);
        try {
            const { db } = await connectToDatabase();
            if (req.method === "GET" && !!req.headers["x-vercel-cron"]) {
                await db.collection("cron_logs").updateOne(
                    { jobName: "scheduled-publish" },
                    { $set: { lastRunAt: new Date().toISOString(), status: "failed", error: String(error) } },
                    { upsert: true }
                );
            }
        } catch (e) {}
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
