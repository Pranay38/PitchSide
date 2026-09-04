"use client";
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
  Star,
} from "lucide-react";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";

import { CommentSection } from "../components/CommentSection";
import { PollWidget } from "../components/PollWidget";

import { SeriesNavigator } from "../components/SeriesNavigator";
import { PageState } from "../components/PageState";
import { ReadingProgressBar } from "../components/ReadingProgressBar";
import { QuickReactBar } from "../components/QuickReactBar";
import { ArticleEndCTA } from "../components/ArticleEndCTA";

import { TouchlineAudioPlayer } from "../components/TouchlineAudioPlayer";
import {
  ArticleContentRenderer,
} from "../components/ArticleContentRenderer";
import { getArticleContentModel } from "../lib/articleModel";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import type { BlogPost } from "../data/posts";
import { toast } from "sonner";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { topicPath } from "../lib/contentPaths";
import { scheduleEmbedHydration } from "../lib/embedHydration";
import { useReadingTracker } from "../hooks/useReadingTracker";
import { RecommendedArticles } from "../components/RecommendedArticles";
import { ArmchairRatingsPanel } from "../components/ArmchairRatingsPanel";
import { useUser } from "@clerk/nextjs";



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
  const [streakUpdated, setStreakUpdated] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  
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
  }, [post?.id, addReadPost]);

  // Reading streak tracker
  useEffect(() => {
    if (!post || streakUpdated || !bottomRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Reached the bottom of the article
          const today = new Date().toDateString();
          const lastRead = localStorage.getItem("pitchside_last_read_date");
          
          if (lastRead !== today) {
            const currentStreak = parseInt(localStorage.getItem("pitchside_read_streak") || "0", 10);
            localStorage.setItem("pitchside_read_streak", (currentStreak + 1).toString());
            localStorage.setItem("pitchside_last_read_date", today);
            toast.success(`Reading streak extended! You are on a ${currentStreak + 1} day streak. 🔥`, {
              icon: "🔥"
            });
          }
          setStreakUpdated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(bottomRef.current);

    return () => observer.disconnect();
  }, [post, streakUpdated]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];

    return posts
      .filter((candidate) => (
        candidate.id !== post.id
        && (candidate.club === post.club || candidate.tags.some((tag) => post.tags.includes(tag)))
      ))
      .slice(0, 3);
  }, [post, posts]);

  const seriesPosts = useMemo(() => {
    if (!post?.seriesName) return [];
    return posts
      .filter((candidate) => candidate.seriesName === post.seriesName)
      .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0) || new Date(a.date).getTime() - new Date(b.date).getTime());
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
        url: "https://www.thetouchlinedribble.in/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.thetouchlinedribble.in/post/${post.slug || post.id}`,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      xpath: [
        "//h1",
        "//p[contains(@class, 'lead')]",
        "//p[1]"
      ]
    }
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

      <Header />
      <ReadingProgressBar readTime={post.readTime} />

      {isPreview && (
        <div className="bg-amber-500 text-black py-2.5 px-4 text-center text-sm font-bold sticky top-0 z-50">
          📝 Draft Preview — This article is not published yet
        </div>
      )}

      <main>
        {/* ── Magazine Header ── */}
        <section className="pt-20 pb-10 w-full max-w-[760px] mx-auto px-4 sm:px-6">
          {/* Kicker: Category + Club */}
          <div className="flex items-center gap-3 mb-6">
            {post.category && (
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {post.category}
              </span>
            )}
            {post.category && <span className="text-border">|</span>}
            <Link to={topicPath(post.club)} className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              {post.club}
            </Link>
          </div>

          {/* Title */}
          <h1 className="animate-enter font-headline font-bold text-4xl md:text-5xl lg:text-[3.5rem] text-foreground leading-[1.05] mb-6 tracking-[-0.03em]">
            {post.title}
          </h1>

          {/* Excerpt / Standfirst */}
          <p className="animate-enter animate-enter-delay-1 text-xl text-muted-foreground leading-relaxed mb-8 font-newsreader italic">
            {post.excerpt}
          </p>

          {/* Byline bar */}
          <div className="animate-enter animate-enter-delay-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground border-t border-border pt-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#4ade80] flex items-center justify-center">
                <span className="text-xs font-bold text-white">P</span>
              </div>
              <div>
                <span className="font-bold text-foreground">Pranay Agrawal</span>
                <span className="text-muted-foreground"> · The Touchline Dribble</span>
              </div>
            </div>
            <span className="hidden sm:block">·</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {post.readTime}</span>
            <span>·</span>
            <time>{post.date}</time>
          </div>
        </section>

        {/* ── Featured Image (full-bleed) ── */}
        <section className="animate-enter animate-enter-delay-3 w-full max-w-[1100px] mx-auto px-4 sm:px-6 mb-14">
           <figure>
             <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden shadow-lg relative">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
             </div>
           </figure>
        </section>

        <section className="mx-auto w-full max-w-[720px] px-4 py-6 sm:px-6">
          <article className="min-w-0">
            {/* Compact floating action bar */}
            <div className="mb-10 flex items-center justify-between border-b border-border pb-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`p-2.5 rounded-full border transition-colors ${isLiked ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                  aria-label={isLiked ? "Liked" : "Like article"}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-primary" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => { const s = toggleSavedPost(post.id); toast.success(s ? "Saved" : "Removed"); }}
                  className={`p-2.5 rounded-full border transition-colors ${saved ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                  aria-label={saved ? "Saved" : "Save article"}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-primary" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleShare("copy")}
                  className="p-2.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  aria-label="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { const f = toggleFollowedClub(post.club); toast.success(f ? `Following ${post.club}` : `Unfollowed ${post.club}`); }}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-colors ${followingClub ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                >
                  <Shield className={`h-3.5 w-3.5 ${followingClub ? "fill-primary-foreground" : ""}`} />
                  {followingClub ? "Following" : post.club}
                </button>
                {post.playerName && (
                  <button
                    type="button"
                    onClick={() => { const f = toggleFollowedPlayer(post.playerName!); toast.success(f ? `Following ${post.playerName}` : `Unfollowed ${post.playerName}`); }}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-colors ${followingPlayer ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    {followingPlayer ? "Following" : post.playerName}
                  </button>
                )}
              </div>
            </div>

            {post.audioUrl && (
              <TouchlineAudioPlayer audioUrl={post.audioUrl} title={`${post.title} (Audio Breakdown)`} />
            )}



            <div
              ref={articleContentRef}>
              
              {post.seriesName && seriesPosts.length > 1 && (
                <SeriesNavigator currentPost={post} seriesPosts={seriesPosts} />
              )}
              
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

            {post.armchairRatings && post.armchairRatings.length > 0 && (
              <ArmchairRatingsPanel postId={post.id} ratings={post.armchairRatings} />
            )}

            <div className="mt-12" ref={bottomRef}>
              <ArticleEndCTA authorName="Pranay Agrawal" />
            </div>

            {post.poll && (
              <PollWidget pollId={post.id} poll={post.poll} title="Reader Poll" />
            )}





            <RecommendedArticles
              articleId={post.id}
              limit={5}
              title="Readers also enjoyed"
              showSource={true}
            />

            {/* ── Share Strip ── */}
            <div className="my-14 border-t border-border pt-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm font-bold text-foreground uppercase tracking-widest">Share this piece</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleShare("whatsapp")} className="p-2.5 rounded-full border border-border text-muted-foreground hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all" aria-label="Share on WhatsApp">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </button>
                  <button onClick={() => handleShare("twitter")} className="p-2.5 rounded-full border border-border text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all" aria-label="Share on X">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </button>
                  <button onClick={() => handleShare("reddit")} className="p-2.5 rounded-full border border-border text-muted-foreground hover:bg-[#FF4500] hover:text-white hover:border-[#FF4500] transition-all" aria-label="Share on Reddit">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                  </button>
                  <button onClick={() => handleShare("copy")} className="p-2.5 rounded-full border border-border text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all" aria-label="Copy link">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
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
        </section>

        <QuickReactBar postId={post.id} />

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
