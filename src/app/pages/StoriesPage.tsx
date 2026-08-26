"use client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Layers3, ScanSearch, Search } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { StoryFeatureCard } from "../components/StoryFeatureCard";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import type { StoryFeature } from "../data/stories";

function sortStories(stories: StoryFeature[], sort: string): StoryFeature[] {
  const ordered = [...stories];

  if (sort === "oldest") {
    return ordered.sort((left, right) => new Date(left.updatedAt || left.date).getTime() - new Date(right.updatedAt || right.date).getTime());
  }
  if (sort === "a-z") {
    return ordered.sort((left, right) => left.title.localeCompare(right.title));
  }

  return ordered.sort((left, right) => new Date(right.updatedAt || right.date).getTime() - new Date(left.updatedAt || left.date).getTime());
}

export function StoriesPage() {
  const [stories, setStories] = useState<StoryFeature[]>(() => getAllStories());
  const [loading, setLoading] = useState(stories.length === 0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    let isMounted = true;

    getAllStoriesAsync()
      .then((nextStories) => {
        if (!isMounted) return;
        setStories(nextStories);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStories = useMemo(() => {
    const matched = query.trim()
      ? stories.filter((story) => {
          const haystacks = [story.title, story.subtitle, story.excerpt, story.eyebrow, ...story.highlights];
          return haystacks.some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));
        })
      : stories;

    return sortStories(matched, sort);
  }, [query, sort, stories]);

  const featuredStory = filteredStories[0] || null;
  const remainingStories = featuredStory
    ? filteredStories.filter((story) => story.id !== featuredStory.id)
    : filteredStories;
  const totalChapters = filteredStories.reduce((total, story) => total + story.chapters.length, 0);
  const totalHighlights = filteredStories.reduce((total, story) => total + story.highlights.length, 0);

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Stories"
        description="Scroll-driven football stories built for deeper, visual longform reading."
        url="https://www.thetouchlinedribble.in/stories"
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              Longform Section
            </p>
          </div>

          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                Longform football stories designed with chapters, progression, and a cleaner next read.
              </h1>
              <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                Stories now behave like a premium section instead of a flat archive: stronger lead cards, clearer chapter context, and a cleaner path into the wider story library.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[340px]">
              <div className="rounded-2xl bg-[#16A34A]/8 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Stories</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{filteredStories.length}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Chapters</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{totalChapters}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Signals</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{totalHighlights}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap gap-2">
            <div className="filter-chip">
              <Layers3 className="h-3.5 w-3.5" />
              Chapter-based reading
            </div>
            <div className="filter-chip">
              <ScanSearch className="h-3.5 w-3.5" />
              Scroll-reactive visuals
            </div>
            <Link to="/archive?type=story" className="filter-chip">
              Story archive
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="section-surface mt-10 rounded-[2rem] border border-gray-200 p-4 shadow-sm dark:border-gray-800 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[2fr_220px_220px]">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 dark:border-gray-700 dark:bg-[#08111f]">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stories, themes, and highlights"
                className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] dark:text-white"
              />
            </label>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#08111f] dark:text-white">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="a-z">A-Z</option>
            </select>
            <div className="rounded-2xl bg-[#16A34A]/10 px-4 py-3 text-sm font-semibold text-[#16A34A]">
              {filteredStories.length} stor{filteredStories.length === 1 ? "y" : "ies"}
            </div>
          </div>
        </section>

        <section className="mt-10">
          {loading && stories.length === 0 ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0F172A]">
                  <div className="aspect-[16/10] animate-pulse bg-gray-200 dark:bg-gray-800" />
                  <div className="space-y-4 p-5">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredStory ? (
            <div className="space-y-10">
              <div>
                <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                  Lead Story
                </p>
                <StoryFeatureCard story={featuredStory} variant="feature" label="Lead story" />
              </div>

              {remainingStories.length > 0 && (
                <section>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                        More Stories
                      </p>
                      <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                        Continue through the longform shelf
                      </h2>
                    </div>
                    <Link to="/archive?type=story" className="text-sm font-bold text-[#16A34A]">
                      Search story archive
                    </Link>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {remainingStories.map((story) => (
                      <StoryFeatureCard key={story.id} story={story} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <PageState
              icon={Layers3}
              eyebrow="Stories"
              title="No stories matched that search"
              description="Try a broader keyword or switch to the full archive if you want to search across stories and articles together."
              action={(
                <Link
                  to="/archive?type=story"
                  className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white"
                >
                  Open story archive
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
