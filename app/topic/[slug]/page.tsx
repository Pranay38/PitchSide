import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedPostsServer } from "@/lib/server-data";
import { getTopicBySlugServer } from "@/lib/server-topic";
import { TopicPage as TopicPageClient } from "@/app/pages/TopicPage";
import { deslugify, slugify } from "@/app/lib/contentPaths";

export const revalidate = 60;
const SITE_URL = "https://www.thetouchlinedribble.in";

interface Props {
  params: Promise<{ slug: string | string[] }>;
}

function getSlugString(slug: string | string[] | undefined): string {
  return Array.isArray(slug) ? slug[0] : (slug || "");
}

function getTopicMatches(posts: any[], topicSlug: string) {
  const topicNeedle = topicSlug.replace(/-/g, " ");

  return posts.filter((post: any) => {
    const haystacks = [
      post.club,
      post.playerName || "",
      post.title,
      post.excerpt,
      ...(post.tags || []),
    ].map((value) => (value || "").toLowerCase());

    return haystacks.some((value) => value.includes(topicNeedle));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = slugify(getSlugString(slug));
  const topicLabel = deslugify(canonicalSlug);
  const allPosts = canonicalSlug ? await getPublishedPostsServer() : [];
  const topicMatches = canonicalSlug ? getTopicMatches(allPosts, canonicalSlug) : [];
  const shouldIndex = topicMatches.length >= 2;
  const topicDetails = canonicalSlug ? await getTopicBySlugServer(canonicalSlug) : null;
  const pageTitle = topicDetails?.title || `${topicLabel} Coverage | The Touchline Dribble`;
  const pageDesc = topicDetails?.description || `Read every Touchline Dribble story tagged with ${topicLabel}.`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `${SITE_URL}/topic/${canonicalSlug}`,
    },
    robots: shouldIndex
      ? undefined
      : {
          index: false,
          follow: true,
        },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      type: "website",
      url: `${SITE_URL}/topic/${canonicalSlug}`,
      ...(topicDetails?.heroImage ? { images: [topicDetails.heroImage] } : {})
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      ...(topicDetails?.heroImage ? { images: [topicDetails.heroImage] } : {})
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const slugString = getSlugString(slug);
  const canonicalSlug = slugify(slugString);

  if (!canonicalSlug) {
    notFound();
  }

  if (slugString !== canonicalSlug) {
    permanentRedirect(`/topic/${canonicalSlug}`);
  }
  
  const allPosts = await getPublishedPostsServer();
  const topicMatches = getTopicMatches(allPosts, canonicalSlug);
  const topicDetails = await getTopicBySlugServer(canonicalSlug);

  if (topicMatches.length === 0) {
    notFound();
  }

  return <TopicPageClient initialPosts={topicMatches as any} topicDetails={topicDetails || undefined} />;
}
