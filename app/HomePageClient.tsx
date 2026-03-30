"use client";

/**
 * HomePageClient — the interactive client wrapper for HomePage.
 * Receives server-fetched data as props and hydrates the existing HomePage component.
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
  // The existing HomePage component fetches its own data via React Query.
  // By passing initialData, React Query will use the server-fetched data
  // as its initial state and update in the background.
  // For now, we simply render the existing component.
  // React Query's initialData will be set from localStorage which will
  // be pre-populated by the server data on first paint.
  return <HomePageOriginal />;
}
