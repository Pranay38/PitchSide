import type { Metadata } from "next";
import { LeaderboardPage as LeaderboardPageOriginal } from "@/app/pages/LeaderboardPage";

export const metadata: Metadata = {
  title: "Leaderboard — Top Contributors & Readers",
  description:
    "See who's leading the Touchline Dribble community — top commenters, most active readers, and engagement leaders.",
  openGraph: {
    title: "Leaderboard — Top Contributors",
    description:
      "See who's leading the Touchline Dribble community.",
    type: "website",
    url: "https://thetouchlinedribble.in/leaderboard",
  },
  alternates: { canonical: "https://thetouchlinedribble.in/leaderboard" },
};

export default function LeaderboardPage() {
  return <LeaderboardPageOriginal />;
}
