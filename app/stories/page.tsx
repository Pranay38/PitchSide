import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { StoriesPage as StoriesPageOriginal } from "@/app/pages/StoriesPage";
import { getStoriesServer } from "@/lib/server-data";
import type { StoryFeature } from "@/app/data/stories";

export const dynamic = "force-dynamic";

const getPublicStories = unstable_cache(getStoriesServer, ["public-stories-list"], { revalidate: 60 });

export const metadata: Metadata = {
  title: "Stories — Longform Football Narratives",
  description:
    "Deep-dive football stories, immersive longform narratives, and premium visual features from The Touchline Dribble.",
  openGraph: {
    title: "Stories — Longform Football Narratives",
    description:
      "Deep-dive football stories, immersive longform narratives, and premium visual features.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/stories",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/stories" },
};

export default async function StoriesPage() {
  const stories = await getPublicStories();
  return <StoriesPageOriginal initialStories={stories as StoryFeature[]} />;
}
