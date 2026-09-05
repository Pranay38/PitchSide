"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SupportBanner } from "../components/SupportBanner";
import { InlineNewsletterCard } from "../components/InlineNewsletterCard";
import { Link } from "@/lib/router-compat";
import { ArrowLeft, Share2 } from "lucide-react";
import type { GlossaryEntry } from "../data/footballGlossary";

interface Props {
  entry: GlossaryEntry;
}

function buildArticleJsonLd(entry: GlossaryEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${entry.term} Explained - Football Tactics Glossary`,
    description: entry.definition,
    author: {
      "@type": "Organization",
      name: "The Touchline Dribble"
    },
    publisher: {
      "@type": "Organization",
      name: "The Touchline Dribble",
      logo: {
        "@type": "ImageObject",
        url: "https://www.thetouchlinedribble.in/logo.png"
      }
    }
  };
}

export function GlossaryTermPage({ entry }: Props) {
  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(entry)) }}
      />
      <Header />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
        <Link href="/glossary" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Glossary
        </Link>
        
        <article className="mb-16">
          <div className="mb-8 border-l-4 border-primary pl-5">
            <div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-primary uppercase">
              {entry.category}
            </div>
            <h1 className="mt-3 font-headline text-5xl font-bold leading-tight text-foreground sm:text-6xl">
              {entry.term}
            </h1>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none font-newsreader text-xl leading-relaxed text-foreground/90">
            <p className="first-letter:float-left first-letter:mr-3 first-letter:text-6xl first-letter:font-black first-letter:text-primary">
              {entry.definition}
            </p>
          </div>
        </article>

        <div className="section-divider my-16" />
        
        {/* Aggressive Funnel for Organic Search Traffic */}
        <section className="space-y-12">
          <div className="text-center mb-8">
            <h2 className="font-headline font-bold text-2xl mb-2">Enjoyed this tactical breakdown?</h2>
            <p className="text-muted-foreground">Join our community for deeper analysis, bold opinions, and ad-free reading.</p>
          </div>
          <SupportBanner variant="compact" />
          <InlineNewsletterCard />
        </section>
      </main>

      <Footer />
    </div>
  );
}
