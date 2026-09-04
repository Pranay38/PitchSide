import type { Metadata } from "next";
import { WeeklyDigestPage } from "@/app/pages/WeeklyDigestPage";
import { getPublishedPostsServer } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "The Whistle — Weekly Digest | The Touchline Dribble",
  description: "The best tactical analysis and bold opinions from the last 7 days.",
};

export default async function WeeklyPage() {
  const posts = await getPublishedPostsServer();
  return <WeeklyDigestPage initialPosts={posts} />;
}
