import type { Metadata } from "next";
import { AboutPage as AboutPageOriginal } from "@/app/pages/AboutPage";

export const metadata: Metadata = {
  title: "About — The Touchline Dribble",
  description:
    "The Touchline Dribble — tactical breakdowns, bold opinions, and the analysis your pundit missed. Built for fans who want more than vibes.",
  openGraph: {
    title: "About — The Touchline Dribble",
    description:
      "The Touchline Dribble — tactical breakdowns, bold opinions, and the analysis your pundit missed.",
    type: "profile",
    url: "https://www.thetouchlinedribble.in/about",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/about" },
};

export default function AboutPage() {
  return <AboutPageOriginal />;
}
