import type { Metadata } from "next";
import { CompetitorPage } from "@/app/pages/CompetitorPage";

export const metadata: Metadata = {
  title: "The Touchline Dribble vs The 1899 Blog — Which is right for you?",
  description: "Comparing The Touchline Dribble and The 1899 Blog. See why fans are switching for deeper tactical analysis and bolder opinions.",
};

export default function The1899VsPage() {
  return (
    <CompetitorPage 
      competitorName="The 1899 Blog"
      competitorDescription="A popular football blog providing news and updates."
      whySwitch="While The 1899 Blog does a solid job covering standard football news, The Touchline Dribble is built for fans who want to look beyond the surface. We provide deeper tactical analysis, ad-free reading, and unapologetically bold opinions that challenge the mainstream narrative."
      features={[
        { name: "Ad-Free Reading Experience", us: true, them: false },
        { name: "Deep Tactical Breakdowns", us: true, them: false },
        { name: "General News & Rumors", us: false, them: true },
        { name: "Interactive Community Reacts", us: true, them: false },
        { name: "Premium Magazine Layout", us: true, them: false },
      ]}
    />
  );
}
