import type { Metadata } from "next";
import { DebateCornerPage as DebatesPageOriginal } from "@/app/pages/DebateCornerPage";

export const metadata: Metadata = {
  title: "Debates — Football's Biggest Arguments Settled",
  description:
    "Join the debate corner — vote on football's most divisive questions, from GOAT debates to tactical controversies. Make your opinion count.",
  openGraph: {
    title: "Debates — Football's Biggest Arguments Settled",
    description:
      "Vote on football's most divisive questions. GOAT debates, tactical controversies, and hot takes.",
    type: "website",
    url: "https://thetouchlinedribble.in/debates",
  },
  alternates: { canonical: "https://thetouchlinedribble.in/debates" },
};

export default function DebatesPage() {
  return <DebatesPageOriginal />;
}
