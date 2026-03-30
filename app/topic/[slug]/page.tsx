import type { Metadata } from "next";
import { getPublishedPostsServer } from "@/lib/server-data";
import { TopicPage as TopicPageClient } from "@/app/pages/TopicPage";
import { deslugify } from "@/app/lib/contentPaths";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string | string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugString = Array.isArray(slug) ? slug[0] : (slug || "");
  const topicLabel = deslugify(slugString);

  return {
    title: `${topicLabel} Coverage | The Touchline Dribble`,
    description: `Read every Touchline Dribble story tagged with ${topicLabel}.`,
    openGraph: {
      title: `${topicLabel} Coverage | The Touchline Dribble`,
      description: `Read every Touchline Dribble story tagged with ${topicLabel}.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${topicLabel} Coverage | The Touchline Dribble`,
      description: `Read every Touchline Dribble story tagged with ${topicLabel}.`,
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const slugString = Array.isArray(slug) ? slug[0] : (slug || "");
  const normalizedSlug = slugString.toLowerCase();
  
  const allPosts = await getPublishedPostsServer();
  
  const topicMatches = allPosts.filter((post: any) => {
    const haystacks = [
      post.club,
      post.playerName || "",
      post.title,
      post.excerpt,
      ...(post.tags || []),
    ].map((value) => (value || "").toLowerCase());

    return haystacks.some((value) => value.includes(normalizedSlug.replace(/-/g, " ")));
  });

  return <TopicPageClient initialPosts={topicMatches as any} />;
}
