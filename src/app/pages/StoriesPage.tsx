"use client";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { StoryFeatureCard } from "../components/StoryFeatureCard";
import { getAllStories, getAllStoriesAsync, sortStories } from "../lib/storyStorage";
import type { StoryFeature } from "../data/stories";

export function StoriesPage() {
  const [stories, setStories] = useState<StoryFeature[]>(() => getAllStories());
  const [loading, setLoading] = useState(stories.length === 0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  useEffect(() => {
    let mounted = true;
    getAllStoriesAsync().then(next => { if (mounted) setStories(next); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  const filteredStories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = stories.filter(story => [story.title, story.subtitle, story.excerpt, story.eyebrow, story.date].some(value => value.toLowerCase().includes(needle)));
    if (sort === "a-z") return [...matched].sort((a, b) => a.title.localeCompare(b.title));
    const ordered = sortStories(matched);
    return sort === "oldest" ? ordered.reverse() : ordered;
  }, [query, sort, stories]);
  const [lead, ...remaining] = filteredStories;
  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 dark:bg-[#101412] dark:text-stone-100">
      <SEO title="Stories" description="Football stories worth spending time with." url="https://www.thetouchlinedribble.in/stories" />
      <Header />
      <main id="main-content" className="mx-auto max-w-[1180px] px-5 pb-20 pt-12 sm:px-8 md:pt-20">
        <header className="mb-10 border-b border-stone-300 pb-9 dark:border-stone-700">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-green-700 dark:text-green-400">The Touchline Dribble</p>
          <h1 className="font-newsreader text-6xl font-medium tracking-tight sm:text-8xl">Stories</h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-stone-600 dark:text-stone-400">The people, moments, and ideas that shape football.</p>
        </header>
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex max-w-md flex-1 items-center gap-3 border-b border-stone-400 py-3 focus-within:border-green-700">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Search stories</span>
            <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search stories" className="min-w-0 w-full bg-transparent text-sm outline-none" />
          </label>
          <label className="flex items-center gap-3 text-sm"><span className="sr-only">Sort stories</span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="min-h-11 border-b border-stone-400 bg-transparent px-2 focus-visible:outline-green-600 dark:bg-[#101412]">
              <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="a-z">A–Z</option>
            </select>
          </label>
        </div>
        {loading ? <p role="status" className="py-20 text-stone-500">Loading stories…</p> : lead ? (
          <>
            <StoryFeatureCard story={lead} variant="feature" />
            {remaining.length > 0 && <section className="mt-16 border-t border-stone-300 pt-8 dark:border-stone-700">
              <h2 className="mb-8 font-newsreader text-3xl">More stories</h2>
              <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">{remaining.map(story => <StoryFeatureCard key={story.id} story={story} />)}</div>
            </section>}
          </>
        ) : <div className="py-20"><h2 className="font-newsreader text-3xl">{query ? "No stories found" : "Stories are on their way"}</h2><p className="mt-3 text-stone-500">{query ? "Try another title, topic, or date." : "Come back soon for our next football story."}</p>{query && <button className="mt-5 min-h-11 text-green-700 underline dark:text-green-400" onClick={() => setQuery("")}>Clear search</button>}</div>}
      </main>
      <Footer />
    </div>
  );
}
