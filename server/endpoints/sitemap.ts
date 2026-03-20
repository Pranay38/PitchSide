import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../../api/_db.js";

const SITE_URL = "https://thetouchlinedribble.com";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/about", priority: "0.4", changefreq: "monthly" },
  { path: "/daily-fix", priority: "0.7", changefreq: "daily" },
  { path: "/archive", priority: "0.5", changefreq: "daily" },
  { path: "/transfers", priority: "0.6", changefreq: "weekly" },
  { path: "/transfer-tracker", priority: "0.6", changefreq: "daily" },
  { path: "/stories", priority: "0.6", changefreq: "weekly" },
  { path: "/tactics", priority: "0.5", changefreq: "weekly" },
  { path: "/collections", priority: "0.5", changefreq: "weekly" },
  { path: "/debates", priority: "0.6", changefreq: "weekly" },
];

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
}

export default async function sitemapHandler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { db } = await connectToDatabase();

    // Fetch published posts
    const posts = await db
      .collection("posts")
      .find({ isDraft: { $ne: true } })
      .sort({ _id: -1 })
      .project({ id: 1, slug: 1, date: 1, updatedAt: 1 })
      .toArray();

    // Fetch published stories
    const stories = await db
      .collection("stories")
      .find({ isDraft: { $ne: true } })
      .sort({ _id: -1 })
      .project({ slug: 1, createdAt: 1, updatedAt: 1 })
      .toArray();

    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static routes
    for (const route of STATIC_ROUTES) {
      xml += urlEntry(`${SITE_URL}${route.path}`, now, route.changefreq, route.priority);
    }

    // Blog posts
    for (const post of posts) {
      const postId = post.slug || post.id || String(post._id);
      const lastmod = post.updatedAt || post.date || now;
      xml += urlEntry(
        `${SITE_URL}/post/${postId}`,
        new Date(lastmod).toISOString(),
        "weekly",
        "0.8"
      );
    }

    // Stories
    for (const story of stories) {
      if (!story.slug) continue;
      const lastmod = story.updatedAt || story.createdAt || now;
      xml += urlEntry(
        `${SITE_URL}/stories/${story.slug}`,
        new Date(lastmod).toISOString(),
        "monthly",
        "0.6"
      );
    }

    xml += `</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).send(xml);
  } catch (error: any) {
    console.error("Sitemap generation error:", error);
    return res.status(500).send("<!-- Sitemap generation failed -->");
  }
}
