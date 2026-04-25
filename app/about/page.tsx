import type { Metadata } from "next";
import { AboutPage as AboutPageOriginal } from "@/app/pages/AboutPage";

export const metadata: Metadata = {
  title: "About — Pranay Agrawal, Founder & Tactical Writer",
  description:
    "Meet Pranay Agrawal, the tactical writer behind The Touchline Dribble. Post-match breakdowns, formation deep dives, and the bold opinions your pundit won't give you.",
  openGraph: {
    title: "About — Pranay Agrawal, Tactical Writer",
    description:
      "The tactical writer behind The Touchline Dribble — post-match breakdowns and bold football opinions.",
    type: "profile",
    url: "https://thetouchlinedribble.in/about",
  },
  alternates: { canonical: "https://thetouchlinedribble.in/about" },
};

export default function AboutPage() {
  return <AboutPageOriginal />;
}
