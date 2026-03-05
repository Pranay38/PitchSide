import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { ClubSelectionModal } from "../components/ClubSelectionModal";
import type { BlogPost } from "../data/posts";
import { getAllPosts, getAllPostsAsync } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { Search, X, Filter, Sparkles, Trophy, ChevronDown, Shield, User, ArrowUp } from "lucide-react";
import { NewsTicker } from "../components/NewsTicker";
import { FPLAnalyzer } from "../components/FPLAnalyzer";
import { SocialWall } from "../components/SocialWall";
import { SocialFeed } from "../components/SocialFeed";
import { getSiteSettings, getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import { ManagerPressureWidget, ManagerPressure } from "../components/ManagerPressureWidget";
import { OnThisDayWidget, OnThisDayEvent } from "../components/OnThisDayWidget";
import { RumorMillWidget, RumorMill } from "../components/RumorMillWidget";
import { RefreshCw, Zap } from "lucide-react";

interface DailyFeaturesData {
  lastUpdated: string;
  onThisDay: OnThisDayEvent;
  rumorMill: RumorMill;
  managerPressure: ManagerPressure[];
}

export function HomePage() {
  const { favoriteClub, isOnboarded, setFavoriteClub, skipOnboarding, clearPreference } = useClubPreference();
  const [showModal, setShowModal] = useState(!isOnboarded);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeClub, setActiveClub] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
  const [siteSettings, setSiteSettings] = useState(() => getSiteSettings());
  const [dailyFeatures, setDailyFeatures] = useState<DailyFeaturesData | null>(null);

  const postsPerPage = 4;
  const [visibleCount, setVisibleCount] = useState(() => {
    // Restore from URL ?page= param
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get("page") || "1", 10);
    return Math.max(postsPerPage, page * postsPerPage);
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Read posts from storage
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => getAllPosts());

  useEffect(() => {
    let isMounted = true;

    getAllPostsAsync()
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

    getSiteSettingsAsync()
      .then((settings) => {
        if (isMounted) setSiteSettings(settings);
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

  // Extract unique player names
  const allPlayers = useMemo(() => {
    const playerSet = new Set<string>();
    blogPosts.forEach((p) => { if (p.playerName) playerSet.add(p.playerName); });
    return Array.from(playerSet).sort();
  }, [blogPosts]);

  // Smart sorting: prioritize club posts instead of filtering
  const sortedPosts = useMemo(() => {
    let posts = [...blogPosts];

    // If a club is selected, sort so club-related posts appear first
    if (favoriteClub) {
      posts.sort((a, b) => {
        const aMatch = a.club === favoriteClub || a.tags.includes(favoriteClub) ? 1 : 0;
        const bMatch = b.club === favoriteClub || b.tags.includes(favoriteClub) ? 1 : 0;
        return bMatch - aMatch; // club posts first
      });
    }

    return posts;
  }, [blogPosts, favoriteClub]);

  // Filter by search query and active tag
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

    // Filter by active tag
    if (activeTag) {
      posts = posts.filter((p) => p.tags.includes(activeTag));
    }

    // Filter by active club
    if (activeClub) {
      posts = posts.filter((p) => p.club === activeClub);
    }

    // Filter by active player
    if (activePlayer) {
      posts = posts.filter((p) => p.playerName === activePlayer);
    }

    return posts;
  }, [sortedPosts, searchQuery, activeTag, activeClub, activePlayer]);

  // Main Story: prioritize post flagged as mainStory, otherwise latest by date
  const mainStoryPost = useMemo(() => {
    if (searchQuery || activeTag) return null;
    if (blogPosts.length === 0) return null;
    // First, check if any post is explicitly flagged as main story
    const flaggedMain = blogPosts.find((p) => p.mainStory);
    if (flaggedMain) return flaggedMain;
    // Otherwise, fall back to the latest post by date
    const byDate = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return byDate[0] || null;
  }, [blogPosts, searchQuery, activeTag]);

  // We only exclude the main story from the rest of the feed
  const heroPosts = useMemo(() => {
    return mainStoryPost ? [mainStoryPost] : [];
  }, [mainStoryPost]);

  // This Week in Football (only show when not searching or filtering)
  const thisWeekPosts = useMemo(() => {
    if (searchQuery || activeTag) return [];

    // Prioritize explicitly marked 'thisWeek' posts, otherwise recent
    return blogPosts.filter((p) => p.thisWeek).slice(0, 21);
  }, [blogPosts, searchQuery, activeTag]);
  // Must Read / Editor's Picks (only show when not searching or filtering)
  const mustReadPosts = useMemo(() => {
    if (searchQuery || activeTag) return [];
    return blogPosts.filter((p) => p.mustRead).slice(0, 4);
  }, [blogPosts, searchQuery, activeTag]);

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

  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    setVisibleCount(postsPerPage);
  }, [searchQuery, activeTag, activeClub, activePlayer, favoriteClub]);

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

          {/* Category / Tag Filter Bar - Glass pills */}
          <div className="flex items-center gap-2 overflow-visible flex-wrap pb-2">
            <Filter className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <button
              onClick={() => { setActiveTag(null); setActiveClub(null); setActivePlayer(null); }}
              className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${!activeTag && !activeClub && !activePlayer
                ? "gradient-accent text-white shadow-md shadow-[#16A34A]/20"
                : "glass-card text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:text-[#4ade80]"
                }`}
            >
              All
            </button>

            {/* Clubs Dropdown - inline with pills */}
            {allClubs.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => { setShowClubDropdown(!showClubDropdown); setShowPlayerDropdown(false); }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${activeClub
                    ? "gradient-accent text-white shadow-md shadow-[#16A34A]/20"
                    : "glass-card text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:text-[#4ade80]"
                    }`}
                >
                  <Shield className="w-3 h-3" />
                  {activeClub || "Clubs"}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showClubDropdown ? "rotate-180" : ""}`} />
                </button>
                {showClubDropdown && (
                  <div className="absolute top-9 left-0 z-50 w-56 max-h-64 overflow-y-auto bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1 animate-float-in">
                    <button
                      onClick={() => { setActiveClub(null); setShowClubDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!activeClub ? "text-[#16A34A] bg-[#16A34A]/5" : "text-[#64748B] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                    >
                      All Clubs
                    </button>
                    {allClubs.map((club) => (
                      <button
                        key={club}
                        onClick={() => { setActiveClub(club); setShowClubDropdown(false); setActiveTag(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${activeClub === club ? "text-[#16A34A] bg-[#16A34A]/5" : "text-[#0F172A] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                      >
                        {club}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Players Dropdown - inline with pills */}
            {allPlayers.length > 0 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => { setShowPlayerDropdown(!showPlayerDropdown); setShowClubDropdown(false); }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${activePlayer
                    ? "gradient-accent text-white shadow-md shadow-[#16A34A]/20"
                    : "glass-card text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:text-[#4ade80]"
                    }`}
                >
                  <User className="w-3 h-3" />
                  {activePlayer || "Players"}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPlayerDropdown ? "rotate-180" : ""}`} />
                </button>
                {showPlayerDropdown && (
                  <div className="absolute top-9 left-0 z-50 w-56 max-h-64 overflow-y-auto bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1 animate-float-in">
                    <button
                      onClick={() => { setActivePlayer(null); setShowPlayerDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!activePlayer ? "text-[#16A34A] bg-[#16A34A]/5" : "text-[#64748B] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                    >
                      All Players
                    </button>
                    {allPlayers.map((player) => (
                      <button
                        key={player}
                        onClick={() => { setActivePlayer(player); setShowPlayerDropdown(false); setActiveTag(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${activePlayer === player ? "text-[#16A34A] bg-[#16A34A]/5" : "text-[#0F172A] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                      >
                        {player}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap ${activeTag === tag
                  ? "gradient-accent text-white shadow-md shadow-[#16A34A]/20"
                  : "glass-card text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:text-[#4ade80]"
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter indicator */}
        {(searchQuery || activeTag) && (
          <div className="flex items-center gap-2 mb-6 text-sm text-[#64748B] dark:text-gray-400 glass-card rounded-2xl px-4 py-3 animate-float-in">
            <span>
              {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} found
              {searchQuery && <> for "<span className="font-semibold text-[#0F172A] dark:text-white">{searchQuery}</span>"</>}
              {activeTag && <> in <span className="font-semibold text-[#16A34A]">{activeTag}</span></>}
            </span>
            <button
              onClick={() => { setSearchQuery(""); setActiveTag(null); }}
              className="text-xs text-[#16A34A] hover:underline font-bold ml-auto"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Hero Section: Main Story Only (when no filters) */}
        {mainStoryPost && (
          <section className="mb-10 animate-float-in">
            {/* Main Story — Full Width Big Card */}
            <div className="flex h-[380px] md:h-[480px] mb-4">
              <div className="w-full">
                <PostCard post={mainStoryPost} featured />
              </div>
            </div>
          </section>
        )}

        {/* Club Personalization Note */}
        {favoriteClub && !searchQuery && !activeTag && (
          <div className="flex items-center justify-between gap-2 mb-8 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#16A34A]/10 via-[#22c55e]/5 to-transparent border border-[#16A34A]/15 glow-green animate-float-in">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-[#16A34A]" />
              <span className="text-sm text-[#16A34A] font-bold font-outfit">Your Feed is tuned for {favoriteClub}</span>
            </div>
          </div>
        )}

        {/* This Week in Football */}
        {thisWeekPosts.length > 0 && !(searchQuery || activeTag) && (
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
        )}

        {/* The Daily Fix Section */}
        {dailyFeatures && !(searchQuery || activeTag) && (
          <section className="mb-14 animate-float-in">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 rounded-full bg-amber-500" />
                <h2 className="text-xl md:text-2xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  The Daily Fix
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[#94A3B8]">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Updated {new Date(dailyFeatures.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-full">
                <OnThisDayWidget data={dailyFeatures.onThisDay} />
              </div>
              <div className="h-full">
                <RumorMillWidget data={dailyFeatures.rumorMill} />
              </div>
              <div className="h-full">
                <ManagerPressureWidget data={dailyFeatures.managerPressure} />
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
                    {activeTag ? `Latest in ${activeTag}` : "Latest Articles"}
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
                  onClick={() => { setSearchQuery(""); setActiveTag(null); }}
                  className="px-6 py-2.5 gradient-accent text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[#16A34A]/25 transition-all duration-300"
                >
                  Clear Filters
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

            {/* Live Widgets wrapper */}
            <div className="sticky top-6 flex flex-col gap-6">

              {/* News Ticker */}
              <div className="animate-float-in">
                <NewsTicker />
              </div>

              {/* Reddit Social Feed */}
              <div className="animate-float-in">
                <SocialFeed />
              </div>

              {/* Social Wall */}
              {siteSettings.socialWallEnabled && (
                <SocialWall
                  title={siteSettings.socialWallTitle}
                  embedCode={siteSettings.socialWallEmbedCode}
                />
              )}

              {/* FPL Analyzer */}
              <div className="animate-float-in">
                <FPLAnalyzer />
              </div>

            </div>
          </aside>
        </div>
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/30 flex items-center justify-center hover:bg-[#15803d] transition-all duration-300 hover:shadow-xl hover:shadow-[#16A34A]/40 animate-float-in"
          title="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <Footer />
    </div>
  );
}
