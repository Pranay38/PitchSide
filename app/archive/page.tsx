import type { Metadata } from "next";
import { ArchivePage as ArchivePageOriginal } from "@/app/pages/ArchivePage";

export const metadata: Metadata = {
  title: "Archive — Every Article We've Published",
  description:
    "Browse the complete archive of The Touchline Dribble — every tactical breakdown, transfer analysis, and opinion piece in one searchable collection.",
  openGraph: {
    title: "Archive — Every Article We've Published",
    description:
      "Browse the complete archive — every tactical breakdown, transfer analysis, and opinion piece.",
    type: "website",
    url: "https://www.thetouchlinedribble.in/archive",
  },
  alternates: { canonical: "https://www.thetouchlinedribble.in/archive" },
};

export default function ArchivePage() {
  return <ArchivePageOriginal />;
}
