import type { Metadata } from "next";
import { ForYouPage as ForYouPageOriginal } from "@/app/pages/ForYouPage";

export const metadata: Metadata = {
  title: "For You — Personalized Feed",
  description:
    "Your personalized feed of football analysis, news, and stories tailored to your favorite clubs and topics.",
  openGraph: {
    title: "For You — Personalized Feed",
    description:
      "Your personalized feed of football analysis, news, and stories tailored to your favorite clubs and topics.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/for-you",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/for-you" },
};

export default function ForYouPage() {
  return <ForYouPageOriginal />;
}
