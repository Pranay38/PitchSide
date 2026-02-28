import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Share2, Clock, Tag } from "lucide-react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { getAllPosts } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { toast } from "sonner";

export function BlogPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { favoriteClub } = useClubPreference();

  // Read posts from storage
  const blogPosts = useMemo(() => getAllPosts(), []);

  const currentIndex = blogPosts.findIndex((post) => post.id === id);
  const post = blogPosts[currentIndex];

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-4">
            Post not found
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-[#16A34A] hover:underline font-medium"
          >
            Return to homepage
          </button>
        </div>
      </div>
    );
  }

  const previousPost =
    currentIndex > 0 ? blogPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < blogPosts.length - 1 ? blogPosts[currentIndex + 1] : null;

  // Related posts: same club or overlapping tags, excluding current
  const relatedPosts = blogPosts
    .filter(
      (p) =>
        p.id !== post.id &&
        (p.club === post.club || p.tags.some((t) => post.tags.includes(t)))
    )
    .slice(0, 3);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = post.title;

    switch (platform) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <Header favoriteClub={favoriteClub} />

      <main>
        {/* Cover Image */}
        <div className="w-full h-[400px] md:h-[500px] overflow-hidden relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Article Content */}
        <article className="max-w-[720px] mx-auto px-6 py-12">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${tag === post.club
                  ? "text-white bg-[#16A34A]"
                  : "text-[#64748B] dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                  }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>

          {/* Title and Meta */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-[#64748B] dark:text-gray-400">
            <span>{post.date}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>

          {/* Article Body */}
          {post.content.trim().startsWith("<") ? (
            /* HTML content from rich text editor */
            <div
              className="pitchside-article-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            /* Legacy plain-text content */
            <div className="pitchside-article-content">
              {post.content.split("\n\n").map((paragraph, index) => {
                if (paragraph.startsWith("## "))
                  return <h2 key={index}>{paragraph.replace("## ", "")}</h2>;
                if (paragraph.startsWith("### "))
                  return <h3 key={index}>{paragraph.replace("### ", "")}</h3>;
                if (paragraph.startsWith("> "))
                  return <blockquote key={index}>{paragraph.replace("> ", "").replace(/"/g, "")}</blockquote>;
                return <p key={index}>{paragraph}</p>;
              })}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800 my-12" />

          {/* Share Section */}
          <div className="mb-12">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share this article
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleShare("whatsapp")}
                className="px-5 py-2.5 bg-[#25D366] text-white rounded-lg hover:bg-[#20BD5A] transition-all duration-200 font-medium text-sm hover:shadow-lg hover:shadow-[#25D366]/25"
              >
                WhatsApp
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="px-5 py-2.5 bg-[#1DA1F2] text-white rounded-lg hover:bg-[#1A91DA] transition-all duration-200 font-medium text-sm hover:shadow-lg hover:shadow-[#1DA1F2]/25"
              >
                X (Twitter)
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="px-5 py-2.5 bg-[#0F172A] dark:bg-gray-700 text-white rounded-lg hover:bg-[#1E293B] dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm hover:shadow-lg"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-12">
            {previousPost ? (
              <button
                onClick={() => navigate(`/post/${previousPost.id}`)}
                className="flex items-center gap-2 text-[#16A34A] hover:underline group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium text-sm">Previous Post</span>
              </button>
            ) : (
              <div />
            )}

            {nextPost ? (
              <button
                onClick={() => navigate(`/post/${nextPost.id}`)}
                className="flex items-center gap-2 text-[#16A34A] hover:underline sm:ml-auto group"
              >
                <span className="font-medium text-sm">Next Post</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-[1100px] mx-auto px-6 pb-16">
            <div className="border-t border-gray-200 dark:border-gray-800 pt-12">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-6">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
