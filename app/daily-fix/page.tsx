import type { Metadata } from "next";
import { DailyFixPage } from "@/app/pages/DailyFixPage";

export const metadata: Metadata = {
  title: "Daily Fix — Today's Football Headlines & Analysis",
  description:
    "Your daily football briefing — the biggest stories, results, and tactical talking points from across Europe's top leagues. Updated every morning.",
  openGraph: {
    title: "Daily Fix — Today's Football Headlines",
    description:
      "Your daily football briefing — biggest stories, results, and tactical talking points.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/daily-fix",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/daily-fix" },
};

export default function DailyFixRoute() {
  return <DailyFixPage />;
}
