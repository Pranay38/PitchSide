import type { Metadata } from "next";
import { TacticalBoardPage as TacticalBoardPageOriginal } from "@/app/pages/TacticalBoardPage";

export const metadata: Metadata = {
  title: "Tactical Board — Football Formations & Analysis",
  description:
    "Interactive tactical board with formations, heat maps, and positional analysis. Understand how football teams set up and play.",
  openGraph: {
    title: "Tactical Board — Football Formations & Analysis",
    description:
      "Interactive tactical board with formations, heat maps, and positional analysis.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/tactics",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/tactics" },
};

export default function TacticsPage() {
  return <TacticalBoardPageOriginal />;
}
