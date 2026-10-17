import { PUBLICATION_DESCRIPTION } from "@/app/lib/publication";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { HomePageClient } from "./HomePageClient";
import { getPublishedPostsServer, getStoriesServer, getSiteSettingsServer } from "@/lib/server-data";
import { selectMatchdayContent } from "@/app/lib/matchdayContent";
import type { BlogPost } from "@/app/data/posts";
import type { StoryFeature } from "@/app/data/stories";

// Keep the page dynamic so builds without database access cannot cache an empty page.
export const dynamic = "force-dynamic";

const getHomepageData = unstable_cache(
  async () => {
    const [allPosts, stories, siteSettings] = await Promise.all([
      getPublishedPostsServer(),
      getStoriesServer(),
      getSiteSettingsServer(),
    ]);
    const content = selectMatchdayContent(
      allPosts as BlogPost[],
      stories as StoryFeature[],
      siteSettings.homepageCuration,
    );
    const selectedPosts = [
      content.hero,
      ...content.verdicts,
      ...content.explainers,
      ...content.latest,
      ...content.archive,
    ].filter((post) => post != null);
    const posts = [...new Map(selectedPosts.map((post) => [post.id, post])).values()].map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.excerpt,
      coverImage: post.coverImage,
      club: post.club,
      category: post.category,
      tags: post.tags,
      date: post.date,
      publishAt: post.publishAt,
      readTime: post.readTime,
      author: post.author,
      contentKind: post.contentKind,
      format: post.format,
      mainStory: post.mainStory,
      editorPick: post.editorPick,
      editorial: post.editorial
        ? { verdict: post.editorial.verdict, shareQuote: post.editorial.shareQuote }
        : undefined,
    }));
    return [posts, stories, siteSettings] as const;
  },
  ["public-homepage-data"],
  { revalidate: 60 },
);

export const metadata: Metadata = {
  title: "The Touchline Dribble — Football Tactics, Analysis & Bold Opinions",
  description:
    PUBLICATION_DESCRIPTION,
  openGraph: {
    title: "The Touchline Dribble — Football Tactics, Analysis & Bold Opinions",
    description:
      PUBLICATION_DESCRIPTION,
    type: "website",
    url: "https://www.thetouchlinedribble.in",
    siteName: "The Touchline Dribble",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "The Touchline Dribble — Independent football opinions and explainers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Touchline Dribble — Football Tactics & Bold Opinions",
    description:
      PUBLICATION_DESCRIPTION,
    site: "@TouchlineDribbl",
    creator: "@TouchlineDribbl",
  },
  alternates: {
    canonical: "https://www.thetouchlinedribble.in",
  },
};

export default async function HomePage() {
  const [posts, stories, siteSettings] = await getHomepageData();

  return (
    <HomePageClient
      initialPosts={posts}
      initialStories={stories}
      initialSettings={siteSettings}
    />
  );
}
// Cache buster: force Webpack rebuild
