import { connectToDatabase } from "./_db";
import { ObjectId } from "mongodb";

// Record a view and update co-view counts
export async function recordArticleView({ articleId, sessionId, userId = null }: { articleId: string, sessionId: string, userId?: string | null }) {
  const { db } = await connectToDatabase();
  const now = new Date();

  // 1. Log this view
  await db.collection("article_views").insertOne({
    articleId,
    sessionId,
    userId,
    viewedAt: now,
    // TTL index on this field - views expire after 30 days
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  });

  // 2. Find other articles this session viewed (last 20, within 2 hrs)
  const recentViews = await db.collection("article_views").find({
    sessionId,
    articleId: { $ne: articleId }, // not this article
    viewedAt: { $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
  })
  .sort({ viewedAt: -1 })
  .limit(20)
  .toArray();

  if (recentViews.length === 0) return;

  // 3. Increment co-view count for each pair
  const bulkOps = recentViews.map(view => {
    // Always store pairs in sorted order so (A,B) and (B,A) are the same doc
    const [idA, idB] = [articleId, view.articleId].sort();
    return {
      updateOne: {
        filter: { articleIdA: idA, articleIdB: idB },
        update: {
          $inc:  { count: 1 },
          $set:  { updatedAt: now },
          $setOnInsert: { articleIdA: idA, articleIdB: idB, createdAt: now },
        },
        upsert: true,
      },
    };
  });

  if (bulkOps.length > 0) {
    await db.collection("article_coviews").bulkWrite(bulkOps);
  }
}

// Get recommendations for an article
export async function getRecommendations({ articleId, limit = 5, excludeIds = [] }: { articleId: string, limit?: number, excludeIds?: string[] }) {
  const { db } = await connectToDatabase();

  // Find all co-view pairs involving this article
  const coviews = await db.collection("article_coviews").find({
    $or: [
      { articleIdA: articleId },
      { articleIdB: articleId },
    ],
    count: { $gte: 2 }, // at least 2 co-views before recommending
  })
  .sort({ count: -1 })
  .limit(limit * 3) // fetch more, filter below
  .toArray();

  if (coviews.length === 0) return [];

  // Extract the "other" article from each pair
  const relatedIds = coviews
    .map(cv => cv.articleIdA === articleId ? cv.articleIdB : cv.articleIdA)
    .filter(id => !excludeIds.includes(id))
    .slice(0, limit);

  if (relatedIds.length === 0) return [];

  // Fetch full article data
  // Note: Vercel serverless environment might not like parsing strings to ObjectId if post IDs are strings in DB.
  // PitchSide posts use string IDs like `arsenal-title-race` or UUIDs.
  // Let's ensure string matching here since the blog engine uses string IDs.
  const articles = await db.collection("posts").find({
    id: { $in: relatedIds },
    status: "published",
  })
  .project({
    id: 1, title: 1, slug: 1, excerpt: 1, coverImage: 1,
    club: 1, tags: 1, date: 1, readTime: 1, author: 1,
  })
  .toArray();

  // Re-sort by co-view count (MongoDB find doesn't preserve order)
  return relatedIds
    .map(id => articles.find(a => a.id === id))
    .filter(Boolean);
}

// Fallback: tag-based recommendations (when no co-view data yet)
export async function getTagBasedFallback({ articleId, tags = [], club, limit = 5 }: { articleId: string, tags?: string[], club?: string, limit?: number }) {
  const { db } = await connectToDatabase();

  const query: any = {
    id: { $ne: articleId },
    status: "published",
  };

  if (tags.length > 0 || club) {
    query.$or = [];
    if (tags.length > 0) query.$or.push({ tags: { $in: tags } });
    if (club) query.$or.push({ club: club });
  }

  return db.collection("posts").find(query)
  .sort({ date: -1 })
  .limit(limit)
  .project({
    id: 1, title: 1, slug: 1, excerpt: 1, coverImage: 1,
    club: 1, tags: 1, date: 1, readTime: 1,
  })
  .toArray();
}
