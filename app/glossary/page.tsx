import type { Metadata } from "next";
import { GlossaryPage as GlossaryPageOriginal } from "@/app/pages/GlossaryPage";

export const metadata: Metadata = {
  title: "Football Glossary — Tactical Terms Explained",
  description:
    "Learn every football tactical term — from gegenpressing to inverted full-backs. The most comprehensive football glossary for fans who want to understand the game deeper.",
  openGraph: {
    title: "Football Glossary — Tactical Terms Explained",
    description:
      "The most comprehensive football glossary — gegenpressing, xG, false 9, and 100+ terms explained simply.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/glossary",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/glossary" },
};

export default function GlossaryPage() {
  return <GlossaryPageOriginal />;
}
