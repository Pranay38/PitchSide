import type { Metadata } from "next";
import { HomePageClient } from "./HomePageClient";
import { getPublishedPostsServer, getStoriesServer, getSiteSettingsServer } from "@/lib/server-data";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export const metadata: Metadata = {
  title: "The Touchline Dribble — Football Tactics, Analysis & Bold Opinions",
  description:
    "Tactical breakdowns your pundit missed. Post-match analysis, formation deep dives, manager pressure watches, and the bold opinions that fuel your group chat. ⚽",
  openGraph: {
    title: "The Touchline Dribble — Football Tactics, Analysis & Bold Opinions",
    description:
      "Tactical breakdowns your pundit missed. Post-match analysis, bold opinions & the football debates that matter. ⚽🔥",
    type: "website",
    url: "https://thetouchlinedribble.in",
    siteName: "The Touchline Dribble",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "The Touchline Dribble — Tactical breakdowns your pundit missed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Touchline Dribble — Football Tactics & Bold Opinions",
    description:
      "Tactical breakdowns your pundit missed. Post-match analysis & bold opinions. ⚽🔥",
    site: "@TouchlineDribbl",
    creator: "@TouchlineDribbl",
  },
  alternates: {
    canonical: "https://thetouchlinedribble.in",
  },
};

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
