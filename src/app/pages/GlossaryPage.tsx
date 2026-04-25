"use client";
import { useState, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { Search, BookOpen, ArrowRight, Hash } from "lucide-react";
// Helmet removed — metadata handled by Next.js generateMetadata
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import {
  footballGlossary,
  GLOSSARY_CATEGORIES,
  termSlug,
  type GlossaryCategory,
} from "../data/footballGlossary";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const CATEGORY_EMOJI: Record<GlossaryCategory, string> = {
  "Tactical Systems": "⚙️",
  "Player Roles": "🧤",
  "Tactical Concepts": "🧠",
  "Formations": "📐",
  "Set Pieces & Phases": "🎯",
  "Metrics & Stats": "📊",
};

/** Build JSON-LD FAQPage for SEO — Google rich results */
function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: footballGlossary.slice(0, 30).map((entry) => ({
      "@type": "Question",
      name: `What is ${entry.term} in football?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.definition,
      },
    })),
  };
}

export function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<GlossaryCategory | "All">("All");

  const filteredTerms = useMemo(() => {
    let terms = [...footballGlossary];

    if (activeCategory !== "All") {
      terms = terms.filter((t) => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q)
      );
    }

    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, activeCategory]);

  // Group by first letter
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredTerms> = {};
    for (const term of filteredTerms) {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(term);
    }
    return groups;
  }, [filteredTerms]);

  const activeLetters = Object.keys(grouped).sort();

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      {/* SEO metadata handled by Next.js generateMetadata in app/glossary/page.tsx */}
      {/* JSON-LD for glossary FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd()) }}
      />

      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        {/* Hero */}
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />

          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              Tactical Glossary
            </p>
          </div>

          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                Every tactical term, explained in plain English.
              </h1>
              <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                Gegenpressing. False Nine. Half-space. Regista. If you've read it in an article and wondered what it means — it's here.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[340px]">
              <div className="rounded-2xl bg-[#16A34A]/8 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Terms</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{footballGlossary.length}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Categories</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{GLOSSARY_CATEGORIES.length}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Use</p>
                <p className="mt-2 text-base font-black font-outfit text-[#0F172A] dark:text-white">Linked in articles</p>
              </div>
            </div>
          </div>
        </section>

        {/* Search + Filters */}
        <section className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 dark:border-gray-800 dark:bg-[#0F172A] dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory("All")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                activeCategory === "All"
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#0F172A]/5 text-[#64748B] hover:bg-[#16A34A]/10 hover:text-[#16A34A] dark:bg-white/5"
              }`}
            >
              All
            </button>
            {GLOSSARY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-[#16A34A] text-white"
                    : "bg-[#0F172A]/5 text-[#64748B] hover:bg-[#16A34A]/10 hover:text-[#16A34A] dark:bg-white/5"
                }`}
              >
                {CATEGORY_EMOJI[cat]} {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Alphabet Index */}
        <nav className="mt-6 flex flex-wrap gap-1" aria-label="Alphabetical index">
          {ALPHABET.map((letter) => {
            const isActive = activeLetters.includes(letter);
            return (
              <a
                key={letter}
                href={isActive ? `#letter-${letter}` : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A]/20 cursor-pointer"
                    : "bg-gray-100 text-gray-300 cursor-default dark:bg-gray-900 dark:text-gray-700"
                }`}
              >
                {letter}
              </a>
            );
          })}
        </nav>

        {/* Terms List */}
        <section className="mt-8 space-y-8">
          {filteredTerms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-[#94A3B8]" />
              <p className="mt-4 text-lg font-bold text-[#0F172A] dark:text-white">No terms found</p>
              <p className="mt-1 text-sm text-[#64748B]">Try a different search or category.</p>
            </div>
          ) : (
            activeLetters.map((letter) => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-24">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16A34A]/10 text-sm font-black text-[#16A34A]">
                    {letter}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {grouped[letter].map((entry) => (
                    <div
                      key={entry.term}
                      id={termSlug(entry.term)}
                      className="group rounded-[1.25rem] border border-gray-200 bg-white p-5 transition-all hover:border-[#16A34A]/30 hover:shadow-md dark:border-gray-800 dark:bg-[#0F172A] scroll-mt-24"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white">
                          {entry.term}
                        </h3>
                        <span className="shrink-0 rounded-full bg-[#0F172A]/5 px-2 py-0.5 text-[10px] font-bold text-[#64748B] dark:bg-white/5">
                          {entry.category}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                        {entry.definition}
                      </p>
                      <a
                        href={`#${termSlug(entry.term)}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#16A34A] opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Hash className="h-3 w-3" /> Permalink
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-[2rem] border border-gray-200 bg-gradient-to-br from-[#16A34A]/5 to-transparent p-6 text-center shadow-sm dark:border-gray-800 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
            See it in action
          </p>
          <h2 className="mt-3 text-2xl font-black font-outfit text-[#0F172A] dark:text-white md:text-3xl">
            Every glossary term is linked inside our articles
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#64748B] dark:text-gray-400">
            When you read an article on The Touchline Dribble, you'll see dotted green underlines on tactical terms — hover them for instant definitions.
          </p>
          <Link
            to="/archive"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
          >
            Browse articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
