import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoryBySlugServer } from '@/lib/server-data';
import { StoryPage as StoryPageClient } from '@/app/pages/StoryPage';
import type { StoryFeature } from '@/app/data/stories';

// Render the article on the server, including components using search params.
// A static route can otherwise fall back to the surrounding empty Suspense shell.
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; storyId?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  if ((await searchParams).preview === '1') {
    return { title: 'Story Preview', robots: { index: false, follow: false } };
  }
  const { slug } = await params;
  const story = await getStoryBySlugServer(slug);

  if (!story) {
    notFound();
  }

  const ogImageUrl = `https://www.thetouchlinedribble.in/api/og?title=${encodeURIComponent(story.title)}&club=${encodeURIComponent(story.eyebrow || '')}&date=${encodeURIComponent(story.date || '')}${story.coverImage ? `&image=${encodeURIComponent(story.coverImage)}` : ''}`;

  return {
    title: story.title,
    description: story.excerpt || '',
    openGraph: {
      title: story.title,
      description: story.excerpt || '',
      type: 'article',
      url: `https://www.thetouchlinedribble.in/stories/${story.slug}`,
      images: [
        {
          url: ogImageUrl,
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
      images: [ogImageUrl],
      site: '@TouchlineDribbl',
      creator: '@TouchlineDribbl',
    },
    alternates: {
      canonical: `https://www.thetouchlinedribble.in/stories/${story.slug}`,
    },
  };
}

export default async function StoryPageServer({ params, searchParams }: Props) {
  const { slug } = await params;
  const isPreview = (await searchParams).preview === '1';
  const story = await getStoryBySlugServer(slug);

  if (!story && !isPreview) notFound();

  return <StoryPageClient key={slug} initialStory={story as StoryFeature | undefined} />;
}
