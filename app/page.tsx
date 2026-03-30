import { getPublishedPostsServer, getStoriesServer, getSiteSettingsServer } from "@/lib/server-data";
import { HomePageClient } from "./HomePageClient";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const [posts, stories, siteSettings] = await Promise.all([
    getPublishedPostsServer(),
    getStoriesServer(),
    getSiteSettingsServer(),
  ]);

  return (
    <HomePageClient
      initialPosts={posts}
      initialStories={stories}
      initialSettings={siteSettings}
    />
  );
}
