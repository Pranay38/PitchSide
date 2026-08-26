import type { Metadata } from "next";
import { CollectionsPage as CollectionsPageOriginal } from "@/app/pages/CollectionsPage";

export const metadata: Metadata = {
  title: "Collections — Curated Football Reading Lists",
  description:
    "Hand-picked reading lists grouping the best football analysis by theme — from title races to tactical revolutions. Deep dives for serious fans.",
  openGraph: {
    title: "Collections — Curated Football Reading Lists",
    description:
      "Hand-picked reading lists grouping the best football analysis by theme.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/collections",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/collections" },
};

export default function CollectionsPage() {
  return <CollectionsPageOriginal />;
}
