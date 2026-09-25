import type { Metadata } from "next";
import { ClubHubPage as ClubHubPageOriginal } from "@/app/pages/ClubHubPage";
import { getAllClubs } from "@/app/data/clubs";
import { deslugify, slugify } from "@/app/lib/contentPaths";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = getAllClubs().find((entry) => slugify(entry.name) === slugify(slug));
  const clubName = club?.name || deslugify(slug);
  const canonicalSlug = club ? slugify(club.name) : slugify(slug);

  return {
    title: `${clubName} News, Transfers & Analysis | The Touchline Dribble`,
    description: `Latest ${clubName} news, transfer updates, match analysis and tactical coverage from The Touchline Dribble.`,
    openGraph: {
      title: `${clubName} News, Transfers & Analysis | The Touchline Dribble`,
      description: `Latest ${clubName} coverage from The Touchline Dribble.`,
      type: "website",
      url: `https://www.thetouchlinedribble.in/club/${canonicalSlug}`,
    },
    robots: { index: Boolean(club), follow: true },
    alternates: { canonical: `https://www.thetouchlinedribble.in/club/${canonicalSlug}` },
  };
}

export default function ClubHubPage() {
  return <ClubHubPageOriginal />;
}
