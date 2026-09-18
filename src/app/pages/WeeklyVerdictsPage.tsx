"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Scale } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { PostCard } from "../components/PostCard";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import type { BlogPost } from "../data/posts";

export function WeeklyVerdictsPage() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    return getPublishedPosts().filter(p => p.format === "weekly-verdict");
  });
  const [loading, setLoading] = useState(posts.length === 0);

  useEffect(() => {
    let isMounted = true;

    getPublishedPostsAsync()
      .then((allPosts) => {
        if (!isMounted) return;
        setPosts(allPosts.filter(p => p.format === "weekly-verdict"));
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

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Weekly Verdicts"
        description="Bite-sized tactical observations, rapid reactions, and short weekly analysis."
        url="https://www.thetouchlinedribble.in/weekly-verdicts"
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-purple-600/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-600">
              Shortform Section
            </p>
          </div>

          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                The Weekly Verdict ⚖️
              </h1>
              <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                A dedicated space for short 100-word tactical observations, rapid predictions, and weekly check-ins without the massive deep-dives.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[240px]">
              <div className="rounded-2xl bg-purple-600/10 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-600">Verdicts</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{posts.length}</p>
              </div>
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
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <PageState
              icon={Scale}
              eyebrow="Weekly Verdicts"
              title="No verdicts published yet"
              description="Check back soon for bite-sized tactical observations and rapid reactions."
              action={(
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700 transition-colors"
                >
                  Return home
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
