import type { Metadata } from "next";
import { WeeklyRoundupClient } from "./WeeklyRoundupClient";

export const metadata: Metadata = { title: "This Week in Football | The Touchline Dribble", description: "The four football moments that shaped the week." };
export default function WeeklyRoundupPage() { return <WeeklyRoundupClient />; }
