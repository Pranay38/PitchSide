import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import { BookOpen, Library, ScrollText, Search, SlidersHorizontal, X } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import {
  buildArchiveEntries,
  filterArchiveEntries,
  type ArchiveEntry,
} from "../lib/contentIndex";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";

function readOption(searchParams: URLSearchParams, key: string, fallback = "all"): string {
  return searchParams.get(key) || fallback;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function ArchiveCard({ entry }: { entry: ArchiveEntry }) {
  return (
    <Link
      to={entry.href}
      className="group relative overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800 dark:bg-[#0F172A]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#16A34A] via-[#4ade80] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={entry.coverImage}
          alt={entry.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
            {entry.type === "story" ? "Story" : "Article"}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B] dark:bg-white/5 dark:text-gray-300">
            {entry.format}
          </span>
          {entry.league && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-[#475569] dark:bg-white/5 dark:text-gray-300">
              {entry.league}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-xl font-black font-outfit leading-tight text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
            {entry.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
            {entry.excerpt}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#94A3B8]">
          <span>{entry.date}</span>
          <span>{entry.readTime}</span>
          {entry.club && <span>{entry.club}</span>}
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#16A34A]">
            {entry.type === "story" ? "Open story" : "Read article"}
          </span>
          <span className="text-lg text-[#16A34A] transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ArchivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState<ArchiveEntry[]>(() => (
    buildArchiveEntries(getPublishedPosts(), getAllStories())
  ));
  const [loading, setLoading] = useState(entries.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setLoading(entries.length === 0);
    Promise.all([getPublishedPostsAsync(), getAllStoriesAsync()])
      .then(([posts, stories]) => {
        if (!isMounted) return;
        setEntries(buildArchiveEntries(posts, stories));
        setError("");
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(entries.length === 0 ? "Could not load the archive right now." : "");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filters = {
    query: searchParams.get("q") || "",
    type: readOption(searchParams, "type"),
    club: readOption(searchParams, "club"),
    league: readOption(searchParams, "league"),
    topic: readOption(searchParams, "topic"),
    format: readOption(searchParams, "format"),
    sort: readOption(searchParams, "sort", "newest"),
  };
  const activeFilterChips = [
    filters.query ? { key: "q", label: `Search: ${filters.query}` } : null,
    filters.type !== "all" ? { key: "type", label: filters.type === "story" ? "Stories only" : "Articles only" } : null,
    filters.club !== "all" ? { key: "club", label: filters.club } : null,
    filters.league !== "all" ? { key: "league", label: filters.league } : null,
    filters.topic !== "all" ? { key: "topic", label: filters.topic } : null,
    filters.format !== "all" ? { key: "format", label: filters.format } : null,
    filters.sort !== "newest" ? { key: "sort", label: filters.sort === "oldest" ? "Oldest first" : "A-Z" } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const filteredEntries = useMemo(() => filterArchiveEntries(entries, filters), [entries, filters]);
  const clubs = useMemo(() => unique(entries.map((entry) => entry.club)), [entries]);
  const leagues = useMemo(() => unique(entries.map((entry) => entry.league)), [entries]);
  const formats = useMemo(() => unique(entries.map((entry) => entry.format)), [entries]);
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach((entry) => {
      entry.topics.forEach((topic) => counts.set(topic, (counts.get(topic) || 0) + 1));
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 18)
      .map(([topic]) => topic);
  }, [entries]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Archive"
        description="Search every Touchline Dribble article and story by club, league, topic, and format."
        url="https://pitchside-orcin.vercel.app/archive"
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              Search + Archive
            </p>
          </div>
          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                One place to browse every article and story.
              </h1>
              <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                Search by club, league, topic, or format. Use it as a fast archive, not a dumping ground.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[320px]">
              <div className="rounded-2xl bg-[#16A34A]/8 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Articles</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                  {entries.filter((entry) => entry.type === "article").length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Stories</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                  {entries.filter((entry) => entry.type === "story").length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Results</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                  {filteredEntries.length}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap gap-2">
            <Link to="/archive?type=article" className="filter-chip">Analysis feed</Link>
            <Link to="/archive?type=story" className="filter-chip">Scrollytelling</Link>
            <Link to="/archive?topic=Premier%20League" className="filter-chip">Premier League</Link>
            <Link to="/archive?format=Must%20Read" className="filter-chip">Must Reads</Link>
          </div>

          <div className="relative mt-8 rounded-[1.75rem] border border-gray-200 bg-white/82 p-4 backdrop-blur-sm dark:border-gray-800 dark:bg-[#08111f]/92">
            <div className="grid gap-3 lg:grid-cols-[2fr_repeat(5,minmax(0,1fr))]">
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 dark:border-gray-700 dark:bg-[#0F172A]">
                <Search className="h-4 w-4 text-[#94A3B8]" />
                <input
                  type="search"
                  value={filters.query}
                  onChange={(event) => updateFilter("q", event.target.value)}
                  placeholder="Search titles, clubs, topics, formats..."
                  className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] dark:text-white"
                />
              </label>

              <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#0F172A] dark:text-white">
                <option value="all">All content</option>
                <option value="article">Articles</option>
                <option value="story">Stories</option>
              </select>
              <select value={filters.club} onChange={(event) => updateFilter("club", event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#0F172A] dark:text-white">
                <option value="all">All clubs</option>
                {clubs.map((club) => <option key={club} value={club}>{club}</option>)}
              </select>
              <select value={filters.league} onChange={(event) => updateFilter("league", event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#0F172A] dark:text-white">
                <option value="all">All leagues</option>
                {leagues.map((league) => <option key={league} value={league}>{league}</option>)}
              </select>
              <select value={filters.topic} onChange={(event) => updateFilter("topic", event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#0F172A] dark:text-white">
                <option value="all">All topics</option>
                {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
              <select value={filters.format} onChange={(event) => updateFilter("format", event.target.value)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#0F172A] dark:text-white">
                <option value="all">All formats</option>
                {formats.map((format) => <option key={format} value={format}>{format}</option>)}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </div>
              <div className="flex items-center gap-3">
                <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#0F172A] dark:text-white">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="a-z">A-Z</option>
                </select>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-[#475569] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-700 dark:text-gray-300"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
                {activeFilterChips.map((chip) => (
                  <button
                    key={`${chip.key}-${chip.label}`}
                    type="button"
                    onClick={() => updateFilter(chip.key, "all")}
                    className="filter-chip"
                  >
                    {chip.label}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          {loading && entries.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
          ) : error && entries.length === 0 ? (
            <PageState
              icon={Library}
              eyebrow="Archive"
              title="Archive unavailable"
              description={error}
            />
          ) : filteredEntries.length === 0 ? (
            <PageState
              icon={Search}
              eyebrow="No Results"
              title="Nothing matched those filters"
              description="Try clearing the search or broadening the filters to bring more content back into view."
              action={(
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white"
                >
                  Reset archive filters
                </button>
              )}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                    Results
                  </p>
                  <h2 className="mt-2 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">
                    {filteredEntries.length} item{filteredEntries.length === 1 ? "" : "s"} ready to read
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-gray-400">
                  <BookOpen className="h-4 w-4 text-[#16A34A]" />
                  Articles and stories are mixed together by design.
                </div>
              </div>
              <div className="section-surface rounded-[2rem] border border-gray-200 p-5 shadow-sm dark:border-gray-800 md:p-6">
                <div className="mb-5 flex flex-wrap gap-2">
                  {topics.slice(0, 6).map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => updateFilter("topic", topic)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        filters.topic === topic
                          ? "bg-[#16A34A] text-white"
                          : "bg-[#F8FAFC] text-[#475569] hover:text-[#16A34A] dark:bg-[#08111f] dark:text-gray-300"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredEntries.map((entry) => (
                    <ArchiveCard key={`${entry.type}-${entry.id}`} entry={entry} />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
