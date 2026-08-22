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
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { getSiteSettings, getSiteSettingsAsync, type SiteSettings } from "../lib/siteSettingsStorage";
import { buildTransferReliabilityBoard } from "../lib/transferReliability";
import { formatTransferWatchAmount, getTransferTierLabel } from "../lib/transferWatch";
import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import { safeParse, DailyFeaturesSchema } from "../lib/schemas";
import { DebateWidget } from "../components/DebateWidget";
import { getClubByName } from "../data/clubs";

// Lazy-load below-the-fold heavy components to reduce initial bundle
const OnThisDayWidget = lazy(() => import("../components/OnThisDayWidget").then(m => ({ default: m.OnThisDayWidget })));
const RumorMillWidget = lazy(() => import("../components/RumorMillWidget").then(m => ({ default: m.RumorMillWidget })));
const ManagerPressureWidget = lazy(() => import("../components/ManagerPressureWidget").then(m => ({ default: m.ManagerPressureWidget })));
const FantasyCornerWidget = lazy(() => import("../components/FantasyCornerWidget").then(m => ({ default: m.FantasyCornerWidget })));

const InlineNewsletterCard = lazy(() => import("../components/InlineNewsletterCard").then(m => ({ default: m.InlineNewsletterCard })));
const BlogPostsGrid = lazy(() => import("../components/ui/blog-posts").then(m => ({ default: m.BlogPostsGrid })));
const TransferReportCardCarousel = lazy(() => import("../components/TransferReportCardCarousel").then(m => ({ default: m.TransferReportCardCarousel })));

import { QuickTakesSection } from "../components/QuickTakesSection";

import { ChallengeTheTake } from "../components/home/ChallengeTheTake";

const PitchXI = lazy(() => import("../components/PitchXI").then(m => ({ default: m.PitchXI })));
import { WORLD_CUP_XI } from "../data/worldCupXI";



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

