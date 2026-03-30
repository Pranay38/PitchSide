import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { Bookmark, Heart } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { getPublishedPosts } from "../lib/postStorage";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useClubPreference } from "../hooks/useClubPreference";
import { topicPath } from "../lib/contentPaths";

export function SavedPage() {
  const { favoriteClub } = useClubPreference();
  const allPosts = useMemo(() => getPublishedPosts(), []);
  
  const { savedPosts: savedPostIds, followedClubs, loading } = useUserPreferences();

  const savedPosts = useMemo(() => {
    return allPosts.filter((post) => savedPostIds.includes(post.id));
  }, [allPosts, savedPostIds]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO title="Saved" description="Your saved reads and followed clubs." />
      <Header favoriteClub={favoriteClub} />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        <section className="mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-3">
            Personal Library
          </p>
          <h1 className="text-3xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white">
            Saved & Followed
          </h1>
          <p className="text-base text-[#64748B] dark:text-gray-400 mt-3 max-w-2xl">
            A lightweight account-free way to keep track of the articles and clubs you care about.
          </p>
        </section>

        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-4 h-4 text-[#16A34A]" />
            <h2 className="text-lg font-black font-outfit uppercase tracking-tight text-[#0F172A] dark:text-white">
              Followed Clubs
            </h2>
          </div>
          {followedClubs.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {followedClubs.map((club) => (
                <Link
                  key={club}
                  to={topicPath(club)}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 text-[#16A34A] hover:border-[#16A34A]/30 transition-colors"
                >
                  {club}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748B] dark:text-gray-400">No clubs followed yet.</p>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="w-4 h-4 text-[#16A34A]" />
            <h2 className="text-lg font-black font-outfit uppercase tracking-tight text-[#0F172A] dark:text-white">
              Saved Reads
            </h2>
          </div>
          {savedPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748B] dark:text-gray-400">No saved posts yet.</p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
