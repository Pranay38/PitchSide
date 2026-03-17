import { useMemo, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, ArrowRight, Bookmark, Heart, Share2, Clock, Tag, UserRound } from "lucide-react";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { getPublishedPosts } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { ReadingProgress } from "../components/ReadingProgress";
import { CommentSection } from "../components/CommentSection";
import { PollWidget } from "../components/PollWidget";
import { ReactionUI } from "../components/ReactionUI";
import { toast } from "sonner";
import {
  isClubFollowed,
  isPlayerFollowed,
  isPostSaved,
  toggleFollowedClub,
  toggleFollowedPlayer,
  toggleSavedPost,
} from "../lib/libraryStorage";
import { topicPath } from "../lib/contentPaths";
import { scheduleEmbedHydration } from "../lib/embedHydration";

export function BlogPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { favoriteClub } = useClubPreference();
  const [saved, setSaved] = useState(false);
  const [followingClub, setFollowingClub] = useState(false);
  const [followingPlayer, setFollowingPlayer] = useState(false);
  const articleContentRef = useRef<HTMLDivElement | null>(null);

  // Read posts from storage
  const blogPosts = useMemo(() => getPublishedPosts(), []);

  const currentIndex = blogPosts.findIndex((post) => post.id === id);
  const post = blogPosts[currentIndex];

  useEffect(() => {
    if (!post) return;
    setSaved(isPostSaved(post.id));
    setFollowingClub(isClubFollowed(post.club));
    setFollowingPlayer(post.playerName ? isPlayerFollowed(post.playerName) : false);
  }, [post]);

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

  useEffect(() => {
    if (!post?.content) return;
    return scheduleEmbedHydration(articleContentRef.current);
  }, [post?.id, post?.content]);

  // Related posts: same club or overlapping tags, excluding current, sorted by positive reactions
  const relatedPosts = blogPosts
    .filter(
      (p) =>
        p.id !== post.id &&
        (p.club === post.club || p.tags.some((t) => post.tags.includes(t)))
    )
    .sort((a, b) => {
      const getScore = (p: typeof a) => (p.reactions?.fire || 0) * 2 + (p.reactions?.mindblown || 0) * 2 + (p.reactions?.target || 0) * 2 - (p.reactions?.thumbsdown || 0) - (p.reactions?.cold || 0);
      return getScore(b) - getScore(a);
    })
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
      case "reddit":
        window.open(
          `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
    }
  };

  const schemaMarkup = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "image": [
      post.coverImage
    ],
    "datePublished": new Date(post.date).toISOString(),
    "author": [{
      "@type": "Person",
      "name": "Pranay Agrawal",
      "url": "https://x.com/TouchlineDribbl"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "The Touchline Dribble",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pitchside.vercel.app/logo.png"
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
        type="article"
        schema={schemaMarkup}
        club={post.club}
        date={post.date}
      />
      <ReadingProgress />
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
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: post.tags[0] || post.club, href: topicPath(post.tags[0] || post.club) },
              { label: post.title }
            ]}
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.tags.map((tag) => (
              <Link
                to={topicPath(tag)}
                key={tag}
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${tag === post.club
                  ? "text-white bg-[#16A34A]"
                  : "text-[#64748B] dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                  }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </Link>
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

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              onClick={() => {
                const nextSaved = toggleSavedPost(post.id);
                setSaved(nextSaved);
                toast.success(nextSaved ? "Saved to your library" : "Removed from saved");
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${saved
                ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                : "border-gray-200 dark:border-gray-800 text-[#475569] dark:text-gray-300 hover:border-[#16A34A]/30 hover:text-[#16A34A]"
                }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-[#16A34A]" : ""}`} />
              {saved ? "Saved" : "Save Article"}
            </button>
            <button
              onClick={() => {
                const nextFollowing = toggleFollowedClub(post.club);
                setFollowingClub(nextFollowing);
                toast.success(nextFollowing ? `Following ${post.club}` : `Unfollowed ${post.club}`);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${followingClub
                ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                : "border-gray-200 dark:border-gray-800 text-[#475569] dark:text-gray-300 hover:border-[#16A34A]/30 hover:text-[#16A34A]"
                }`}
            >
              <Heart className={`w-4 h-4 ${followingClub ? "fill-[#16A34A]" : ""}`} />
              {followingClub ? `Following ${post.club}` : `Follow ${post.club}`}
            </button>
            <Link
              to="/saved"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#16A34A] hover:bg-[#16A34A]/5 transition-colors"
            >
              Open Saved
            </Link>
            {post.playerName && (
              <button
                onClick={() => {
                  const nextFollowing = toggleFollowedPlayer(post.playerName!);
                  setFollowingPlayer(nextFollowing);
                  toast.success(nextFollowing ? `Following ${post.playerName}` : `Unfollowed ${post.playerName}`);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${followingPlayer
                  ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                  : "border-gray-200 dark:border-gray-800 text-[#475569] dark:text-gray-300 hover:border-[#16A34A]/30 hover:text-[#16A34A]"
                  }`}
              >
                <UserRound className={`w-4 h-4 ${followingPlayer ? "text-[#16A34A]" : ""}`} />
                {followingPlayer ? `Following ${post.playerName}` : `Follow ${post.playerName}`}
              </button>
            )}
            <Link
              to="/alerts"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#16A34A] hover:bg-[#16A34A]/5 transition-colors"
            >
              Alert Center
            </Link>
          </div>

          {/* Article Body */}
          <div key={post.id} ref={articleContentRef}>
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
          </div>

          {/* Media Embed */}
          {post.mediaUrl && (
            <div className="mt-12 w-full mx-auto overflow-hidden rounded-2xl flex items-center justify-center p-0 sm:p-2 bg-transparent">
              {post.mediaUrl.includes('spotify.com') ? (
                <iframe
                  style={{ borderRadius: '12px', border: 'none' }}
                  src={post.mediaUrl.replace('open.spotify.com', 'open.spotify.com/embed')}
                  width="100%"
                  height="152"
                  allowFullScreen={false}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              ) : post.mediaUrl.includes('youtube.com') || post.mediaUrl.includes('youtu.be') ? (
                <div className="relative w-full pb-[56.25%] h-0 rounded-xl overflow-hidden shadow-md">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full border-none"
                    src={post.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[#16A34A] hover:underline flex items-center gap-2 py-4">
                  <Share2 className="w-5 h-5" />
                  Watch Media Link
                </a>
              )}
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-[#16A34A]/15 bg-gradient-to-r from-[#16A34A]/10 via-white to-white dark:from-[#16A34A]/15 dark:via-[#0F172A] dark:to-[#0F172A] p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">
              Newsletter
            </p>
            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">
              Get the week&apos;s best Touchline Dribble reads in one email
            </h3>
            <p className="text-sm text-[#64748B] dark:text-gray-400 mb-4">
              Subscribe in the footer for new analysis, club angles, and the Daily Fix without checking the site every day.
            </p>
            <button
              onClick={() => {
                document.querySelector("footer")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="px-4 py-2.5 gradient-accent text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[#16A34A]/25 transition-all duration-300"
            >
              Jump to subscribe
            </button>
          </div>

          {/* Poll Section */}
          {post.poll && (
            <PollWidget pollId={post.id} poll={post.poll} title="Reader Poll" />
          )}

          {/* Interactive Match Ratings */}
          

          <ReactionUI itemId={post.id} itemType="post" initialReactions={post.reactions} />

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
                onClick={() => handleShare("reddit")}
                className="px-5 py-2.5 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all duration-200 font-medium text-sm hover:shadow-lg hover:shadow-[#FF4500]/25"
              >
                Reddit
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="px-5 py-2.5 bg-[#0F172A] dark:bg-gray-700 text-white rounded-lg hover:bg-[#1E293B] dark:hover:bg-gray-600 transition-all duration-200 font-medium text-sm hover:shadow-lg"
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-12">
            <CommentSection postId={post.id} />
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
