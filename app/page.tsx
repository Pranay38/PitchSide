import { PUBLICATION_DESCRIPTION } from "@/app/lib/publication";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { HomePageClient } from "./HomePageClient";
import { getPublishedPostsServer, getStoriesServer, getSiteSettingsServer } from "@/lib/server-data";

// Keep the page dynamic so builds without database access cannot cache an empty page.
export const dynamic = "force-dynamic";

const getHomepageData = unstable_cache(
  () => Promise.all([getPublishedPostsServer(), getStoriesServer(), getSiteSettingsServer()]),
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
