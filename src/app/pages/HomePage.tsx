import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { ClubSelectionModal } from "../components/ClubSelectionModal";
import type { BlogPost } from "../data/posts";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { getClubByName } from "../data/clubs";
import { ClubFixture, getLeagueCodeForClubLeague, getLiveFixturesForClub, getRecentFixturesForClub, getUpcomingFixturesForClub } from "../lib/clubFixtures";
import { isClubFollowed, toggleFollowedClub } from "../lib/libraryStorage";
import { Search, X, Filter, Sparkles, Trophy, ChevronDown, Shield, User, ArrowUp, BellRing, ArrowRight, CalendarDays, Newspaper, RadioTower } from "lucide-react";
import { NewsTicker } from "../components/NewsTicker";
import { PollOfTheWeekPanel } from "../components/PollOfTheWeekPanel";
import { RunInTracker } from "../components/RunInTracker";
import { ManagerPressureWidget, ManagerPressure } from "../components/ManagerPressureWidget";
import { OnThisDayWidget } from "../components/OnThisDayWidget";
import { MatchRatingWidget } from "../components/MatchRatingWidget";
import { useCloudSync } from "../hooks/useCloudSync";
import { RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

interface DailyFeaturesData {
  lastUpdated: string;
    managerPressure: ManagerPressure[];
}

export function HomePage() {
  const { favoriteClub, isOnboarded, setFavoriteClub, skipOnboarding, clearPreference } = useClubPreference();
  useCloudSync(); // Sync saved posts & follows for signed-in Clerk users
  const [showModal, setShowModal] = useState(!isOnboarded);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [dailyFeatures, setDailyFeatures] = useState<DailyFeaturesData | null>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [favoriteClubFixtures, setFavoriteClubFixtures] = useState<ClubFixture[]>([]);
  const [favoriteClubLiveFixtures, setFavoriteClubLiveFixtures] = useState<ClubFixture[]>([]);
  const [favoriteClubRecentFixtures, setFavoriteClubRecentFixtures] = useState<ClubFixture[]>([]);
  const favoriteClubData = favoriteClub ? getClubByName(favoriteClub) : null;

  const postsPerPage = 4;
  const [visibleCount, setVisibleCount] = useState(() => {
    // Restore from URL ?page= param
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get("page") || "1", 10);
    return Math.max(postsPerPage, page * postsPerPage);
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isFollowingFavoriteClub, setIsFollowingFavoriteClub] = useState(() => (
    favoriteClub ? isClubFollowed(favoriteClub) : false
  ));

  // Read posts from storage
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => getPublishedPosts());

  useEffect(() => {
    let isMounted = true;

    getPublishedPostsAsync()
      .then((posts) => {
        if (isMounted && posts.length > 0) {
          setBlogPosts(posts);
        }
      })
      .catch(() => {
        // Keep local snapshot if API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/data/daily_features.json")
      .then((res) => {
        if (!res.ok) throw new Error("Data not found");
        return res.json();
      })
      .then((jsonData) => {
        if (isMounted) setDailyFeatures(jsonData);
      })
      .catch((err) => {
        console.error("Error fetching daily features:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!favoriteClub || !favoriteClubData) {
      setFavoriteClubFixtures([]);
      setFavoriteClubLiveFixtures([]);
      setFavoriteClubRecentFixtures([]);
      return;
    }

    const controller = new AbortController();

    Promise.all([
      getUpcomingFixturesForClub(favoriteClub, favoriteClubData.league, controller.signal),
      getLiveFixturesForClub(favoriteClub, favoriteClubData.league, controller.signal),
      getRecentFixturesForClub(favoriteClub, favoriteClubData.league, controller.signal),
    ])
      .then(([upcomingFixtures, liveFixtures, recentFixtures]) => {
        setFavoriteClubFixtures(upcomingFixtures.slice(0, 3));
        setFavoriteClubLiveFixtures(liveFixtures.slice(0, 2));
        setFavoriteClubRecentFixtures(recentFixtures.slice(0, 3));
      })
      .catch(() => {
        setFavoriteClubFixtures([]);
        setFavoriteClubLiveFixtures([]);
        setFavoriteClubRecentFixtures([]);
      });

    return () => controller.abort();
  }, [favoriteClub, favoriteClubData]);

  useEffect(() => {
    setIsFollowingFavoriteClub(favoriteClub ? isClubFollowed(favoriteClub) : false);
  }, [favoriteClub]);

  // Extract all unique tags across posts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    blogPosts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [blogPosts]);

  // Extract unique clubs
  const allClubs = useMemo(() => {
    const clubSet = new Set<string>();
    blogPosts.forEach((p) => { if (p.club) clubSet.add(p.club); });
    return Array.from(clubSet).sort();
  }, [blogPosts]);

  // Combine tags for filter pill list
  const filterTags = useMemo(() => {
    const tags = new Set<string>();
    blogPosts.forEach(p => p.tags.forEach(t => tags.add(t)));
    // We can show top ~10 tags based on frequency
    const freq = new Map<string, number>();
    blogPosts.forEach(p => p.tags.forEach(t => freq.set(t, (freq.get(t) || 0) + 1)));
    return Array.from(tags).sort((a,b) => (freq.get(b) || 0) - (freq.get(a) || 0)).slice(0, 10);
  }, [blogPosts]);

  // Extract unique player names
  const allPlayers = useMemo(() => {
    const playerSet = new Set<string>();
    blogPosts.forEach((p) => { if (p.playerName) playerSet.add(p.playerName); });
    return Array.from(playerSet).sort();
  }, [blogPosts]);

  // Smart sorting: prioritize club posts instead of filtering
  const sortedPosts = useMemo(() => {
    let posts = [...blogPosts];

    // If a club is selected and tab is "All", sort so club-related posts appear first
    if (favoriteClub && activeTab === "All") {
      posts.sort((a, b) => {
        const aMatch = a.club === favoriteClub || a.tags.includes(favoriteClub) ? 1 : 0;
        const bMatch = b.club === favoriteClub || b.tags.includes(favoriteClub) ? 1 : 0;
        return bMatch - aMatch; // club posts first
      });
    }

    return posts;
  }, [blogPosts, favoriteClub, activeTab]);

  // Filter by search query and active tab
  const filteredPosts = useMemo(() => {
    let posts = sortedPosts;

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.club.toLowerCase().includes(q)
      );
    }

    // Filter by active tab (which is now a tag or "All")
    if (activeTab !== "All") {
       posts = posts.filter((p) => p.tags.includes(activeTab) || p.club === activeTab);
    }

    return posts;
  }, [sortedPosts, searchQuery, activeTab]);

  const favoriteClubPosts = useMemo(() => {
    if (!favoriteClub) return [];

    return [...blogPosts]
      .filter((post) => {
        const normalizedClub = favoriteClub.toLowerCase();
        return (
          post.club.toLowerCase() === normalizedClub
          || post.tags.some((tag) => tag.toLowerCase() === normalizedClub)
          || post.title.toLowerCase().includes(normalizedClub)
        );
      })
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [blogPosts, favoriteClub]);

  // Main Story: prioritize posts flagged as mainStory, otherwise latest by date
  const mainStoryPosts = useMemo(() => {
    if (searchQuery) return [];
    if (blogPosts.length === 0) return [];
    
    // Check if any posts are explicitly flagged as main story
    const flaggedMain = blogPosts.filter((p) => p.mainStory);
    
    // Sort flagged posts by date (newest first)
    if (flaggedMain.length > 0) {
      return flaggedMain.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    // Otherwise, fall back to the single latest post by date
    const byDate = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return byDate.length > 0 ? [byDate[0]] : [];
  }, [blogPosts, searchQuery]);

  // Handle auto-advancing hero carousel
  useEffect(() => {
    if (mainStoryPosts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % mainStoryPosts.length);
    }, 5000); // Change story every 5 seconds
    return () => clearInterval(timer);
  }, [mainStoryPosts.length]);

  // We exclude the main stories from the rest of the feed
  const heroPosts = useMemo(() => {
    return mainStoryPosts;
  }, [mainStoryPosts]);

  // This Week in Football (only show when not searching)
  const thisWeekPosts = useMemo(() => {
    if (searchQuery) return [];

    // Prioritize explicitly marked 'thisWeek' posts, otherwise recent, sorted by positive reactions
    return blogPosts
      .filter((p) => p.thisWeek)
      .sort((a, b) => {
        const getScore = (p: typeof a) => (p.reactions?.fire || 0) * 2 + (p.reactions?.mindblown || 0) * 2 + (p.reactions?.target || 0) * 2 - (p.reactions?.thumbsdown || 0) - (p.reactions?.cold || 0);
        return getScore(b) - getScore(a);
      })
      .slice(0, 21);
  }, [blogPosts, searchQuery]);
  // Must Read / Editor's Picks (only show when not searching)
  const mustReadPosts = useMemo(() => {
    if (searchQuery) return [];
    return blogPosts.filter((p) => p.mustRead).slice(0, 4);
  }, [blogPosts, searchQuery]);

  const latestFavoriteClubPost = favoriteClubPosts[0] || null;
  const primaryFavoriteClubFixture = favoriteClubLiveFixtures[0] || favoriteClubFixtures[0] || null;
  const latestFavoriteClubResult = favoriteClubRecentFixtures[0] || null;

  // Remaining posts for grid
  const remainingPosts = useMemo(() => {
    const excludeIds = new Set([
      ...heroPosts.map(p => p.id),
      ...thisWeekPosts.map(p => p.id),
      ...mustReadPosts.map(p => p.id)
    ]);
    return filteredPosts.filter((p) => p.id && !excludeIds.has(p.id));
  }, [filteredPosts, heroPosts, thisWeekPosts, mustReadPosts]);

  const currentPosts = remainingPosts.slice(0, visibleCount);
  const hasMorePosts = visibleCount < remainingPosts.length;

  const handleSelectClub = (club: string) => {
    setFavoriteClub(club);
    setShowModal(false);
  };

  const handleSkip = () => {
    clearPreference();
    skipOnboarding();
    setShowModal(false);
  };

  const handleChangeClub = () => {
    setShowModal(true);
  };

  const handleToggleFavoriteClubAlerts = useCallback(() => {
    if (!favoriteClub) {
      setShowModal(true);
      return;
    }

    const next = toggleFollowedClub(favoriteClub);
    setIsFollowingFavoriteClub(next);
    toast.success(next ? `Following ${favoriteClub} alerts` : `${favoriteClub} alerts removed`);
  }, [favoriteClub]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    setVisibleCount(postsPerPage);
  }, [searchQuery, activeTab, favoriteClub]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMorePosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + postsPerPage, remainingPosts.length));
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMorePosts, remainingPosts.length, postsPerPage]);

  // Update URL with current page number when visibleCount changes
  useEffect(() => {
    const currentPage = Math.ceil(visibleCount / postsPerPage);
    const params = new URLSearchParams(window.location.search);
    if (currentPage > 1) {
      params.set("page", String(currentPage));
    } else {
      params.delete("page");
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [visibleCount, postsPerPage]);

  // Show/hide "Back to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 1200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const formatFixtureDate = useCallback((utcDate: string) => (
    new Date(utcDate).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  ), []);


  if (blogPosts.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
        <Header onChangeClub={handleChangeClub} favoriteClub={favoriteClub} />
        <div className="flex flex-col items-center justify-center py-32 animate-float-in">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-lg font-bold font-outfit text-[#0F172A] dark:text-white mb-2">No posts yet</h2>
          <p className="text-sm text-[#64748B] dark:text-gray-400">Check back soon for fresh football content!</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO />
      <Header onChangeClub={handleChangeClub} favoriteClub={favoriteClub} />

      <ClubSelectionModal
        isOpen={showModal}
        onSelectClub={handleSelectClub}
        onSkip={handleSkip}
      />

      <main className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 pb-20 flex-grow">

        {/* Search + Filter Section */}
        <div className="mb-8 space-y-4 animate-float-in">
          {/* Search Bar - Glass style */}
          <div className="relative max-w-xl mx-auto md:mx-0 glass-card rounded-2xl group focus-within:glow-green transition-all duration-300">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#16A34A] transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search posts, clubs, tags..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-transparent text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none transition-all text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation - Dynamic Tags */}
        <div className="flex items-center gap-2 overflow-visible flex-wrap pb-2 border-b border-gray-200 dark:border-gray-800">
          <button
              onClick={() => setActiveTab("All")}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 relative ${activeTab === "All"
                ? "bg-[#16A34A] text-white"
                : "bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:border-[#16A34A]/50"
                }`}
          >All</button>
          
          {filterTags.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 relative ${activeTab === tab
                ? "bg-[#16A34A] text-white"
                : "bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:border-[#16A34A]/50"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Active search indicator */}
        {searchQuery && (
          <div className="flex items-center gap-2 mb-6 text-sm text-[#64748B] dark:text-gray-400 glass-card rounded-2xl px-4 py-3 animate-float-in">
            <span>
              {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} found
              for "<span className="font-semibold text-[#0F172A] dark:text-white">{searchQuery}</span>"
            </span>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[#16A34A] hover:underline font-bold ml-auto"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Hero Section: Main Stories Only (when no filters) */}
        {
          mainStoryPosts.length > 0 && !searchQuery && (
            <section className="mb-10 animate-float-in overflow-hidden relative group">
              {/* Active Main Story — Fade transition */}
              <div className="relative h-[380px] md:h-[480px] w-full mb-4">
                {mainStoryPosts.map((post, index) => (
                   <div 
                     key={post.id} 
                     className={`absolute inset-0 transition-opacity duration-1000 ${index === activeHeroIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
                   >
                     <PostCard post={post} featured />
                   </div>
                ))}
              </div>
              
              {/* Navigation Dots (Only if there are multiple) */}
              {mainStoryPosts.length > 1 && (
                <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-2">
                  {mainStoryPosts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveHeroIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === activeHeroIndex 
                        ? "w-8 bg-[#16A34A] opacity-100 shadow-[0_0_8px_rgba(22,163,74,0.8)]" 
                        : "w-2 bg-white/50 hover:bg-white border border-white/20 opacity-70"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        }

        {/* Club Personalization Note */}
        {
          favoriteClub && !searchQuery && activeTab === "Club" && (
            <div className="flex items-center justify-between gap-2 mb-8 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#16A34A]/10 via-[#22c55e]/5 to-transparent border border-[#16A34A]/15 glow-green animate-float-in">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-[#16A34A]" />
                <span className="text-sm text-[#16A34A] font-bold font-outfit">Your Feed is tuned for {favoriteClub}</span>
              </div>
            </div>
          )
        }

        {/* This Week in Football */}
        {
          thisWeekPosts.length > 0 && !searchQuery && (
            <section className="animate-float-in mb-10 overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full gradient-accent" />
                  <h2 className="text-xl md:text-2xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                    This Week
                  </h2>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Swipe / Scroll</span>
                  <div className="w-8 h-px bg-gray-300 dark:bg-gray-700"></div>
                  <div className="w-2 h-2 rounded-full border border-gray-400 dark:border-gray-600 animate-ping"></div>
                </div>
              </div>

              {/* Horizontal Scrolling Area */}
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 hide-scroll-bar -mx-4 px-4 sm:mx-0 sm:px-0">
                {thisWeekPosts.map((post) => (
                  <div key={post.id} className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px]">
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            </section>
          )
        }

        {/* The Daily Fix Section */}

        <MatchRatingWidget />

        {/* News Pulse */}
        {!searchQuery && (
          <section className="mb-14 animate-float-in">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-[#16A34A]" />
                <h2 className="text-xl md:text-2xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                  News Pulse
                </h2>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Live headlines
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="animate-float-in">
                <NewsTicker />
              </div>
              <div className="animate-float-in">
                <PollOfTheWeekPanel />
              </div>
            </div>
          </section>
        )}

        {/* Newspaper 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Content Column (Left, 65%) */}
          <div className="w-full lg:w-[65%] flex flex-col gap-10">

            {/* Latest Posts List */}
            {currentPosts.length > 0 ? (
              <section className="animate-float-in">
                <div className="flex items-center gap-3 pb-3 mb-5">
                  <div className="w-1.5 h-8 rounded-full gradient-accent" />
                  <h2 className="text-xl md:text-2xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                    {searchQuery ? "Search Results" : `Latest in ${activeTab}`}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {currentPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                <div ref={loadMoreRef} className="h-4" />
                {hasMorePosts && (
                  <div className="text-center text-sm text-[#94A3B8] py-4">
                    Loading more content...
                  </div>
                )}
              </section>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl animate-float-in">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-bold font-outfit text-[#0F172A] dark:text-white mb-2">No posts found</h3>
                <p className="text-sm text-[#64748B] dark:text-gray-400 text-center max-w-sm mb-4">
                  Try a different search term or clear your filters to see all posts.
                </p>
                <button
                  onClick={() => { setSearchQuery(""); }}
                  className="px-6 py-2.5 gradient-accent text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[#16A34A]/25 transition-all duration-300"
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Column (Right, 35%) */}
          <aside className="w-full lg:w-[35%] flex flex-col gap-8">

            {/* Must Read / Editor's Pick Mini block */}
            {mustReadPosts.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-5 text-white shadow-xl border border-white/5 animate-float-in">
                <h3 className="text-base uppercase tracking-wider font-black font-outfit mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Editor Picks
                </h3>
                <div className="flex flex-col gap-4">
                  {mustReadPosts.map((post) => (
                    <a key={post.id} href={`/post/${post.id}`} className="group flex gap-3 pb-4 border-b border-white/10 last:border-0 last:pb-0">
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-snug group-hover:text-amber-400 transition-colors duration-200 line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-[11px] text-white/50 mt-1">{post.date}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!searchQuery && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] p-5 animate-float-in">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black font-outfit uppercase tracking-[0.18em] text-[#16A34A] mb-1">
                      Newsletter
                    </p>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                      Get the week&apos;s best reads in one email
                    </h3>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                      Subscribe below for new analysis and curated football updates.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      document.querySelector("footer")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="shrink-0 px-4 py-2.5 border border-[#16A34A]/20 text-[#16A34A] text-sm font-bold rounded-xl hover:bg-[#16A34A]/5 transition-all duration-300"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            )}

            {/* Utility stack */}
            <div className="sticky top-6 flex flex-col gap-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-sm p-4 animate-float-in">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-5 rounded-full bg-[#16A34A]" />
                  <h3 className="text-sm font-black font-outfit uppercase tracking-wider text-[#0F172A] dark:text-white">
                    Matchday Tools
                  </h3>
                </div>
                <div className="space-y-6">
                  <div className="animate-float-in">
                    <RunInTracker />
                  </div>
                  
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main >

      {/* Back to Top Button */}
      {
        showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/30 flex items-center justify-center hover:bg-[#15803d] transition-all duration-300 hover:shadow-xl hover:shadow-[#16A34A]/40 animate-float-in"
            title="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )
      }

      <Footer />
    </div >
  );
}
