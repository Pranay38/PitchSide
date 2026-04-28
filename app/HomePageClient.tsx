"use client";

/**
 * HomePageClient — the interactive client wrapper for HomePage.
 * Receives server-fetched data as props and passes them to HomePage
 * so React Query can use them as initialData for SSR hydration.
 */
import { HomePage as HomePageOriginal } from "@/app/pages/HomePage";

interface HomePageClientProps {
  initialPosts: any[];
  initialStories: any[];
  initialSettings: any;
}

export function HomePageClient({
  initialPosts,
  initialStories,
  initialSettings,
}: HomePageClientProps) {
  return (
    <HomePageOriginal
      serverPosts={initialPosts}
      serverStories={initialStories}
      serverSettings={initialSettings}
    />
  );
}
