import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "@/lib/router-compat";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Clock,
  Copy,
  Heart,
  List,
  Share2,
  Tag,
  UserRound,
  Shield,
} from "lucide-react";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { ReadingProgress } from "../components/ReadingProgress";
import { CommentSection } from "../components/CommentSection";
import { PollWidget } from "../components/PollWidget";
import { ReactionUI } from "../components/ReactionUI";
import { InlineNewsletterCard } from "../components/InlineNewsletterCard";
import { PageState } from "../components/PageState";
import { ArticleAudioPlayer } from "../components/ArticleAudioPlayer";
import {
  ArticleContentRenderer,
  getArticleContentModel,
} from "../components/ArticleContentRenderer";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import type { BlogPost } from "../data/posts";
import { toast } from "sonner";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { topicPath } from "../lib/contentPaths";
import { scheduleEmbedHydration } from "../lib/embedHydration";
import { useReadingTracker } from "../hooks/useReadingTracker";
import { RecommendedArticles } from "../components/RecommendedArticles";
import { useUser } from "@clerk/clerk-react";

function sortPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function BlogPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewToken = searchParams.get("preview");

  const [posts, setPosts] = useState<BlogPost[]>(() => sortPosts(getPublishedPosts()));
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(posts.length === 0 || !!previewToken);
  
  const { isPostSaved, isClubFollowed, isPlayerFollowed, toggleSavedPost, toggleFollowedClub, toggleFollowedPlayer, addReadPost } = useUserPreferences();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const currentIndex = posts.findIndex((post) => post.id === id);
  const post = previewPost || (currentIndex >= 0 ? posts[currentIndex] : null);
  const isPreview = !!previewPost;
  const previousPost = !isPreview && currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = !isPreview && currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;

  // Sync like state when post loads
  useEffect(() => {
    if (post && user) {
      setIsLiked(post.likedBy?.includes(user.id) || false);
    }
  }, [post?.id, post?.likedBy, user?.id]);

  const handleLike = async () => {
    if (!user || !post) return toast.error("Please sign in to like articles.");
    
    setIsLiked(!isLiked);
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: user.id })
      });
    } catch {
      setIsLiked(isLiked); // Revert
      toast.error("Failed to update like status.");
    }
  };

  const articleContentRef = useRef<HTMLDivElement | null>(null);

  // Fetch preview post by secret token
  useEffect(() => {
    if (!previewToken) return;
    let cancelled = false;
    fetch(`/api/posts?preview=${encodeURIComponent(previewToken)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) setPreviewPost(data);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [previewToken]);

  useEffect(() => {
    let isMounted = true;

    getPublishedPostsAsync()
      .then((nextPosts) => {
        if (!isMounted) return;
        setPosts(sortPosts(nextPosts));
        if (!previewToken) setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        if (!previewToken) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const articleContentModel = useMemo(
    () => (post ? getArticleContentModel(post.content) : null),
    [post],
  );
  const headings = articleContentModel?.headings || [];

  const saved = post ? isPostSaved(post.id) : false;
  const followingClub = post?.club ? isClubFollowed(post.club) : false;
  const followingPlayer = post?.playerName ? isPlayerFollowed(post.playerName) : false;

  useReadingTracker(post?.id);

  useEffect(() => {
    if (!post?.content) return;
    return scheduleEmbedHydration(articleContentRef.current);
  }, [post?.id, post?.content]);

  useEffect(() => {
    if (post?.id) {
      addReadPost(post.id);
    }
  }, [post?.id]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];

    return posts
      .filter((candidate) => (
        candidate.id !== post.id
        && (candidate.club === post.club || candidate.tags.some((tag) => post.tags.includes(tag)))
      ))
      .slice(0, 3);
  }, [post, posts]);

  const handleShare = (platform: "whatsapp" | "twitter" | "reddit" | "copy") => {
    if (!post) return;

    const url = window.location.href;
    const text = post.title;

    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
      return;
    }
    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
      return;
    }
    if (platform === "reddit") {
      window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, "_blank");
      return;
    }

    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  };

  if (loading && !post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] transition-colors duration-300 dark:bg-[#0B1120]">
        <Header />
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
          <div className="h-[340px] animate-pulse rounded-[2rem] bg-gray-200 dark:bg-gray-800" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] transition-colors duration-300 dark:bg-[#0B1120]">
        <Header />
        <main className="mx-auto w-full max-w-[900px] px-4 py-16 sm:px-6">
          <PageState
            icon={Bookmark}
            eyebrow="Article"
            title="Post not found"
            description="This article does not exist or has been removed from the published feed."
            action={(
              <Link
                to="/archive"
                className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white"
              >
                Open archive
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const schemaMarkup = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt || "",
    image: [post.coverImage],
    datePublished: new Date(post.date).toISOString(),
    dateModified: (post as any).updatedAt ? new Date((post as any).updatedAt).toISOString() : new Date(post.date).toISOString(),
    articleSection: post.club || "Football",
    wordCount: post.content?.split(/\s+/).length || 0,
    author: [{
      "@type": "Person",
      name: "Pranay Agrawal",
      url: "https://x.com/TouchlineDribbl",
    }],
    publisher: {
      "@type": "Organization",
      name: "The Touchline Dribble",
      logo: {
        "@type": "ImageObject",
        url: "https://pitchside.vercel.app/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://thetouchlinedribble.com/post/${post.slug || post.id}`,
    },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] transition-colors duration-300 dark:bg-[#0B1120]">
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
      <Header />

      {isPreview && (
        <div className="bg-amber-500 text-black py-2.5 px-4 text-center text-sm font-bold sticky top-0 z-50">
          📝 Draft Preview — This article is not published yet
        </div>
      )}

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.3),rgba(15,23,42,0.82))]" />
          </div>

          <div className="relative mx-auto flex min-h-[420px] w-full max-w-[1180px] items-end px-4 py-10 sm:px-6 md:min-h-[520px]">
            <div className="max-w-4xl">
              <Breadcrumbs
                items={[
                  { label: post.tags[0] || post.club, href: topicPath(post.tags[0] || post.club) },
                  { label: post.title },
                ]}
              />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {post.tags.map((tag) => (
                  <Link
                    to={topicPath(tag)}
                    key={tag}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      tag === post.club
                        ? "bg-[#16A34A] text-white"
                        : "bg-white/12 text-white backdrop-blur-sm"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Link>
                ))}
              </div>

              <h1 className="mt-6 text-4xl font-black font-outfit leading-[0.95] text-white md:text-6xl">
                {post.title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-white/78 md:text-xl">
                {post.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span>{post.date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-10 sm:px-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0">
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLike}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
                  isLiked
                    ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                    : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-[#16A34A]" : ""}`} />
                {isLiked ? "Liked" : "Like article"}
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextSaved = toggleSavedPost(post.id);
                  toast.success(nextSaved ? "Saved to your library" : "Removed from saved.");
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
                  saved
                    ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                    : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${saved ? "fill-[#16A34A]" : ""}`} />
                {saved ? "Saved" : "Save article"}
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextFollowing = toggleFollowedClub(post.club);
                  toast.success(nextFollowing ? `Following ${post.club}` : `Unfollowed ${post.club}`);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
                  followingClub
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500"
                    : "border-gray-200 text-[#475569] hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-500 dark:border-gray-800 dark:text-gray-300"
                }`}
              >
                <Shield className={`h-4 w-4 ${followingClub ? "fill-amber-500" : ""}`} />
                {followingClub ? `Following ${post.club}` : `Follow ${post.club}`}
              </button>

              {post.playerName && (
                <button
                  type="button"
                  onClick={() => {
                    const nextFollowing = toggleFollowedPlayer(post.playerName!);
                    toast.success(nextFollowing ? `Following ${post.playerName}` : `Unfollowed ${post.playerName}`);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
                    followingPlayer
                      ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                      : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
                  }`}
                >
                  <UserRound className="h-4 w-4" />
                  {followingPlayer ? `Following ${post.playerName}` : `Follow ${post.playerName}`}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleShare("copy")}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-bold text-[#475569] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
              >
                <Copy className="h-4 w-4" />
                Copy link
              </button>
            </div>

            {articleContentModel && (
              <ArticleAudioPlayer
                title={post.title}
                excerpt={post.excerpt}
                model={articleContentModel}
              />
            )}

            <div
              ref={articleContentRef}>
              {articleContentModel && (
                <ArticleContentRenderer model={articleContentModel} />
              )}
            </div>

            {post.mediaUrl && (
              <div className="mt-12 w-full overflow-hidden rounded-2xl">
                {post.mediaUrl.includes("spotify.com") ? (
                  <iframe
                    style={{ borderRadius: "12px", border: "none" }}
                    src={post.mediaUrl.replace("open.spotify.com", "open.spotify.com/embed")}
                    width="100%"
                    height="152"
                    allowFullScreen={false}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                ) : post.mediaUrl.includes("youtube.com") || post.mediaUrl.includes("youtu.be") ? (
                  <div className="relative h-0 w-full overflow-hidden rounded-xl pb-[56.25%] shadow-md">
                    <iframe
                      className="absolute left-0 top-0 h-full w-full border-none"
                      src={post.mediaUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={post.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#16A34A] hover:underline"
                  >
                    <Share2 className="h-5 w-5" />
                    Open media
                  </a>
                )}
              </div>
            )}

            <div className="mt-12">
              <InlineNewsletterCard
                title="Get the strongest Touchline Dribble reads in one email"
                description="Use the newsletter as the low-noise way to keep up with new analysis and longform pieces."
              />
            </div>

            {post.poll && (
              <PollWidget pollId={post.id} poll={post.poll} title="Reader Poll" />
            )}

            <ReactionUI itemId={post.id} itemType="post" initialReactions={post.reactions} />

            <RecommendedArticles
              articleId={post.id}
              limit={5}
              title="Readers also enjoyed"
              showSource={true}
            />

            <div className="my-12 border-t border-gray-200 dark:border-gray-800" />

            <div className="mb-12">
              <h2 className="mb-4 text-lg font-bold text-[#0F172A] dark:text-white">
                Share this article
              </h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => handleShare("whatsapp")} className="rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white">
                  WhatsApp
                </button>
                <button onClick={() => handleShare("twitter")} className="rounded-full bg-[#1DA1F2] px-5 py-2.5 text-sm font-bold text-white">
                  X
                </button>
                <button onClick={() => handleShare("reddit")} className="rounded-full bg-[#FF4500] px-5 py-2.5 text-sm font-bold text-white">
                  Reddit
                </button>
                <button onClick={() => handleShare("copy")} className="rounded-full bg-[#0F172A] px-5 py-2.5 text-sm font-bold text-white dark:bg-gray-700">
                  Copy link
                </button>
              </div>
            </div>

            <div className="mb-12">
              <CommentSection postId={post.id} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {previousPost ? (
                <button
                  type="button"
                  onClick={() => navigate(`/post/${previousPost.slug || previousPost.id}`)}
                  className="rounded-[1.75rem] border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-[#16A34A]/30 dark:border-gray-800 dark:bg-[#0F172A]"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[#16A34A]">
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </div>
                  <h3 className="mt-3 text-lg font-black font-outfit text-[#0F172A] dark:text-white">
                    {previousPost.title}
                  </h3>
                </button>
              ) : <div />}

              {nextPost ? (
                <button
                  type="button"
                  onClick={() => navigate(`/post/${nextPost.slug || nextPost.id}`)}
                  className="rounded-[1.75rem] border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-[#16A34A]/30 dark:border-gray-800 dark:bg-[#0F172A]"
                >
                  <div className="flex items-center justify-end gap-2 text-sm font-bold text-[#16A34A]">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-right text-lg font-black font-outfit text-[#0F172A] dark:text-white">
                    {nextPost.title}
                  </h3>
                </button>
              ) : <div />}
            </div>
          </article>

          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                  Share
                </p>
                <div className="mt-4 grid gap-3">
                  <button onClick={() => handleShare("whatsapp")} className="rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white">
                    WhatsApp
                  </button>
                  <button onClick={() => handleShare("copy")} className="rounded-full bg-[#16A34A] px-4 py-2.5 text-sm font-bold text-white">
                    Copy link
                  </button>
                  <button onClick={() => handleShare("twitter")} className="rounded-full border border-gray-200 px-4 py-2.5 text-sm font-bold text-[#0F172A] dark:border-gray-700 dark:text-white">
                    Share on X
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {relatedPosts.length > 0 && (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-16 sm:px-6">
            <div className="border-t border-gray-200 pt-12 dark:border-gray-800">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                    Keep Reading
                  </p>
                  <h2 className="mt-2 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">
                    Related articles
                  </h2>
                </div>
                <Link
                  to={`/archive?club=${encodeURIComponent(post.club)}`}
                  className="text-sm font-bold text-[#16A34A]"
                >
                  See more on {post.club}
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((item) => (
                  <PostCard key={item.id} post={item} />
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
