import type { VercelRequest, VercelResponse } from "@vercel/node";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security";
import { connectToDatabase } from "../_db";

// Notification types
export type NotificationType = "comment" | "subscriber" | "poll_milestone" | "prediction";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  meta: Record<string, any>;
  createdAt: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (!checkRateLimit(req, res)) return;
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!(await requireAuth(req, res))) return;

  try {
    const { db } = await connectToDatabase();
    const since = req.query.since
      ? new Date(req.query.since as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

    const notifications: Notification[] = [];

    // 1. New comments
    const recentComments = await db.collection("comments")
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(30)
      .project({ _id: 1, author: 1, content: 1, postId: 1, postTitle: 1, createdAt: 1 })
      .toArray();

    for (const comment of recentComments) {
      const content = typeof comment.content === "string"
        ? comment.content.slice(0, 100)
        : "[comment]";
      notifications.push({
        id: `comment-${comment._id}`,
        type: "comment",
        message: `${comment.author || "Anonymous"} commented: "${content}"`,
        meta: {
          postId: comment.postId,
          postTitle: comment.postTitle || comment.postId,
          author: comment.author || "Anonymous",
          content,
        },
        createdAt: comment.createdAt instanceof Date
          ? comment.createdAt.toISOString()
          : String(comment.createdAt),
      });
    }

    // 2. New subscribers
    const recentSubscribers = await db.collection("subscribers")
      .find({ subscribedAt: { $gte: since } })
      .sort({ subscribedAt: -1 })
      .limit(20)
      .project({ _id: 1, email: 1, subscribedAt: 1 })
      .toArray();

    for (const sub of recentSubscribers) {
      const masked = sub.email
        ? sub.email.replace(/(.{2}).+(@.+)/, "$1***$2")
        : "unknown";
      notifications.push({
        id: `subscriber-${sub._id}`,
        type: "subscriber",
        message: `New subscriber: ${masked}`,
        meta: { email: masked },
        createdAt: sub.subscribedAt instanceof Date
          ? sub.subscribedAt.toISOString()
          : String(sub.subscribedAt || new Date().toISOString()),
      });
    }

    // 3. Poll vote milestones (50, 100, 250, 500, 1000...)
    const polls = await db.collection("polls").find({}).toArray();
    const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000];

    for (const poll of polls) {
      const totalVotes = (poll.options || []).reduce(
        (acc: number, opt: any) => acc + (opt.votes || 0),
        0
      );
      const milestone = MILESTONES.slice().reverse().find((m) => totalVotes >= m);
      if (milestone) {
        const updatedAt = poll.updatedAt || poll.createdAt;
        const ts = updatedAt instanceof Date ? updatedAt : new Date(updatedAt || Date.now());
        if (ts >= since) {
          notifications.push({
            id: `poll-milestone-${poll._id}-${milestone}`,
            type: "poll_milestone",
            message: `"${poll.question || "Poll"}" hit ${milestone.toLocaleString()} votes 🗳️`,
            meta: {
              pollId: String(poll._id),
              question: poll.question,
              totalVotes,
              milestone,
            },
            createdAt: ts.toISOString(),
          });
        }
      }
    }

    // 4. Score predictor submissions
    const recentPredictions = await db.collection("predictions")
      .find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(20)
      .project({ _id: 1, userId: 1, fixtureId: 1, homeScore: 1, awayScore: 1, createdAt: 1 })
      .toArray();

    for (const pred of recentPredictions) {
      notifications.push({
        id: `prediction-${pred._id}`,
        type: "prediction",
        message: `New score prediction: ${pred.homeScore ?? "-"}–${pred.awayScore ?? "-"} on fixture ${pred.fixtureId || "?"}`,
        meta: {
          fixtureId: pred.fixtureId,
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
          userId: pred.userId,
        },
        createdAt: pred.createdAt instanceof Date
          ? pred.createdAt.toISOString()
          : String(pred.createdAt || new Date().toISOString()),
      });
    }

    // Sort all notifications by date desc
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.status(200).json({ notifications, total: notifications.length });
  } catch (error: any) {
    console.error("Notifications API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
