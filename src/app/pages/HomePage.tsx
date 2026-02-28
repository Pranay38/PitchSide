import { useState, useMemo } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { ClubSelectionModal } from "../components/ClubSelectionModal";
import { getAllPosts } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { Inbox } from "lucide-react";

export function HomePage() {
  const { favoriteClub, isOnboarded, setFavoriteClub, skipOnboarding } = useClubPreference();
  const [showModal, setShowModal] = useState(!isOnboarded);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Read posts from storage (includes dynamically added posts)
  const blogPosts = useMemo(() => getAllPosts(), []);

  // Featured post (first post matching club, or general first post)
  const featuredPost = useMemo(() => {
    if (favoriteClub) {
      const clubPost = blogPosts.find((p) => p.club === favoriteClub || p.tags.includes(favoriteClub));
      return clubPost || blogPosts[0];
    }
    return blogPosts[0];
  }, [favoriteClub, blogPosts]);

  // Top stories for selected club (excluding featured)
  const topStories = useMemo(() => {
    if (!favoriteClub) return [];
    return blogPosts
      .filter((p) => (p.club === favoriteClub || p.tags.includes(favoriteClub)) && p.id !== featuredPost?.id)
      .slice(0, 3);
  }, [favoriteClub, featuredPost, blogPosts]);

  // All posts for pagination (excluding featured)
  const allPosts = useMemo(() => {
    return blogPosts.filter((p) => p.id !== featuredPost?.id);
  }, [featuredPost, blogPosts]);

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = allPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(allPosts.length / postsPerPage);

  const handleSelectClub = (club: string) => {
    setFavoriteClub(club);
    setShowModal(false);
    setCurrentPage(1);
  };

  const handleSkip = () => {
    skipOnboarding();
    setShowModal(false);
  };

  const handleChangeClub = () => {
    setShowModal(true);
  };

  if (!featuredPost) {
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
        {/* Featured Hero */}
        <section className="mb-12">
          <PostCard post={featuredPost} featured />
        </section>

        {/* Personalized Section */}
        {favoriteClub && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">
                Top Stories for{" "}
                <span className="text-[#16A34A]">{favoriteClub}</span>
              </h2>
            </div>

            {topStories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topStories.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800">
                <Inbox className="w-12 h-12 text-[#CBD5E1] dark:text-gray-600 mb-4" />
                <p className="text-[#64748B] dark:text-gray-400 text-center max-w-md">
                  No posts for <span className="font-semibold text-[#0F172A] dark:text-white">{favoriteClub}</span> yet.
                  Check out our latest articles below!
                </p>
              </div>
            )}
          </section>
        )}

        {/* Latest Posts Section */}
        <section>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6">
            Latest Posts
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
      </main>

      <Footer />
    </div>
  );
}
