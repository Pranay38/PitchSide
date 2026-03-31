import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoryBySlugServer, getStoriesServer } from '@/lib/server-data';
import { StoryPage as StoryPageClient } from '@/app/pages/StoryPage';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const stories = await getStoriesServer();
  return stories.map((story: any) => ({
    slug: story.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlugServer(slug);

  if (!story) {
    return { title: 'Story Not Found' };
  }

  const ogImageUrl = `https://thetouchlinedribble.in/api/og?title=${encodeURIComponent(story.title)}&club=${encodeURIComponent(story.eyebrow || '')}&date=${encodeURIComponent(story.date || '')}`;

  return {
    title: story.title,
    description: story.excerpt || '',
    openGraph: {
      title: story.title,
      description: story.excerpt || '',
      type: 'article',
      url: `https://thetouchlinedribble.in/stories/${story.slug}`,
      images: [
        {
          url: story.coverImage || ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
      siteName: 'The Touchline Dribble',
      publishedTime: story.date ? new Date(story.date).toISOString() : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: story.title,
      description: story.excerpt || '',
      images: [story.coverImage || ogImageUrl],
      site: '@TouchlineDribbl',
      creator: '@TouchlineDribbl',
    },
    alternates: {
      canonical: `https://thetouchlinedribble.in/stories/${story.slug}`,
    },
  };
}

export default async function StoryPageServer({ params }: Props) {
  const { slug } = await params;
  const story = await getStoryBySlugServer(slug);

  if (!story && process.env.NODE_ENV !== 'development') {
    // In dev we might rely on the client fallback
  }

  return <StoryPageClient />;
}
