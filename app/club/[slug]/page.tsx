import type { Metadata } from "next";
import { ClubHubPage as ClubHubPageOriginal } from "@/app/pages/ClubHubPage";
import { deslugify } from "@/app/lib/contentPaths";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const clubName = deslugify(slug);

  return {
    title: `${clubName} — Latest News, Analysis & Transfers`,
    description: `Everything about ${clubName} — tactical breakdowns, transfer rumours, match analysis, and opinion pieces from The Touchline Dribble.`,
    openGraph: {
      title: `${clubName} — Latest News & Analysis`,
      description: `All ${clubName} coverage from The Touchline Dribble.`,
      type: "website",
      url: `https://thetouchlinedribble.in/club/${slug}`,
    },
    alternates: { canonical: `https://thetouchlinedribble.in/club/${slug}` },
  };
}

export default function ClubHubPage() {
  return <ClubHubPageOriginal />;
}
