import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { TransferDossierPage as TransferDossierPageOriginal } from "@/app/pages/TransferDossierPage";
import { getSiteSettingsServer } from "@/lib/server-data";
import { buildTransferSummary } from "@/app/lib/transferDossiers";
import { buildTransferReliabilityBoard } from "@/app/lib/transferReliability";
import { buildTransferDossierSlug } from "@/app/lib/transferWatch";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getTransferDossier(slug: string) {
  const settings = await getSiteSettingsServer();
  const entries = buildTransferReliabilityBoard(settings.transferWatch || []);
  return entries.find((entry) => entry.dossierSlug === slug) || null;
}

export async function generateStaticParams() {
  const settings = await getSiteSettingsServer();
  return buildTransferReliabilityBoard(settings.transferWatch || []).map((entry) => ({
    slug: entry.dossierSlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dossier = await getTransferDossier(slug);

  if (!dossier) {
    return {
      title: "Transfer Dossier Not Found",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const canonicalUrl = `https://www.thetouchlinedribble.in/transfers/${dossier.dossierSlug}`;

  return {
    title: `${dossier.player} to ${dossier.club} Transfer Dossier`,
    description: buildTransferSummary(dossier),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${dossier.player} to ${dossier.club} Transfer Dossier`,
      description: buildTransferSummary(dossier),
      type: "article",
      url: canonicalUrl,
      siteName: "The Touchline Dribble",
    },
    twitter: {
      card: "summary_large_image",
      title: `${dossier.player} to ${dossier.club} Transfer Dossier`,
      description: buildTransferSummary(dossier),
      site: "@TouchlineDribbl",
      creator: "@TouchlineDribbl",
    },
  };
}

export default async function TransferDossierPage({ params }: Props) {
  const { slug } = await params;
  const dossier = await getTransferDossier(slug);

  if (!dossier) {
    notFound();
  }

  const canonicalSlug = buildTransferDossierSlug(dossier);

  if (slug !== canonicalSlug) {
    permanentRedirect(`/transfers/${canonicalSlug}`);
  }

  return <TransferDossierPageOriginal />;
}
