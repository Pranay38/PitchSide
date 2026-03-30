import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostByIdServer, getPublishedPostsServer } from "@/lib/server-data";
import { BlogPostPageClient } from "./BlogPostPageClient";

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostByIdServer(id);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const ogImageUrl = `https://thetouchlinedribble.in/api/og?title=${encodeURIComponent(post.title)}${post.club ? `&club=${encodeURIComponent(post.club)}` : ""}${post.date ? `&date=${encodeURIComponent(post.date)}` : ""}`;

  return {
    title: post.title,
    description: post.excerpt || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      url: `https://thetouchlinedribble.in/post/${id}`,
      images: [
        {
          url: post.coverImage || ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
      siteName: "The Touchline Dribble",
      publishedTime: post.date ? new Date(post.date).toISOString() : undefined,
      authors: ["Pranay Agrawal"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: [post.coverImage || ogImageUrl],
      site: "@TouchlineDribbl",
      creator: "@TouchlineDribbl",
    },
    alternates: {
      canonical: `https://thetouchlinedribble.in/post/${id}`,
    },
    other: {
      // JSON-LD will be added in the page component
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostByIdServer(id);

  if (!post) {
    notFound();
  }

  // JSON-LD structured data for the article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt || "",
    image: [post.coverImage],
    datePublished: post.date
      ? new Date(post.date).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : post.date
        ? new Date(post.date).toISOString()
        : undefined,
    articleSection: post.club || "Football",
    wordCount: post.content?.split(/\s+/).length || 0,
    author: [
      {
        "@type": "Person",
        name: "Pranay Agrawal",
        url: "https://x.com/TouchlineDribbl",
      },
    ],
    publisher: {
      "@type": "Organization",
      name: "The Touchline Dribble",
      logo: {
        "@type": "ImageObject",
        url: "https://thetouchlinedribble.in/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://thetouchlinedribble.in/post/${post.id}`,
    },
  };

  return (
    <>
      {/* Server-rendered JSON-LD — Google sees this immediately */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostPageClient postId={id} initialPost={post} />
    </>
  );
}
