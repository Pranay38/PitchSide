import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ArrowRight, BookOpen, Library, Newspaper, Repeat2, ScrollText } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { NewsTicker } from "../components/NewsTicker";
import { PollOfTheWeekPanel } from "../components/PollOfTheWeekPanel";
import { OnThisDayWidget } from "../components/OnThisDayWidget";
import { RumorMillWidget, type RumorMill } from "../components/RumorMillWidget";
import { ManagerPressureWidget, type ManagerPressure } from "../components/ManagerPressureWidget";
import { PostCard } from "../components/PostCard";
import { ArticleCard } from "../components/ui/blog-post-card";
import { BlogPostsGrid } from "../components/ui/blog-posts";
import { HeroSection } from "../components/ui/hero-section-shadcnui";
import { TitleRaceTracker } from "../components/TitleRaceTracker";
import { ContainerScroll } from "../components/ui/container-scroll-animation";
import { InlineNewsletterCard } from "../components/InlineNewsletterCard";
import { ProSubscriptionScroll } from "../components/ProSubscriptionScroll";
import { PlatformFeaturesBento } from "../components/PlatformFeaturesBento";
import { PageState } from "../components/PageState";
import { TransferTicker } from "../components/TransferTicker";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { getSiteSettings, getSiteSettingsAsync, type SiteSettings } from "../lib/siteSettingsStorage";
import { buildTransferReliabilityBoard } from "../lib/transferReliability";
import { formatTransferWatchAmount, getTransferTierLabel } from "../lib/transferWatch";
import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import { DebateWidget } from "../components/DebateWidget";

interface DailyFeaturesData {
  lastUpdated: string;
  rumorMill?: RumorMill;
  managerPressure: ManagerPressure[];
}

function sortPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
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
          <h3 className="mt-4 text-2xl font-black font-outfit text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
            {entry.player} to {entry.club}
          </h3>
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

