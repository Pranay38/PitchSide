import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlossaryTermPage } from "@/app/pages/GlossaryTermPage";
import { footballGlossary, termSlug, lookupTerm } from "@/app/data/footballGlossary";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return footballGlossary.map((entry) => ({
    slug: termSlug(entry.term),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const term = footballGlossary.find((e) => termSlug(e.term) === slug);
  
  if (!term) return { title: "Term Not Found" };

  return {
    title: `${term.term} — Football Tactical Glossary Explained`,
    description: `What is a ${term.term} in football? ${term.definition.slice(0, 150)}... Read the full tactical definition on The Touchline Dribble.`,
    openGraph: {
      title: `${term.term} Explained | The Touchline Dribble`,
      description: term.definition,
      type: "article",
    },
  };
}

export default async function GlossaryTermRoute({ params }: Props) {
  const { slug } = await params;
  const term = footballGlossary.find((e) => termSlug(e.term) === slug);

  if (!term) {
    notFound();
  }

  return <GlossaryTermPage entry={term} />;
}