function TransferSpotlightCard({ entry }: { entry: ReturnType<typeof buildTransferReliabilityBoard>[number] }) {
  const fromClubInfo = entry.fromClub ? getClubByName(entry.fromClub) : null;
  const toClubInfo = getClubByName(entry.club);

  return (
    <Link
      to={`/transfers/${entry.dossierSlug}`}
      className="group block section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
            <Repeat2 className="h-3.5 w-3.5" />
            Transfer Dossier
          </p>
          <div className="mt-4 flex items-center gap-3">
            {entry.playerImageUrl && (
              <img 
                 src={entry.playerImageUrl} 
                 alt={entry.player} 
                 className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-[#16A34A]/30 shadow-sm shrink-0 bg-gray-100 dark:bg-gray-800"
              />
            )}
            <h3 className="text-2xl font-black font-outfit text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
              {entry.player}
            </h3>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-bold">
            {entry.fromClub && (
              <>
                <div className="flex items-center gap-1.5 text-rose-500">
                    {fromClubInfo?.logo ? (
                        <img src={fromClubInfo.logo} alt={entry.fromClub} className="w-4 h-4 object-contain" />
                    ) : (
                        <ShieldQuestion className="w-4 h-4" />
                    )}
                    <span>{entry.fromClub}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              </>
            )}
            <div className="flex items-center gap-1.5 text-emerald-500">
                {toClubInfo?.logo ? (
                    <img src={toClubInfo.logo} alt={entry.club} className="w-4 h-4 object-contain" />
                ) : (
                    <ShieldQuestion className="w-4 h-4" />
                )}
                <span>{entry.club}</span>
            </div>
          </div>
        </div>
        <div className="rounded-[1.25rem] bg-[#0F172A] px-4 py-3 text-white dark:bg-[#08111f]">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#4ade80]">Reliability</p>
          <p className="mt-1 text-2xl font-black font-outfit">{entry.reliabilityScore}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-xs font-bold text-[#16A34A]">
          {entry.boardLabel}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[#475569] dark:bg-white/5 dark:text-gray-300">
          {entry.status === "confirmed" ? "Official" : getTransferTierLabel(entry.tier, entry.status)}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[#475569] dark:bg-white/5 dark:text-gray-300">
          {formatTransferWatchAmount(entry)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#64748B] dark:text-gray-400">
        {entry.rationale[0]}
      </p>
      <p className="mt-4 text-sm font-bold text-[#16A34A]">Open dossier</p>
    </Link>
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
    const mustReads = standardPosts.filter((post) => post.mustRead);
    const flagged = standardPosts.filter((post) => post.mainStory);
    return mustReads[0] || flagged[0] || standardPosts[0] || null;
  }, [standardPosts]);

  // If the admin generated an AI Punchy Line for a Transfer Watch entry, use it to override the daily_features.json!
  const rumorMillCandidate = useMemo(() => {
    const entries = siteSettings?.transferWatch || [];
    // Find all entries with a punchyLine that aren't confirmed
    const validEntries = entries.filter((e) => e.status === "rumor" && !!e.punchyLine);

    if (validEntries.length === 0) return null;

    // Pick a random entry to keep it fresh
    const randomIndex = Math.floor(Math.random() * validEntries.length);
    const entryWithAI = validEntries[randomIndex];

    // Use higher sentiment if it's a reliable tier
    const sentimentScore = entryWithAI.tier === 1 ? 85 : entryWithAI.tier === 2 ? 65 : 45;

    return {
      text: `${entryWithAI.player} to ${entryWithAI.club} (${entryWithAI.feeMode === "not-disclosed" ? "undisclosed fee" : `$${entryWithAI.feeMillions}m`})`,
      sentimentScore,
      punchyLine: entryWithAI.punchyLine,
      playerImageUrl: entryWithAI.playerImageUrl
    };
  }, [siteSettings]);

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
  const transferSpotlights = useMemo(() => {
    const board = buildTransferReliabilityBoard(siteSettings.transferWatch);
    if (board.length === 0) return [];
    return pickOrderedItems(board, siteSettings.homepageCuration.transferSpotlightIds, 2);
  }, [siteSettings.homepageCuration.transferSpotlightIds, siteSettings.transferWatch]);
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
        <main className="mx-auto w-full max-w-[1240px] px-4 py-16 sm:px-6">
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
        <main className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6">
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
        url="https://thetouchlinedribble.in/"
        schema={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "The Touchline Dribble",
          "url": "https://thetouchlinedribble.in/",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://thetouchlinedribble.in/archive?search={search_term_string}",
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
        <div className="relative w-full border-y border-gray-200 dark:border-gray-800/60 bg-gradient-to-r from-gray-50 to-white dark:from-[#060e20] dark:to-[#0b1325]">
          <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-4 flex-1">
               <div className="h-12 w-12 rounded-full border-2 border-[#16A34A] bg-[#0F172A] overflow-hidden flex items-center justify-center shrink-0">
                 <span className="font-outfit font-black text-white">PA</span>
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-1.5">
                   <p className="font-outfit text-[10px] font-black text-[#16A34A] uppercase tracking-[0.2em]">Author's Take</p>
                   <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                   <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Every Friday</p>
                 </div>
                 <h2 className="font-outfit text-lg sm:text-2xl font-black text-[#0F172A] dark:text-white leading-tight">
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

      <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 md:py-12">
        {/* --- QUICK TAKES --- */}
        <section className="mb-8 scroll-reveal">
          <QuickTakesSection posts={posts} />
        </section>

        {/* --- MATCH REACTIONS --- */}
        <section className="scroll-reveal">

        </section>

        {/* --- WORLD CUP XI / TEAM OF THE WEEK --- */}
        <section className="my-16 scroll-reveal">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                🏆 Editor&apos;s Pick
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black font-outfit text-[#0F172A] dark:text-white">
                Our World Cup XI.
              </h2>
              <p className="mt-2 text-sm text-[#64748B] dark:text-gray-400">
                Tap any player to see why they made the cut.
              </p>
            </div>
            <Link
              to="/world-cup-xi"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#16A34A]"
            >
              Full breakdown
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Suspense fallback={
            <div className="mx-auto max-w-[440px] aspect-[3/4.2] rounded-[2rem] bg-[#1a5c2a]/20 animate-pulse" />
          }>
            <PitchXI team={WORLD_CUP_XI} compact />
          </Suspense>
        </section>


        {/* --- SPACIOUS MAIN LAYOUT --- */}
        <section className="mb-32 scroll-reveal">
          <div className="flex flex-col gap-24">
            
            {/* ── This Week's Big Reads ────────────── */}
            {thisWeekPosts.length > 0 && (
              <div>
                <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="mt-2 text-4xl sm:text-5xl font-black font-outfit text-[#0F172A] dark:text-white">
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
                        <div className="p-6">
                          <h3 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white line-clamp-2 group-hover:text-[#16A34A] transition-colors">
                            {post.title}
                          </h3>
                          <p className="mt-3 text-sm text-[#64748B] dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
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
              {dailyFeatures?.managerPressure?.length ? (
                <div className="tinted-panel rounded-3xl p-6 border border-gray-100 dark:border-gray-800/50 bg-white dark:bg-[var(--card)] shadow-sm">
                  <h3 className="font-outfit text-xl font-bold mb-4 dark:text-white">Managerial Pressure</h3>
                  <ManagerPressureWidget data={dailyFeatures.managerPressure} />
                </div>
              ) : null}
              {siteSettings?.fantasyCorner?.enabled ? (
                <div className="h-full">
                  <FantasyCornerWidget data={siteSettings.fantasyCorner} />
                </div>
              ) : null}
            </div>

            {/* --- TRANSFER REPORT CARD CAROUSEL --- */}
            <div className="scroll-reveal">
              <Suspense fallback={
                <div className="tinted-panel rounded-[2rem] border border-gray-200 p-5 shadow-sm dark:border-gray-800 animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
                  <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                </div>
              }>
                <TransferReportCardCarousel />
              </Suspense>
            </div>

            {/* Latest Analysis Block */}
            <div id="latest-articles" className="pt-8 border-t border-gray-100 dark:border-gray-800/50">
              <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="mt-2 text-4xl sm:text-5xl font-black font-outfit text-[#0F172A] dark:text-white">
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

        <section className="mt-24 grid gap-12 xl:grid-cols-[8fr_4fr] items-start scroll-reveal">
          <div className="w-full">
            <div className="w-full">
              {/* Deep Reads (Stories) - TEMPORARILY HIDDEN
              {latestStories.length > 0 ? (
                <BlogPostsGrid
                  title="Deep Reads"
                  description="Immersive longform stories built for slower reading. Dive deeper."
                  backgroundLabel="READS"
                  posts={latestStories.slice(0, 3).map(story => ({
                    id: story.id,
                    title: story.title,
                    category: story.eyebrow,
                    imageUrl: story.coverImage,
                    views: Math.floor(Math.random() * 5000) + 1000,
                    readTime: parseInt(story.readTime || "5", 10),
                    rating: 5,
                    href: `/stories/${story.slug}`
                  }))}
                  onPostClick={(post) => {
                    if (post.href) window.location.href = post.href;
                  }}
                />
              ) : (
                <PageState
                  icon={ScrollText}
                  eyebrow="Stories"
                  title="Longform is on the way"
                  description="Publish a story and it will slot into the deep reads rail automatically."
                />
              )}
              */}
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-gray-200 bg-[linear-gradient(180deg,#0f172a,#111f35)] p-6 text-white shadow-xl shadow-[#0F172A]/10 dark:border-gray-800">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-6 w-1.5 rounded-full bg-[#16A34A]" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                    Editor Picks
                  </p>
                  <h2 className="text-lg font-black font-outfit text-white">
                    Stronger entry points into the site
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {editorsPicks.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.slug || post.id}`}
                    className="group flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-[#16A34A]/30 hover:bg-white/[0.08]"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                        {post.mustRead ? "Must Read" : "Editor Pick"}
                      </p>
                      <h3 className="mt-1 text-base font-black font-outfit text-white transition-colors group-hover:text-[#86efac]">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-white/68">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
              {transferSpotlights.length > 0 ? (
                transferSpotlights.map((entry) => (
                  <TransferSpotlightCard key={entry.id} entry={entry} />
                ))
              ) : (
                <Link
                  to="/transfers"
                  className="group section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800"
                >
                  <p className="inline-flex items-center gap-2 rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                    <Repeat2 className="h-3.5 w-3.5" />
                    Transfer Reliability
                  </p>
                  <h3 className="mt-4 text-2xl font-black font-outfit text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
                    Track the market without reading a raw rumor feed.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                    The reliability board remains the fast path into transfer coverage from the homepage.
                  </p>
                </Link>
              )}
              <Link
                to="/archive?type=story"
                className="group block section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800"
              >
                <p className="inline-flex items-center gap-2 rounded-full bg-[#0F172A]/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:bg-white/5 dark:text-gray-300">
                  <BookOpen className="h-3.5 w-3.5 text-[#16A34A]" />
                  Archive Entry Point
                </p>
                <h3 className="mt-4 text-2xl font-black font-outfit text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
                  Use the archive as the site&apos;s real search layer.
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                  Filter by club, league, topic, and format instead of scrolling until something looks familiar.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="section-divider" />

        <section className="mt-24 scroll-reveal">
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