export function HomePage() {
  const { data: posts = [], isLoading: isLoadingPosts, error: postsError } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => sortPosts(await getPublishedPostsAsync()),
    initialData: () => sortPosts(getPublishedPosts()),
    staleTime: 1000 * 60 * 5,
  });

  const { data: stories = [], isLoading: isLoadingStories } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => sortStories(await getAllStoriesAsync()),
    initialData: () => sortStories(getAllStories()),
    staleTime: 1000 * 60 * 5,
  });

  const { data: siteSettings = getSiteSettings(), isLoading: isLoadingSettings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: getSiteSettingsAsync,
    initialData: getSiteSettings,
    staleTime: 1000 * 60 * 5,
  });

  const { data: dailyFeatures, isLoading: isLoadingDaily } = useQuery({
    queryKey: ['dailyFeatures'],
    queryFn: async () => {
      const res = await fetch("/data/daily_features.json");
      if (!res.ok) throw new Error("Daily features unavailable");
      return res.json() as Promise<DailyFeaturesData>;
    },
    staleTime: 1000 * 60 * 60,
  });

  const loading = isLoadingPosts || isLoadingStories || isLoadingSettings || isLoadingDaily;
  const error = postsError ? "Could not load the homepage feed right now." : "";

  const fallbackFeaturedPost = useMemo(() => {
    const mustReads = posts.filter((post) => post.mustRead);
    const flagged = posts.filter((post) => post.mainStory);
    return mustReads[0] || flagged[0] || posts[0] || null;
  }, [posts]);

  // If the admin generated an AI Punchy Line for a Transfer Watch entry, use it to override the daily_features.json!
  const rumorMillCandidate = useMemo(() => {
    const entries = siteSettings?.transferWatch || [];
    // Find the first one with a punchyLine that isn't confirmed
    const entryWithAI = entries.find((e) => e.status === "rumor" && !!e.punchyLine);

    if (!entryWithAI) return null;

    // Use higher sentiment if it's a reliable tier
    const sentimentScore = entryWithAI.tier === 1 ? 85 : entryWithAI.tier === 2 ? 65 : 45;

    return {
      text: `${entryWithAI.player} to ${entryWithAI.club} (${entryWithAI.feeMode === "not-disclosed" ? "undisclosed fee" : `$${entryWithAI.feeMillions}m`})`,
      sentimentScore,
      punchyLine: entryWithAI.punchyLine
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
    return pickOrderedItems(posts, siteSettings.homepageCuration.latestPostIds, 6, excludedIds);
  }, [heroSelection, posts, siteSettings.homepageCuration.latestPostIds]);

  const editorsPicks = useMemo(() => {
    const excludedIds = new Set<string>();
    if (heroSelection?.type === "post") {
      excludedIds.add(heroSelection.post.id);
    }
    const highlightedPosts = posts.filter((post) => post.mustRead || post.thisWeek);
    return pickOrderedItems(
      highlightedPosts.length > 0 ? highlightedPosts : posts,
      siteSettings.homepageCuration.editorPickIds,
      4,
      excludedIds,
    );
  }, [heroSelection, posts, siteSettings.homepageCuration.editorPickIds]);

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

  const hasContent = posts.length > 0 || stories.length > 0;

  if (loading && !hasContent) {
    return (
      <div className="page-atmosphere min-h-screen transition-colors duration-300">
        <Header />
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0F172A]">
              <div className="h-[420px] animate-pulse bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="space-y-6">
              <div className="h-56 animate-pulse rounded-[2rem] bg-gray-200 dark:bg-gray-800" />
              <div className="h-56 animate-pulse rounded-[2rem] bg-gray-200 dark:bg-gray-800" />
            </div>
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
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Home"
        description="A sharper front page for the day's best football analysis, deep reads, stories, and transfer coverage."
        url="https://pitchside-orcin.vercel.app/"
      />
      <Header />


      <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 md:py-12">



        <section className="mb-24">
          <div className="grid gap-8 lg:gap-16 lg:grid-cols-[8fr_4fr] items-start">
            {/* Main Hero Story (Sticky) */}
            <div className="lg:sticky lg:top-24">
              <div className="mb-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                  Featured
                </p>
                <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                  Must Read
                </h2>
              </div>
              {heroSelection?.type === "post" ? (
                <PostCard post={heroSelection.post} featured />
              ) : heroSelection?.type === "story" ? (
                <StoryLinkCard story={heroSelection.story} />
              ) : (
                <PageState
                  icon={ScrollText}
                  eyebrow="Lead Slot"
                  title="Waiting for a lead story"
                  description="Publish a main article or story and the front-page hero will update automatically."
                />
              )}
            </div>

            {/* Daily Briefing Modules (Scrolling Sidebar) */}
            <div className="space-y-6" id="daily-briefing">
              <div className="tinted-panel rounded-[2rem] border border-gray-200 p-5 shadow-sm dark:border-gray-800">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-6 w-1.5 rounded-full bg-[#16A34A]" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                      Daily Briefing
                    </p>
                    <h2 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white">
                      Today&apos;s pulse
                    </h2>
                  </div>
                </div>
                <NewsTicker />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                <YourVoiceSection />
                {rumorMillCandidate ? (
                  <RumorMillWidget data={rumorMillCandidate} />
                ) : dailyFeatures?.rumorMill ? (
                  <RumorMillWidget data={dailyFeatures.rumorMill} />
                ) : null}
                <OnThisDayWidget />
                {dailyFeatures?.managerPressure?.length ? (
                  <ManagerPressureWidget data={dailyFeatures.managerPressure} />
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <TitleRaceTracker />
        </section>

        <section className="mt-24" id="latest-articles">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                Latest Analysis
              </p>
              <h2 className="mt-2 text-4xl font-black font-outfit text-[#0F172A] dark:text-white">
                Fresh reads from the feed
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
          <div className="mb-6 flex flex-wrap gap-2">
            <Link to="/archive?topic=Premier%20League" className="filter-chip">Premier League</Link>
            <Link to="/archive?topic=Tactics" className="filter-chip">Tactics</Link>
            <Link to="/archive?format=Must%20Read" className="filter-chip">Must Reads</Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {latestPosts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="block h-full group">
                <ArticleCard
                  headline={post.title}
                  excerpt={post.excerpt}
                  cover={post.coverImage}
                  tag={post.club || (post.tags && post.tags[0])}
                  readingTime={post.readTime}
                  writer={post.author || ""}
                  publishedAt={post.date}
                  className="h-full"
                />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-12 xl:grid-cols-[8fr_4fr] items-start">
          <div className="w-full">
            <div className="w-full">
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
                    views: Math.floor(Math.random() * 5000) + 1000, // Simulated since we don't have views count yet
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
                    to={`/post/${post.id}`}
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

        <section className="mt-24">
          <InlineNewsletterCard />
        </section>

        {/* Pro Subscription Upsell (Hidden for now until audience scales) */}
        {/* <section className="mt-8 mb-8">
          <ProSubscriptionScroll />
        </section> */}

        <PlatformFeaturesBento />
      </main>

      <Footer />
    </div>
  );
}
