import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Cup 2026 — Team of the Tournament",
  description:
    "The Touchline Dribble's definitive XI of the 2026 FIFA World Cup. Hover over each player to see why they made the cut — powered by conviction, not consensus.",
  openGraph: {
    title: "World Cup 2026 — Team of the Tournament | The Touchline Dribble",
    description:
      "Our definitive XI of the 2026 FIFA World Cup. Tap each player to see the editorial reasoning behind every pick.",
    type: "article",
    url: "https://www.thetouchlinedribble.in/world-cup-xi",
    siteName: "The Touchline Dribble",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "The Touchline Dribble — World Cup 2026 Team of the Tournament",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "World Cup 2026 — Team of the Tournament",
    description:
      "Our definitive XI. Tap each player to see why they made the cut. ⚽🏆",
    site: "@TouchlineDribbl",
    creator: "@TouchlineDribbl",
  },
  alternates: {
    canonical: "https://www.thetouchlinedribble.in/world-cup-xi",
  },
};

export default function WorldCupXILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
