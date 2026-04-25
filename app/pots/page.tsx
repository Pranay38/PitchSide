import type { Metadata } from "next";
import { POTSPage as POTSPageOriginal } from "@/app/pages/POTSPage";

export const metadata: Metadata = {
  title: "Player of the Season — Fan Voting & Rankings",
  description:
    "Vote for your Player of the Season across Europe's top leagues. Community-driven rankings powered by fan opinions and data.",
  openGraph: {
    title: "Player of the Season — Fan Voting",
    description:
      "Vote for your Player of the Season. Community-driven rankings.",
    type: "website",
    url: "https://thetouchlinedribble.in/pots",
  },
  alternates: { canonical: "https://thetouchlinedribble.in/pots" },
};

export default function POTSPage() {
  return <POTSPageOriginal />;
}
