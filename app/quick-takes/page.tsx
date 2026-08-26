import { QuickTakesClient } from "./QuickTakesClient";

export const metadata = {
  title: "Quick Takes — Hot Football Takes in 60 Seconds",
  description: "Rapid-fire football opinions, transfer reactions, and tactical hot takes from The Touchline Dribble.",
  alternates: { canonical: "https://www.thetouchlinedribble.in/quick-takes" },
};

export default function QuickTakesPage() {
  return <QuickTakesClient />;
}
