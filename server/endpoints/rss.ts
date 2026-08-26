import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../../_api/_db";

/**
 * GET /api/rss
 * Generates an RSS 2.0 feed from the latest published blog posts.
 * Enables RSS readers and podcast apps to discover The Touchline Dribble content.
 */
export default async function rssHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const posts = await db
      .collection("posts")
      .find({ isDraft: { $ne: true } })
      .sort({ date: -1 })
      .limit(30)
      .toArray();

    const siteUrl = "https://www.thetouchlinedribble.in";
    const now = new Date().toUTCString();

    const items = posts.map((post: any) => {
      const pubDate = post.date ? new Date(post.date).toUTCString() : now;
      const postPath = post.slug || post.id;
      const link = `${siteUrl}/post/${postPath}`;
      const escapedTitle = escapeXml(post.title || "Untitled");
      const escapedExcerpt = escapeXml(post.excerpt || "");

      // Deduplicate categories (club + tags)
      const categories = new Set<string>();
      if (post.club) categories.add(post.club);
      if (post.tags) post.tags.forEach((t: string) => categories.add(t));
      const categoryXml = Array.from(categories)
        .map((c) => `<category>${escapeXml(c)}</category>`)
        .join("\n      ");

      return `    <item>
      <title>${escapedTitle}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapedExcerpt}</description>
      ${categoryXml}
    </item>`;
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Touchline Dribble — Tactical Breakdowns &amp; Bold Football Opinions</title>
    <link>${siteUrl}</link>
    <description>From the touchline to your timeline — tactical breakdowns, bold football opinions, and the analysis your pundit missed.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    return res.status(200).send(rss);
  } catch (err) {
    console.error("RSS generation failed:", err);
    return res.status(500).json({ error: "Failed to generate RSS feed" });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
