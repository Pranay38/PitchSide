import type { Metadata } from "next";
import { WeeklyVerdictsPage as WeeklyVerdictsPageOriginal } from "@/app/pages/WeeklyVerdictsPage";

export const metadata: Metadata = {
  title: "Weekly Verdicts — The Touchline Dribble",
  description:
    "Bite-sized tactical observations, rapid reactions, and short weekly analysis.",
  openGraph: {
    title: "Weekly Verdicts — The Touchline Dribble",
    description:
      "Bite-sized tactical observations, rapid reactions, and short weekly analysis.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/weekly-verdicts",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/weekly-verdicts" },
};

export default function WeeklyVerdictsPage() {
  return <WeeklyVerdictsPageOriginal />;
}
