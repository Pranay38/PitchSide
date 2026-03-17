import { useMemo } from "react";
import { useParams } from "react-router";
import { Link } from "react-router";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { useClubPreference } from "../hooks/useClubPreference";
import { getPublishedPosts } from "../lib/postStorage";
import { deslugify, topicPath } from "../lib/contentPaths";

export function TopicPage() {
  const { slug = "" } = useParams();
  const { favoriteClub } = useClubPreference();
  const posts = useMemo(() => getPublishedPosts(), []);

  const normalized = slug.toLowerCase();
  const topicLabel = deslugify(slug);

  const matchingPosts = useMemo(() => {
    return posts.filter((post) => {
      const haystacks = [
        post.club,
        post.playerName || "",
        post.title,
        post.excerpt,
        ...post.tags,
      ].map((value) => value.toLowerCase());

      return haystacks.some((value) => value.includes(normalized.replace(/-/g, " ")));
    });
  }, [normalized, posts]);

  const relatedTopics = useMemo(() => {
    const counts = new Map<string, number>();
    matchingPosts.forEach((post) => {
      post.tags.forEach((tag) => {
        if (tag.toLowerCase() === topicLabel.toLowerCase()) return;
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [matchingPosts, topicLabel]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title={`${topicLabel} Coverage`}
        description={`Read every Touchline Dribble story tagged with ${topicLabel}.`}
      />
      <Header favoriteClub={favoriteClub} />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
        <section className="mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-3">
            Topic Page
          </p>
          <h1 className="text-3xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white">
            {topicLabel}
          </h1>
          <p className="text-base text-[#64748B] dark:text-gray-400 max-w-2xl mt-3">
            {matchingPosts.length} article{matchingPosts.length === 1 ? "" : "s"} connected to this topic.
          </p>
        </section>

        {relatedTopics.length > 0 && (
          <section className="mb-8">
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((topic) => (
                <Link
                  key={topic}
                  to={topicPath(topic)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 text-[#475569] dark:text-gray-300 hover:border-[#16A34A]/30 hover:text-[#16A34A] transition-colors"
                >
                  {topic}
                </Link>
              ))}
            </div>
          </section>
        )}

        {matchingPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {matchingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl glass-card p-10 text-center">
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">No articles here yet</h2>
            <p className="text-sm text-[#64748B] dark:text-gray-400">
              This topic page is ready, but there are no published posts tagged for it yet.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
