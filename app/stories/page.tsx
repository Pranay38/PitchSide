import type { Metadata } from "next";
import { StoriesPage as StoriesPageOriginal } from "@/app/pages/StoriesPage";

export const metadata: Metadata = {
  title: "Stories — Longform Football Narratives",
  description:
    "Deep-dive football stories, immersive longform narratives, and premium visual features from The Touchline Dribble.",
  openGraph: {
    title: "Stories — Longform Football Narratives",
    description:
      "Deep-dive football stories, immersive longform narratives, and premium visual features.",
    type: "website",
    url: "https://thetouchlinedribble.in/stories",
  },
  alternates: { canonical: "https://thetouchlinedribble.in/stories" },
};

export default function StoriesPage() {
  return <StoriesPageOriginal />;
}
