import { PUBLICATION_DESCRIPTION } from "@/app/lib/publication";
import type { Metadata } from "next";
import { AboutPage as AboutPageOriginal } from "@/app/pages/AboutPage";

export const metadata: Metadata = {
  title: "About — The Touchline Dribble",
  description:
    PUBLICATION_DESCRIPTION,
  openGraph: {
    title: "About — The Touchline Dribble",
    description:
      PUBLICATION_DESCRIPTION,
    type: "profile",
    url: "https://www.thetouchlinedribble.in/about",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/about" },
};

export default function AboutPage() {
  return <AboutPageOriginal />;
}
