"use client";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Link } from "@/lib/router-compat";
import { ArrowRight, BookOpen, Library, Newspaper, Repeat2, ScrollText, Trophy, ShieldQuestion, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

import { PollOfTheWeekPanel } from "../components/PollOfTheWeekPanel";
import type { RumorMill } from "../components/RumorMillWidget";
import type { ManagerPressure } from "../components/ManagerPressureWidget";
import { PostCard } from "../components/PostCard";
import { ArticleCard } from "../components/ui/blog-post-card";
import AeroHero from "../components/ui/aero-hero";
import Blogs from "../components/ui/blogs";
import { PageState } from "../components/PageState";
import { SectionMarker } from "../components/SectionMarker";
import { TextWireSection } from "../components/TextWireSection";
import { CommunityContributorCTA } from "../components/CommunityContributorCTA";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { getSiteSettings, getSiteSettingsAsync, type SiteSettings } from "../lib/siteSettingsStorage";
import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import { safeParse, DailyFeaturesSchema } from "../lib/schemas";
import { DebateWidget } from "../components/DebateWidget";
import { SupportBanner } from "../components/SupportBanner";
import { getClubByName } from "../data/clubs";

// Lazy-load below-the-fold heavy components to reduce initial bundle
const OnThisDayWidget = lazy(() => import("../components/OnThisDayWidget").then(m => ({ default: m.OnThisDayWidget })));
const RumorMillWidget = lazy(() => import("../components/RumorMillWidget").then(m => ({ default: m.RumorMillWidget })));
const FantasyCornerWidget = lazy(() => import("../components/FantasyCornerWidget").then(m => ({ default: m.FantasyCornerWidget })));

const InlineNewsletterCard = lazy(() => import("../components/InlineNewsletterCard").then(m => ({ default: m.InlineNewsletterCard })));
const BlogPostsGrid = lazy(() => import("../components/ui/blog-posts").then(m => ({ default: m.BlogPostsGrid })));


import { QuickTakesSection } from "../components/QuickTakesSection";

import { ChallengeTheTake } from "../components/home/ChallengeTheTake";


/** Hook: animates elements with class `scroll-reveal` when they enter viewport */
function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    const elements = container.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

interface DailyFeaturesData {
  lastUpdated: string;
  rumorMill?: RumorMill;
  managerPressure: ManagerPressure[];
}

function sortPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

function dedupePostsByTitle(posts: BlogPost[]): BlogPost[] {
  const seenTitles = new Set<string>();

  return posts.filter((post) => {
    const normalizedTitle = post.title.trim().toLowerCase();
    if (!normalizedTitle) return true;
    if (seenTitles.has(normalizedTitle)) return false;
    seenTitles.add(normalizedTitle);
    return true;
  });
}

function sortStories(stories: StoryFeature[]): StoryFeature[] {
  return [...stories].sort((left, right) => new Date(right.updatedAt || right.date).getTime() - new Date(left.updatedAt || left.date).getTime());
}

function pickOrderedItems<T extends { id: string }>(
  items: T[],
  ids: string[],
  limit: number,
  excludedIds: Set<string> = new Set(),
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((item): item is T => item !== undefined && !excludedIds.has(item.id));

  if (ordered.length >= limit) {
    return ordered.slice(0, limit);
  }

  const filler = items.filter((item) => !excludedIds.has(item.id) && !ordered.some((selected) => selected.id === item.id));
  return [...ordered, ...filler].slice(0, limit);
}

function StoryLinkCard({ story }: { story: StoryFeature }) {
  return (
    <Link
      to={`/stories/${story.slug}`}
      className="group block overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800 dark:bg-[#0F172A]"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={story.coverImage}
          alt={story.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
            {story.eyebrow}
          </span>
          <span className="text-xs font-medium text-[#94A3B8]">{story.readTime}</span>
        </div>
        <div>
          <h3 className="text-xl font-black font-outfit leading-tight text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
            {story.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
            {story.excerpt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {story.highlights.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[#475569] dark:bg-white/5 dark:text-gray-300"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function YourVoiceSection() {
  const [activeVoiceTab, setActiveVoiceTab] = useState<"poll" | "debate" | "pots">("poll");
  return (
    <div className="tinted-panel rounded-[2rem] border border-gray-200 p-5 shadow-sm dark:border-gray-800">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-6 w-1.5 rounded-full bg-[#16A34A]" />
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
            Fan Zone
          </p>
          <h2 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white">
            Your Voice
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/50 dark:bg-white/5 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveVoiceTab("poll")}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${activeVoiceTab === "poll"
              ? "bg-white dark:bg-[#1E293B] text-[#16A34A] shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
        >
          ⚡ Poll
        </button>
        <button
          onClick={() => setActiveVoiceTab("debate")}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${activeVoiceTab === "debate"
              ? "bg-white dark:bg-[#1E293B] text-[#16A34A] shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
        >
          🔥 Debate
        </button>
        <button
          onClick={() => setActiveVoiceTab("pots")}
          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${activeVoiceTab === "pots"
              ? "bg-white dark:bg-[#1E293B] text-[#16A34A] shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
        >
          🏆 POTS
        </button>
      </div>

      {/* Content */}
      <div>
        {activeVoiceTab === "poll" && <PollOfTheWeekPanel />}
        {activeVoiceTab === "debate" && <DebateWidget />}
        {activeVoiceTab === "pots" && (
            <div className="p-4 text-center">
                <Trophy className="w-12 h-12 text-[#16A34A] mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white mb-2 uppercase">Who is your POTS?</h3>
                <p className="text-xs text-gray-500 mb-6">Cast your definitive vote for the Player of the Season 2026.</p>
                <Link to="/pots" className="inline-block w-full bg-[#16A34A] text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#16A34A]/20">
                    Go to Voting Page
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}



interface HomePageProps {
  serverPosts?: any[];
  serverStories?: any[];
  serverSettings?: any;
}

export function HomePage({ serverPosts, serverStories, serverSettings }: HomePageProps = {}) {
  const scrollRef = useScrollReveal();
  const { isSignedIn, isLoaded: clLoaded } = useUser();
  const clerkAvailable = typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0;
  const { data: posts = [], isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => sortPosts(await getPublishedPostsAsync()),
    initialData: serverPosts && serverPosts.length > 0
      ? () => sortPosts(serverPosts)
      : () => sortPosts(getPublishedPosts()),
    initialDataUpdatedAt: serverPosts && serverPosts.length > 0 ? Date.now() : 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: stories = [], isLoading: isLoadingStories } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => sortStories(await getAllStoriesAsync()),
    initialData: serverStories && serverStories.length > 0
      ? () => sortStories(serverStories as any)
      : () => sortStories(getAllStories()),
    initialDataUpdatedAt: serverStories && serverStories.length > 0 ? Date.now() : 0,
    staleTime: 1000 * 60 * 5,
  });

  const { data: siteSettings = getSiteSettings(), isLoading: isLoadingSettings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettingsAsync,
    initialData: serverSettings && serverSettings.id
      ? () => serverSettings as any
      : getSiteSettings,
    initialDataUpdatedAt: serverSettings && serverSettings.id ? Date.now() : 0,
    staleTime: 1000 * 60 * 5,
  });

  const DAILY_FALLBACK: DailyFeaturesData = { lastUpdated: new Date().toISOString(), managerPressure: [] };

  const { data: dailyFeatures, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['dailyFeatures'],
    queryFn: async () => {
      // Try the API first (returns fresh scraped data from MongoDB)
      try {
        const apiRes = await fetch("/api/daily-features");
        if (apiRes.ok) {
          const raw = await apiRes.json();
          const validated = safeParse(DailyFeaturesSchema, raw, DAILY_FALLBACK);
          if (validated.rumorMill) return validated as DailyFeaturesData;
        }
      } catch { /* fall through to static file */ }
      // Fallback to static file
      const res = await fetch("/data/daily_features.json");
      if (!res.ok) return DAILY_FALLBACK;
      const raw = await res.json();
      return safeParse(DailyFeaturesSchema, raw, DAILY_FALLBACK) as DailyFeaturesData;
    },
    staleTime: 1000 * 60 * 60,
  });

  const loading = isLoadingPosts || isLoadingStories || isLoadingSettings || isLoadingDaily;
  const error = postsError ? "Could not load the homepage feed right now." : "";

  const standardPosts = useMemo(() => {
    return posts.filter(p => !p.format || p.format === "article");
  }, [posts]);

  const fallbackFeaturedPost = useMemo(() => {
    const flagged = standardPosts.filter((post) => post.mainStory);
    const mustReads = standardPosts.filter((post) => post.mustRead);
    return flagged[0] || mustReads[0] || null;
  }, [standardPosts]);



  const fallbackFeaturedStory = useMemo(() => stories[0] || null, [stories]);
  const heroSelection = useMemo(() => {
    const hero = siteSettings.homepageCuration.hero;
    if (hero.type === "story") {
      const story = stories.find((item) => item.id === hero.id);
      return story ? { type: "story" as const, story } : (fallbackFeaturedStory ? { type: "story" as const, story: fallbackFeaturedStory } : null);
    }

    const post = posts.find((item) => item.id === hero.id);
    if (post) {
      return { type: "post" as const, post };
    }
    if (fallbackFeaturedPost) {
      return { type: "post" as const, post: fallbackFeaturedPost };
    }
    return fallbackFeaturedStory ? { type: "story" as const, story: fallbackFeaturedStory } : null;
  }, [fallbackFeaturedPost, fallbackFeaturedStory, posts, siteSettings.homepageCuration.hero, stories]);

  const latestPosts = useMemo(() => {
    const excludedIds = new Set<string>();
    if (heroSelection?.type === "post") {
      excludedIds.add(heroSelection.post.id);
    }
    return pickOrderedItems(standardPosts, siteSettings.homepageCuration.latestPostIds, 6, excludedIds);
  }, [heroSelection, standardPosts, siteSettings.homepageCuration.latestPostIds]);

  const editorsPicks = useMemo(() => {
    const excludedIds = new Set<string>();
    if (heroSelection?.type === "post") {
      excludedIds.add(heroSelection.post.id);
    }
    
    // Explicitly selected items from Post Editor
    // Bypass the hero exclusion if the author explicitly marked it as an Editor Pick
    const manuallySelected = standardPosts.filter((p) => p.editorPick);
      
    if (manuallySelected.length >= 3) {
      return manuallySelected.slice(0, 3);
    }
    
    // Any remaining slots fall back to highlighted posts or latest posts
    const highlightedPosts = standardPosts.filter((post) => post.mustRead || post.thisWeek);
    const fillerSource = highlightedPosts.length > 0 ? highlightedPosts : standardPosts;
    const filler = fillerSource.filter(
      (p) => !excludedIds.has(p.id) && !manuallySelected.some((m) => m.id === p.id)
    );
    
    return [...manuallySelected, ...filler].slice(0, 3);
  }, [heroSelection, standardPosts]);

  const mappedEditorPicks = useMemo(() => editorsPicks.map(post => ({
    category: post.mustRead ? "Must Read" : "Editor Pick",
    description: post.excerpt,
    image: post.coverImage,
    publishDate: post.readTime || "",
    readMoreLink: `/post/${post.slug || post.id}`,
    title: post.title,
  })), [editorsPicks]);

  const latestStories = useMemo(() => {
    const excludedIds = new Set<string>();
    if (heroSelection?.type === "story") {
      excludedIds.add(heroSelection.story.id);
    }
    return pickOrderedItems(stories, siteSettings.homepageCuration.featuredStoryIds, 3, excludedIds);
  }, [heroSelection, siteSettings.homepageCuration.featuredStoryIds, stories]);
  const issueDate = useMemo(() => (
    dailyFeatures?.lastUpdated
      ? new Date(dailyFeatures.lastUpdated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  ), [dailyFeatures?.lastUpdated]);

  const thisWeekPosts = useMemo(() => {
    return dedupePostsByTitle(standardPosts.filter((p) => p.thisWeek));
  }, [standardPosts]);

  const hasContent = posts.length > 0 || stories.length > 0;

  if (loading && !hasContent) {
    return (
      <div className="page-atmosphere min-h-screen flex flex-col transition-colors duration-300">
        <Header />
        {/* Skeleton for AeroHero */}
        <div className="relative flex min-h-[75vh] w-full items-end justify-center bg-gray-200/50 dark:bg-[#0B1120]/50 animate-pulse border-b border-gray-100 dark:border-gray-800/50">
          <div className="relative z-10 w-full max-w-7xl px-6 pb-20 text-center md:px-6 xl:px-0 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div className="max-w-4xl space-y-6 w-full text-left">
              <div className="h-6 w-32 bg-gray-300/50 dark:bg-gray-800/80 rounded-full" />
              <div className="h-16 md:h-24 w-3/4 bg-gray-300/50 dark:bg-gray-800/80 rounded-3xl" />
              <div className="h-8 md:h-12 w-1/2 bg-gray-300/50 dark:bg-gray-800/80 rounded-2xl" />
            </div>
            <div className="h-16 w-48 bg-gray-300/50 dark:bg-gray-800/80 rounded-full shrink-0 mt-auto" />
          </div>
        </div>

        {/* Skeleton for Editor's Picks / Latest */}
        <main className="mx-auto w-full max-w-[1240px] px-4 py-10 md:py-16 sm:px-6">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-[2rem] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] p-5 h-96 animate-pulse flex flex-col gap-4 shadow-sm">
                <div className="h-48 w-full bg-gray-200/80 dark:bg-gray-800/50 rounded-2xl" />
                <div className="h-8 w-3/4 bg-gray-200/80 dark:bg-gray-800/50 rounded-xl mt-2" />
                <div className="h-4 w-full bg-gray-200/80 dark:bg-gray-800/50 rounded-md" />
                <div className="h-4 w-2/3 bg-gray-200/80 dark:bg-gray-800/50 rounded-md" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="page-atmosphere min-h-screen transition-colors duration-300">
        <Header />
        <main className="mx-auto w-full max-w-[1180px] px-4 py-10 md:py-16 sm:px-6">
          <PageState
            icon={Library}
            eyebrow="Homepage"
            title="No published content yet"
            description={error || "Publish a lead story or a longform piece and the homepage will start taking shape immediately."}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="page-atmosphere min-h-screen transition-colors duration-300">

      <SEO
        title="Home"
        description="A sharper front page for the day's best football analysis, deep reads, stories, and transfer coverage."
        url="https://www.thetouchlinedribble.in/"
        schema={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "The Touchline Dribble",
          "url": "https://www.thetouchlinedribble.in/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.thetouchlinedribble.in/archive?search={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      />
      <Header />

      {/* --- MAIN STORY HERO --- */}
      {heroSelection && (
        <AeroHero
          post={heroSelection.type === "story" ? heroSelection.story : heroSelection.post}
        />
      )}

      {/* --- AUTHOR'S TAKE (INLINE BANNER STRIP) --- */}
      <section className="mb-12 scroll-reveal">
        <div className="relative w-full border-y border-border bg-secondary">
          <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-4 flex-1">
               <div className="h-12 w-12 rounded-full border-2 border-[#16A34A] bg-[#0F172A] overflow-hidden flex items-center justify-center shrink-0">
                 <span className="font-outfit font-black text-white">PA</span>
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-1.5">
                   <p className="kicker px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase text-[10px]">Author's Take</p>
                   <span className="w-1 h-1 rounded-full bg-border"></span>
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Every Friday</p>
                 </div>
                 <h2 className="font-headline text-lg sm:text-2xl tracking-tight text-foreground leading-tight">
                   {siteSettings.authorsTake?.headline || "Lamine Yamal Injury: Barcelona's Tactical Crisis and How Hansi Flick Adapts"}
                 </h2>
               </div>
            </div>
            
            <div className="shrink-0">
              <Link 
                to="/post/lamine-yamal-injury-barcelona-tactics"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#16A34A] hover:bg-[#15803d] text-white font-black uppercase tracking-widest text-[11px] shadow-sm transition-all"
              >
                Read & Analyze
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] px-4 py-10 md:py-16 sm:px-6">
        {/* --- QUICK TAKES --- */}
        <section className="mb-8 scroll-reveal">
          <SectionMarker minute="1'" label="Quick Takes" />
          <QuickTakesSection posts={posts} />
        </section>

        {/* --- MATCH REACTIONS --- */}
        <section className="scroll-reveal">

        </section>

        {/* --- SPACIOUS MAIN LAYOUT --- */}
        <section className="mb-32 scroll-reveal">
          <div className="flex flex-col gap-32">
            
            {/* ── This Week's Big Reads ────────────── */}
            {thisWeekPosts.length > 0 && (
              <div>
                <SectionMarker minute="15'" label="Deep Reads" />
                <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="mt-2 text-4xl sm:text-5xl font-headline tracking-tight text-foreground">
                      Big deeper reads.
                    </h2>
                  </div>
                  <Link
                    to="/archive?format=Weekly%20Briefing"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#16A34A]"
                  >
                    See all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="relative group/scroll">
                  <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                    {thisWeekPosts.map((post) => (
                      <Link
                        key={post.id}
                        to={`/post/${post.slug || post.id}`}
                        className="group relative flex-shrink-0 w-[300px] sm:w-[400px] snap-start rounded-[2rem] overflow-hidden ghost-border-dark dark:ghost-border bg-white dark:bg-[var(--card)] shadow-sm ambient-shadow hover:-translate-y-2 depth-card transition-all duration-500"
                      >
                        <div className="relative h-56 overflow-hidden">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <span className="rounded-full bg-[#16A34A] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#060E20]">
                              {post.club || (post.tags && post.tags[0]) || 'Featured'}
                            </span>
                          </div>
                        </div>
                        <div className="p-6 border-t border-border mt-1">
                          <h3 className="text-xl font-headline text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- TEXT WIRE: Dense headlines section --- */}
            {standardPosts.length > 3 && (
              <div>
                <SectionMarker minute="30'" label="The Wire" />
                <TextWireSection
                  posts={standardPosts.filter((p) => {
                    // Exclude hero and thisWeek posts to avoid duplication
                    const heroId = heroSelection?.type === "post" ? heroSelection.post.id : null;
                    return p.id !== heroId && !p.thisWeek;
                  })}
                  limit={5}
                />
              </div>
            )}

            {/* --- UTILITY WIDGETS (Rumor Mill, Manager Pressure, Prediction Arena) --- */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {dailyFeatures?.rumorMill ? (
                <div className="tinted-panel rounded-3xl p-6 border border-gray-100 dark:border-gray-800/50 bg-white dark:bg-[var(--card)] shadow-sm">
                  <h3 className="font-outfit text-xl font-bold mb-4 dark:text-white">Transfer Rumors</h3>
                  <RumorMillWidget data={dailyFeatures.rumorMill} />
                </div>
              ) : null}
              {siteSettings?.fantasyCorner?.enabled ? (
                <div className="h-full">
                  <FantasyCornerWidget data={siteSettings.fantasyCorner} />
                </div>
              ) : null}
            </div>



            {/* Latest Analysis Block */}
            <div id="latest-articles" className="pt-8 border-t border-border">
              <SectionMarker minute="45+2'" label="Latest Analysis" />
              <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="mt-2 text-4xl sm:text-5xl font-headline tracking-tight text-foreground">
                    Fresh from the feed.
                  </h2>
                </div>
                <Link
                  to="/archive?type=article"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#16A34A]"
                >
                  See every article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post) => (
                  <Link key={post.id} to={`/post/${post.slug || post.id}`} className="block h-full group">
                    <ArticleCard
                      headline={post.title}
                      excerpt={post.excerpt}
                      cover={post.coverImage}
                      tag={post.club || (post.tags && post.tags[0])}
                      readingTime={post.readTime}
                      writer={post.author || ""}
                      publishedAt={post.date}
                      className="h-full border-none shadow-none bg-transparent"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="section-divider" />

        {/* --- EDITOR PICKS (Horizontal Scroll) --- */}
        {editorsPicks.length > 0 && (
          <section className="mt-32 scroll-reveal">
            <SectionMarker minute="HT" label="Editor Picks" />
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="kicker text-primary mb-2">Curated</p>
                <h2 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight text-foreground">
                  Editor Picks.
                </h2>
              </div>
              <Link
                to="/archive"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                Full archive
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
              {editorsPicks.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.slug || post.id}`}
                  className="group relative flex-shrink-0 w-[340px] sm:w-[400px] snap-start rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                        {post.mustRead ? "Must Read" : "Editor Pick"}
                      </span>
                      <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                        {post.club}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-headline font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <span className="font-semibold">By {post.author || "The Touchline Dribble"}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* --- MORE FROM THE ARCHIVE (posts older than 7 days) --- */}
        {(() => {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const olderPosts = standardPosts.filter((p) => {
            const postDate = new Date(p.date);
            return postDate < sevenDaysAgo;
          }).slice(0, 6);
          
          if (olderPosts.length === 0) return null;
          
          return (
            <section className="mt-32 scroll-reveal">
              <SectionMarker minute="75'" label="From The Archive" />
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="kicker text-primary mb-2">Archive</p>
                  <h2 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight text-foreground">
                    More worth your time.
                  </h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Older pieces that still hold up. No expiry date on good analysis.
                  </p>
                </div>
                <Link
                  to="/archive"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary"
                >
                  Browse full archive
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-px bg-border rounded-2xl overflow-hidden border border-border">
                {olderPosts.map((post, idx) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.slug || post.id}`}
                    className="group flex gap-5 items-center bg-card p-5 hover:bg-secondary transition-colors"
                  >
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {post.category || post.club}
                        </span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">{post.readTime}</span>
                      </div>
                      <h3 className="font-headline font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {post.excerpt}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 hidden sm:block" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Section Divider */}
        <div className="section-divider" />

        <section className="mt-32 scroll-reveal w-full max-w-4xl mx-auto px-4 sm:px-6">
          <SupportBanner variant="inline" />
        </section>

        {/* --- COMMUNITY CONTRIBUTOR CTA --- */}
        <section className="mt-20 scroll-reveal">
          <SectionMarker minute="85'" label="Community" />
          <CommunityContributorCTA />
        </section>

        <section className="mt-20 scroll-reveal">
          <SectionMarker minute="FT" label="Stay Connected" />
          <InlineNewsletterCard />
        </section>

        {/* Pro Subscription Upsell (Hidden for now until audience scales) */}
        {/* <section className="mt-8 mb-8">
          <ProSubscriptionScroll />
        </section> */}



      </main>

      <Footer />
    </div>
  );
}
