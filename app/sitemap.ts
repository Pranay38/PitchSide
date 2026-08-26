import type { MetadataRoute } from 'next';
import { getPublishedPostsServer, getSiteSettingsServer, getStoriesServer } from '@/lib/server-data';
import { slugify } from '@/app/lib/contentPaths';
import { buildTransferReliabilityBoard } from '@/app/lib/transferReliability';
import fs from 'fs';
import path from 'path';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, stories, siteSettings] = await Promise.all([
    getPublishedPostsServer(),
    getStoriesServer(),
    getSiteSettingsServer(),
  ]);
  const baseUrl = 'https://www.thetouchlinedribble.in';
  const now = new Date();
  const nonClubLabels = new Set([
    'analysis',
    'champions league',
    'general',
    'la liga',
    'match preview',
    'match review',
    'opinion',
    'premier league',
    'tactics',
    'transfers',
  ]);

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/transfers`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tactics`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Static content pages (previously missing from sitemap)
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/archive`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/debates`, priority: 0.7, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/daily-fix`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/quick-takes`, priority: 0.7, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/transfer-tracker`, priority: 0.7, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/glossary`, priority: 0.6, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/collections`, priority: 0.6, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/pots`, priority: 0.6, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/world-cup-xi`, priority: 0.6, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/about`, priority: 0.5, changeFrequency: 'monthly' as const },
  ].map(p => ({ ...p, lastModified: now }));

  // Article pages
  const postRoutes = posts.map((post: any) => ({
    url: `${baseUrl}/post/${post.slug || post.id}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(post.date),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Story pages
  const storyRoutes = stories.map((story: any) => ({
    url: `${baseUrl}/stories/${story.slug}`,
    lastModified: story.updatedAt ? new Date(story.updatedAt) : new Date(story.date),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Topic/tag pages. Keep one-post topic archives out of the sitemap; they are
  // useful for browsing, but too thin and duplicate-adjacent for Google.
  const tagCounts = new Map<string, { tag: string; count: number; lastModified: Date }>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const tagSlug = slugify(String(tag));
      if (!tagSlug) continue;
      const postModified = post.updatedAt ? new Date(post.updatedAt) : new Date(post.date);
      const previous = tagCounts.get(tagSlug);
      tagCounts.set(tagSlug, {
        tag: String(tag),
        count: (previous?.count || 0) + 1,
        lastModified: previous && previous.lastModified > postModified ? previous.lastModified : postModified,
      });
    }
  }
  const tagRoutes: MetadataRoute.Sitemap = [...tagCounts.entries()]
    .filter(([, value]) => value.count >= 2)
    .map(([tagSlug, value]) => ({
      url: `${baseUrl}/topic/${tagSlug}`,
      lastModified: value.lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

  // Club hub pages (auto-generated from unique clubs across all posts)
  const uniqueClubs = [...new Set(posts.map((p: any) => p.club).filter(Boolean))]
    .filter((club) => !nonClubLabels.has(String(club).trim().toLowerCase()));
  const clubRoutes: MetadataRoute.Sitemap = uniqueClubs.map((club: string) => ({
    url: `${baseUrl}/club/${slugify(club)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const transferDossierRoutes: MetadataRoute.Sitemap = buildTransferReliabilityBoard(siteSettings.transferWatch || [])
    .map((entry) => ({
      url: `${baseUrl}/transfers/${entry.dossierSlug}`,
      lastModified: entry.updatedAt ? new Date(entry.updatedAt) : now,
      changeFrequency: 'daily' as const,
      priority: entry.reliabilityScore >= 75 ? 0.8 : 0.6,
    }));

  // ─── Programmatic SEO: Manager Pressure Pages ───
  let managerRoutes: MetadataRoute.Sitemap = [];
  try {
    const managerDataPath = path.join(process.cwd(), 'data', 'manager_pressure.json');
    if (fs.existsSync(managerDataPath)) {
      const managerData = JSON.parse(fs.readFileSync(managerDataPath, 'utf-8'));
      managerRoutes = Object.keys(managerData).map((slug) => ({
        url: `${baseUrl}/managers/${slug}`,
        lastModified: managerData[slug].lastUpdated ? new Date(managerData[slug].lastUpdated) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Failed to load manager pressure data', e);
  }

  // ─── Programmatic SEO: Tactical Matchup Pages ───
  let matchupRoutes: MetadataRoute.Sitemap = [];
  try {
    const matchupDataPath = path.join(process.cwd(), 'data', 'matchups.json');
    if (fs.existsSync(matchupDataPath)) {
      const matchupData = JSON.parse(fs.readFileSync(matchupDataPath, 'utf-8'));
      matchupRoutes = Object.keys(matchupData).map((slug) => ({
        url: `${baseUrl}/matchups/${slug}`,
        lastModified: matchupData[slug].lastUpdated ? new Date(matchupData[slug].lastUpdated) : now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Failed to load matchup data', e);
  }

  return [...routes, ...staticPages, ...postRoutes, ...storyRoutes, ...tagRoutes, ...clubRoutes, ...transferDossierRoutes, ...managerRoutes, ...matchupRoutes];
}
