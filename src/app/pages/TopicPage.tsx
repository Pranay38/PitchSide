"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowRight, Plus, Check, Search, Tags } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { useUser } from "@clerk/nextjs";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { PageState } from "../components/PageState";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { deslugify, topicPath } from "../lib/contentPaths";
import type { BlogPost } from "../data/posts";

function sortPosts(posts: BlogPost[], sort: string): BlogPost[] {
  const ordered = [...posts];

  if (sort === "oldest") {
    return ordered.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  }
  if (sort === "a-z") {
    return ordered.sort((left, right) => left.title.localeCompare(right.title));
  }

  return ordered.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function TopicPage({ initialPosts }: { initialPosts?: BlogPost[] }) {
  const { slug = "" } = useParams();
  const [posts, setPosts] = useState<BlogPost[]>(() => initialPosts || getPublishedPosts());
  const [loading, setLoading] = useState(!initialPosts && posts.length === 0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");

  const slugString = Array.isArray(slug) ? slug[0] : (slug || "");
  const normalizedSlug = slugString.toLowerCase();
  const topicLabel = deslugify(slugString);

  const { user } = useUser();
  const { toggleFollowedTag, isTagFollowed } = useUserPreferences();
  const isFollowing = user ? isTagFollowed(topicLabel) : false;

  useEffect(() => {
    if (initialPosts) return; // Skip if we have server data
    let isMounted = true;

    getPublishedPostsAsync()
      .then((nextPosts) => {
        if (!isMounted) return;
        setPosts(nextPosts);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialPosts]);

  const matchingPosts = useMemo(() => {
    const topicMatches = posts.filter((post) => {
      const haystacks = [
        post.club,
        post.playerName || "",
        post.title,
        post.excerpt,
        ...post.tags,
      ].map((value) => value.toLowerCase());

      return haystacks.some((value) => value.includes(normalizedSlug.replace(/-/g, " ")));
    });

    const filteredByQuery = query.trim()
      ? topicMatches.filter((post) => {
          const haystacks = [post.title, post.excerpt, post.club, post.playerName || "", ...post.tags];
          return haystacks.some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));
        })
      : topicMatches;

    return sortPosts(filteredByQuery, sort);
  }, [normalizedSlug, posts, query, sort]);

  const relatedTopics = useMemo(() => {
    const counts = new Map<string, number>();

    matchingPosts.forEach((post) => {
      post.tags.forEach((tag) => {
        if (tag.toLowerCase() === topicLabel.toLowerCase()) return;
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [matchingPosts, topicLabel]);

  const featuredPost = matchingPosts[0] || null;
  const latestPosts = featuredPost
    ? matchingPosts.filter((post) => post.id !== featuredPost.id)
    : matchingPosts;

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title={`${topicLabel} Coverage`}
        description={`Read every Touchline Dribble story tagged with ${topicLabel}.`}
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              Topic Page
            </p>
          </div>

          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit text-[#0F172A] dark:text-white md:text-5xl">
                {topicLabel}
              </h1>
              <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                A focused editorial page for {topicLabel}, with one featured entry, the latest attached coverage, and the related topics that surround it.
              </p>
            </div>
            <div className="flex flex-col gap-3 xl:items-end">
              {user && (
                <button
                  onClick={() => toggleFollowedTag(topicLabel)}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all ${
                    isFollowing
                      ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30"
                      : "bg-[#16A34A] text-white hover:bg-[#15803d]"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-4 w-4" /> Following
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Follow {topicLabel}
                    </>
                  )}
                </button>
              )}
              <Link
                to={`/archive?topic=${encodeURIComponent(topicLabel)}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-bold text-[#0F172A] dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Search this topic in archive
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#16A34A]/8 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Articles</p>
              <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{matchingPosts.length}</p>
            </div>
            <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Related topics</p>
              <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{relatedTopics.length}</p>
            </div>
            <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Coverage mode</p>
              <p className="mt-2 text-base font-black font-outfit text-[#0F172A] dark:text-white">Featured + latest</p>
            </div>
          </div>

          {relatedTopics.length > 0 && (
            <div className="relative mt-7 flex flex-wrap gap-2">
              {relatedTopics.slice(0, 4).map((topic) => (
                <Link key={topic} to={topicPath(topic)} className="filter-chip">
                  {topic}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section-surface mt-10 rounded-[2rem] border border-gray-200 p-4 shadow-sm dark:border-gray-800 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[2fr_220px_220px]">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 dark:border-gray-700 dark:bg-[#08111f]">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search within ${topicLabel}`}
                className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] dark:text-white"
              />
            </label>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#08111f] dark:text-white">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="a-z">A-Z</option>
            </select>
            <div className="rounded-2xl bg-[#16A34A]/10 px-4 py-3 text-sm font-semibold text-[#16A34A]">
              {matchingPosts.length} result{matchingPosts.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        <section className="mt-10">
          {loading && posts.length === 0 ? (
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
          ) : featuredPost ? (
            <div className="space-y-10">
              <section>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                      Featured Article
                    </p>
                    <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                      The lead piece for this topic
                    </h2>
                  </div>
                </div>
                <PostCard post={featuredPost} featured />
              </section>

              {latestPosts.length > 0 && (
                <section className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                        Latest Articles
                      </p>
                      <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                        Newer coverage attached to {topicLabel}
                      </h2>
                    </div>
                    <Link to={`/archive?topic=${encodeURIComponent(topicLabel)}`} className="text-sm font-bold text-[#16A34A]">
                      Open topic archive
                    </Link>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {latestPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}

              {relatedTopics.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <Tags className="h-4 w-4 text-[#16A34A]" />
                    <h2 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white">
                      Related Topics
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {relatedTopics.map((topic) => (
                      <Link
                        key={topic}
                        to={topicPath(topic)}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#475569] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:bg-[#0F172A] dark:text-gray-300"
                      >
                        {topic}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <PageState
              icon={Tags}
              eyebrow={topicLabel}
              title="No topic matches yet"
              description={query.trim()
                ? "Nothing in this topic matched the current search. Try a broader query or use the full archive."
                : "This topic page is ready, but there are no published posts attached to it yet."}
              action={(
                <Link
                  to={`/archive?topic=${encodeURIComponent(topicLabel)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white"
                >
                  Open archive
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
