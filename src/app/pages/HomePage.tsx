import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { ClubSelectionModal } from "../components/ClubSelectionModal";
import { getAllPosts } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { Search, X, Filter, Sparkles, Trophy } from "lucide-react";
import { NewsTicker } from "../components/NewsTicker";
import { FPLAnalyzer } from "../components/FPLAnalyzer";


export function HomePage() {
  const { favoriteClub, isOnboarded, setFavoriteClub, skipOnboarding, clearPreference } = useClubPreference();
  const [showModal, setShowModal] = useState(!isOnboarded);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const postsPerPage = 6;
  const [visibleCount, setVisibleCount] = useState(postsPerPage);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Read posts from storage
  const blogPosts = useMemo(() => getAllPosts(), []);

  // Extract all unique tags across posts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    blogPosts.forEach((p) => p.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
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

    return posts;
  }, [sortedPosts, searchQuery, activeTag]);

  // Main Story: always the latest post (most recent by date)
  const mainStoryPost = useMemo(() => {
    if (searchQuery || activeTag) return null;
    if (blogPosts.length === 0) return null;
    // Sort all posts by date descending to find the absolute latest post
    const byDate = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return byDate[0] || null;
  }, [blogPosts, searchQuery, activeTag]);

  // Hero grid posts: 4 posts below the main story
  const heroGridPosts = useMemo(() => {
    if (searchQuery || activeTag) return [];
    const mainId = mainStoryPost?.id;
    return sortedPosts.filter((p) => p.id !== mainId).slice(0, 4);
  }, [sortedPosts, mainStoryPost, searchQuery, activeTag]);

  // Combined hero IDs for exclusion
  const heroPosts = useMemo(() => {
    const posts = mainStoryPost ? [mainStoryPost, ...heroGridPosts] : heroGridPosts;
    return posts;
  }, [mainStoryPost, heroGridPosts]);

  // This Week in Football (only show when not searching or filtering)
  const thisWeekPosts = useMemo(() => {
    if (searchQuery || activeTag) return [];
    const excludeIds = new Set(heroPosts.map((p) => p.id));
    return blogPosts.filter((p) => p.thisWeek && !excludeIds.has(p.id)).slice(0, 4);
  }, [blogPosts, heroPosts, searchQuery, activeTag]);

  // Must Read / Editor's Picks (only show when not searching or filtering)
  const mustReadPosts = useMemo(() => {
    if (searchQuery || activeTag) return [];
    const excludeIds = new Set([...heroPosts.map((p) => p.id), ...thisWeekPosts.map((p) => p.id)]);
    return blogPosts.filter((p) => p.mustRead && !excludeIds.has(p.id)).slice(0, 4);
  }, [blogPosts, heroPosts, thisWeekPosts, searchQuery, activeTag]);

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
  }, [searchQuery, activeTag, favoriteClub]);

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
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <button
              onClick={() => { setActiveTag(null); }}
              className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${!activeTag
                ? "gradient-accent text-white shadow-md shadow-[#16A34A]/20"
                : "glass-card text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:text-[#4ade80]"
                }`}
            >
              All
            </button>
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

        {/* Hero Section: Main Story + 2x2 Grid (Only when no filters) */}
        {mainStoryPost && (
          <section className="mb-10 animate-float-in">
            {/* Main Story — Full Width Big Card */}
            <div className="min-h-[320px] md:min-h-[420px] mb-4">
              <PostCard post={mainStoryPost} featured />
            </div>
            {/* 2x2 Grid below */}
            {heroGridPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {heroGridPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
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

        {/* Newspaper 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Content Column (Left, 65%) */}
          <div className="w-full lg:w-[65%] flex flex-col gap-10">

            {/* This Week in Football */}
            {thisWeekPosts.length > 0 && (
              <section className="animate-float-in">
                <div className="flex items-center gap-3 pb-3 mb-5">
                  <div className="w-1.5 h-8 rounded-full gradient-accent" />
                  <h2 className="text-xl md:text-2xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                    This Week
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {thisWeekPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Latest Posts List */}
            {currentPosts.length > 0 ? (
              <section className="animate-float-in">
                <div className="flex items-center gap-3 pb-3 mb-5">
                  <div className="w-1.5 h-8 rounded-full gradient-accent" />
                  <h2 className="text-xl md:text-2xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                    {activeTag ? `Latest in ${activeTag}` : "Latest News"}
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

              {/* FPL Analyzer */}
              <div className="animate-float-in">
                <FPLAnalyzer />
              </div>

            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
