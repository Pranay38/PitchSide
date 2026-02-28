import { useState, useMemo } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { ClubSelectionModal } from "../components/ClubSelectionModal";
import { getAllPosts } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { Search, X, Filter } from "lucide-react";

export function HomePage() {
  const { favoriteClub, isOnboarded, setFavoriteClub, skipOnboarding, clearPreference } = useClubPreference();
  const [showModal, setShowModal] = useState(!isOnboarded);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const postsPerPage = 6;

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

  // Featured post (first in filtered list)
  const featuredPost = filteredPosts[0] || null;

  // This Week in Football (only show when not searching or filtering)
  const thisWeekPosts = useMemo(() => {
    if (searchQuery || activeTag) return [];
    return blogPosts.filter((p) => p.thisWeek && p.id !== featuredPost?.id).slice(0, 21);
  }, [blogPosts, featuredPost, searchQuery, activeTag]);

  // Remaining posts for grid (excluding featured and this week)
  const remainingPosts = useMemo(() => {
    const excludeIds = new Set([featuredPost?.id, ...thisWeekPosts.map(p => p.id)]);
    return filteredPosts.filter((p) => p.id && !excludeIds.has(p.id));
  }, [filteredPosts, featuredPost, thisWeekPosts]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = remainingPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(remainingPosts.length / postsPerPage);

  const handleSelectClub = (club: string) => {
    setFavoriteClub(club);
    setShowModal(false);
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (blogPosts.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
        <Header onChangeClub={handleChangeClub} favoriteClub={favoriteClub} />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">No posts yet</h2>
          <p className="text-sm text-[#64748B] dark:text-gray-400">Check back soon for fresh football content!</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <Header onChangeClub={handleChangeClub} favoriteClub={favoriteClub} />

      <ClubSelectionModal
        isOpen={showModal}
        onSelectClub={handleSelectClub}
        onSkip={handleSkip}
      />

      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {/* Search + Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search posts, clubs, tags..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category / Tag Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <Filter className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
            <button
              onClick={() => { setActiveTag(null); setCurrentPage(1); }}
              className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${!activeTag
                ? "bg-[#16A34A] text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${activeTag === tag
                  ? "bg-[#16A34A] text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Active filter indicator */}
        {(searchQuery || activeTag) && (
          <div className="flex items-center gap-2 mb-6 text-sm text-[#64748B] dark:text-gray-400">
            <span>
              {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} found
              {searchQuery && <> for "<span className="font-medium text-[#0F172A] dark:text-white">{searchQuery}</span>"</>}
              {activeTag && <> in <span className="font-medium text-[#16A34A]">{activeTag}</span></>}
            </span>
            <button
              onClick={() => { setSearchQuery(""); setActiveTag(null); setCurrentPage(1); }}
              className="text-xs text-[#16A34A] hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Featured Hero */}
        {featuredPost && (
          <section className="mb-12">
            <PostCard post={featuredPost} featured />
          </section>
        )}

        {/* Club Personalization Note */}
        {favoriteClub && !searchQuery && !activeTag && (
          <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-[#16A34A]/5 border border-[#16A34A]/10">
            <span className="text-sm text-[#16A34A] font-medium">⚡ {favoriteClub} posts shown first</span>
          </div>
        )}

        {/* This Week in Football */}
        {thisWeekPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">🔥</span> This Week in Football
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {thisWeekPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Posts Grid */}
        {currentPosts.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6">
              {activeTag ? activeTag : "Latest Posts"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Previous
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] h-[40px] rounded-lg transition-all text-sm font-medium ${currentPage === page
                        ? "bg-[#16A34A] text-white shadow-md shadow-[#16A34A]/25"
                        : "border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">No posts found</h3>
            <p className="text-sm text-[#64748B] dark:text-gray-400 text-center max-w-sm">
              Try a different search term or clear your filters to see all posts.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setActiveTag(null); }}
              className="mt-4 px-4 py-2 bg-[#16A34A] text-white text-sm font-medium rounded-lg hover:bg-[#15803d] transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
