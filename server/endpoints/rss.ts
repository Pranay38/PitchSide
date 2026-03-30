import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../../api/_db";

/**
 * GET /api/rss
 * Generates an RSS 2.0 feed from the latest published blog posts.
 * Enables RSS readers and podcast apps to discover PitchSide content.
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

    const siteUrl = "https://pitchside-orcin.vercel.app";
    const now = new Date().toUTCString();

    const items = posts.map((post: any) => {
      const pubDate = post.date ? new Date(post.date).toUTCString() : now;
      const link = `${siteUrl}/post/${post.id}`;
      const escapedTitle = escapeXml(post.title || "Untitled");
      const escapedExcerpt = escapeXml(post.excerpt || "");

      return `    <item>
      <title>${escapedTitle}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapedExcerpt}</description>
      ${post.club ? `<category>${escapeXml(post.club)}</category>` : ""}
      ${(post.tags || []).map((t: string) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`;
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PitchSide — Football Analysis &amp; Longform Stories</title>
    <link>${siteUrl}</link>
    <description>Tactical breakdowns, transfer analysis, and longform football storytelling.</description>
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
