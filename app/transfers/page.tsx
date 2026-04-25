import type { Metadata } from "next";
import { TransferReliabilityPage as TransfersPageOriginal } from "@/app/pages/TransferReliabilityPage";

export const metadata: Metadata = {
  title: "Transfer Watch — Reliability-Rated Transfer News",
  description:
    "Track every football transfer rumour with reliability ratings. Know which transfer stories to trust and which to ignore. Updated daily.",
  openGraph: {
    title: "Transfer Watch — Reliability-Rated Transfer News",
    description:
      "Track football transfers with reliability ratings. Know which rumours to trust.",
    type: "website",
    url: "https://thetouchlinedribble.in/transfers",
  },
  alternates: { canonical: "https://thetouchlinedribble.in/transfers" },
};

export default function TransfersPage() {
  return <TransfersPageOriginal />;
}
