"use client";
import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Link } from "@/lib/router-compat";
import { Sparkles, UserCircle, RefreshCw } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { PageState } from "../components/PageState";
import type { BlogPost } from "../data/posts";

interface FeedPost extends BlogPost {
  matchReason?: string;
}

type FilterType = "All" | "Club News" | "Transfers" | "Tactics";

export function ForYouPage() {
  const { user, isLoaded } = useUser();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  useEffect(() => {
    let isMounted = true;
    
    async function fetchFeed() {
      if (!isLoaded) return;
      
      setLoading(true);
      setError("");
      
      try {
        const url = user ? `/api/for-you?userId=${user.id}` : '/api/for-you';
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error("Failed to load feed");
        }
        
        const data = await res.json();
        
        if (!isMounted) return;
        
        setPosts(data.posts || []);
        setPreferences(data.preferences);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "An error occurred");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFeed();
    
    return () => {
      isMounted = false;
    };
  }, [isLoaded, user]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === "All") return posts;
    
    return posts.filter(post => {
      const tags = post.tags?.map(t => t.toLowerCase()) || [];
      const club = (post.club || "").toLowerCase();
      
      if (activeFilter === "Transfers") {
        return tags.includes("transfer") || club.includes("transfer");
      }
      if (activeFilter === "Tactics") {
        return tags.includes("tactics") || tags.includes("analysis");
      }
      if (activeFilter === "Club News") {
        // Assume non-transfer, non-tactics posts about specific clubs are club news
        return club && club !== "football" && !tags.includes("transfer") && !tags.includes("tactics");
      }
      return true;
    });
  }, [posts, activeFilter]);

  const hasPreferences = useMemo(() => {
    if (!preferences) return false;
    const hasClubs = preferences.followedClubs && preferences.followedClubs.length > 0;
    const hasFanClub = !!preferences.fanClub?.name;
    const hasTags = preferences.followedTags && preferences.followedTags.length > 0;
    return hasClubs || hasFanClub || hasTags;
  }, [preferences]);

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="For You — Personalized Feed"
        description="Your personalized feed of football analysis, news, and stories tailored to your favorite clubs and topics."
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8 mb-10 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="relative">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              <Sparkles className="w-3.5 h-3.5" />
              Tailored for you
            </p>
          </div>
          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                Your Feed.
              </h1>
              
              {isLoaded && !user ? (
                 <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                   Sign in to get a personalized feed based on your favorite clubs and reading history. Currently showing trending stories.
                 </p>
              ) : hasPreferences ? (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-[#64748B] dark:text-gray-400 mr-2">Following:</span>
                  {preferences?.fanClub?.name && (
                    <span className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#16A34A]">
                      {preferences.fanClub.name}
                    </span>
                  )}
                  {preferences?.followedClubs?.map((club: string) => (
                    <span key={club} className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#16A34A]">
                      {club}
                    </span>
                  ))}
                  {preferences?.followedTags?.map((tag: string) => (
                    <span key={tag} className="rounded-full bg-[#0F172A]/5 dark:bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B] dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                  <Link to="/profile" className="text-xs text-[#16A34A] hover:underline ml-2 font-semibold">
                    Edit Preferences →
                  </Link>
                </div>
              ) : (
                <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                  You haven't set up your preferences yet. <Link to="/profile" className="text-[#16A34A] font-bold hover:underline">Set them up now</Link> to get the most out of your feed.
                </p>
              )}
            </div>
            
            {user && !hasPreferences && !loading && (
              <div className="shrink-0">
                <Link 
                  to="/profile"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] font-black uppercase tracking-widest text-[11px] shadow-sm transition-all hover:scale-105"
                >
                  <UserCircle className="w-4 h-4" />
                  Set Preferences
                </Link>
              </div>
            )}
          </div>

          <div className="relative mt-8 flex flex-wrap gap-2 border-t border-gray-200 pt-6 dark:border-gray-800">
            {(["All", "Club News", "Transfers", "Tactics"] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`filter-chip transition-colors ${
                  activeFilter === filter
                    ? "bg-[#16A34A] text-white border-transparent"
                    : ""
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section>
          {loading ? (
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
          ) : error ? (
            <PageState
              icon={RefreshCw}
              eyebrow="Error"
              title="Failed to load feed"
              description={error}
            />
          ) : filteredPosts.length === 0 ? (
            <PageState
              icon={Sparkles}
              eyebrow="No Results"
              title="Nothing to show"
              description={activeFilter === "All" ? "There are no posts available at the moment." : `No posts found for ${activeFilter}.`}
              action={(
                <button
                  type="button"
                  onClick={() => setActiveFilter("All")}
                  className="rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white"
                >
                  Clear Filters
                </button>
              )}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="relative group/feed">
                  {post.matchReason && (
                    <div className="absolute -top-3 -right-2 z-20 pointer-events-none">
                       <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 border border-white/20">
                          {post.matchReason}
                       </span>
                    </div>
                  )}
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
