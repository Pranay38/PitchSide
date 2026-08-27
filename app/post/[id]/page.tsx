import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPostByIdServer, getPublishedPostsServer } from "@/lib/server-data";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { Clock, Tag, BookOpen } from "lucide-react";
import Link from "next/link";
import { topicPath } from "@/app/lib/contentPaths";
import { 
  getArticleContentModel, 
  buildQuickSummary 
} from "@/app/lib/articleModel";
import { ArticleContentRenderer } from "@/app/components/ArticleContentRenderer";
import { ArticleAudioPlayer } from "@/app/components/ArticleAudioPlayer";
import { InlineNewsletterCard } from "@/app/components/InlineNewsletterCard";
import { RecommendedArticles } from "@/app/components/RecommendedArticles";
import { SupportBanner } from "@/app/components/SupportBanner";
import { ShareBar } from "@/app/components/ShareBar";
import { PostActionsClient } from "./PostActionsClient";
import { PostTrackersClient } from "./PostTrackersClient";
import { PostEmbedHydrationClient } from "./PostEmbedHydrationClient";
import { AdaptiveArticleHeader } from "@/app/components/AdaptiveArticleHeader";
import { MilestoneScrubber } from "@/app/components/MilestoneScrubber";
import { HotTakeHeatIndex } from "@/app/components/HotTakeHeatIndex";
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const posts = await getPublishedPostsServer();
  return posts.map((post: any) => ({
    id: post.slug || post.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostByIdServer(id);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const ogImageUrl = `https://www.thetouchlinedribble.in/api/og?title=${encodeURIComponent(post.title)}${post.club ? `&club=${encodeURIComponent(post.club)}` : ""}${post.date ? `&date=${encodeURIComponent(post.date)}` : ""}`;

  return {
    title: post.title,
    description: post.excerpt || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      url: `https://www.thetouchlinedribble.in/post/${post.slug || post.id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      siteName: "The Touchline Dribble",
      publishedTime: post.publishAt || post.date ? new Date(post.publishAt || post.date).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      ...(post.author ? { authors: [post.author] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: [ogImageUrl],
      site: "@TouchlineDribbl",
      creator: "@TouchlineDribbl",
    },
    alternates: {
      canonical: `https://www.thetouchlinedribble.in/post/${post.slug || post.id}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  
  // 1. Quick lookup for redirect check FIRST (before expensive allPosts fetch)
  const post = await getPostByIdServer(id);

  if (!post) {
    notFound();
  }

  // 2. Redirect to canonical slug if accessed via numeric ID  
  if (post.slug && id !== post.slug) {
    permanentRedirect(`/post/${post.slug}`);
  }

  // 3. Only fetch supplementary data after redirect check passes
  const allPosts = await getPublishedPostsServer();



  // 3. Prepare content models
  const articleContentModel = post.content ? getArticleContentModel(post.content) : null;

  const isMedical = post.tags?.some((t: string) => t.toLowerCase() === "injury" || t.toLowerCase() === "medical");

  // JSON-LD structured data for the article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    ...(isMedical && { additionalType: "MedicalWebPage" }),
    headline: post.title,
    description: post.excerpt || "",
    image: [post.coverImage],
    datePublished: post.publishAt || post.date
      ? new Date(post.publishAt || post.date).toISOString()
      : undefined,
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : post.publishAt || post.date
        ? new Date(post.publishAt || post.date).toISOString()
        : undefined,
    articleSection: post.club || "Football",
    wordCount: post.content?.split(/\s+/).length || 0,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["article h1", "article .quick-summary", "article h2", "article h2 + p"],
    },
    ...(post.author ? {
      author: [
        {
          "@type": "Person",
          name: post.author,
          url: "https://www.thetouchlinedribble.in/about",
          sameAs: ["https://x.com/TouchlineDribbl", "https://www.instagram.com/thetouchlinedribble/"],
        },
      ]
    } : {
      author: [
        {
          "@type": "Person",
          name: "Pranay Agrawal",
          url: "https://www.thetouchlinedribble.in/about",
          sameAs: ["https://x.com/TouchlineDribbl", "https://www.instagram.com/thetouchlinedribble/"],
        },
      ]
    }),
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
  };

  // BreadcrumbList JSON-LD for rich SERP breadcrumbs
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.thetouchlinedribble.in" },
      ...(post.tags?.[0] || post.club ? [{
        "@type": "ListItem",
        position: 2,
        name: post.tags?.[0] || post.club,
        item: `https://www.thetouchlinedribble.in/topic/${encodeURIComponent((post.tags?.[0] || post.club || "").toLowerCase().replace(/\s+/g, "-"))}`,
      }] : []),
      { "@type": "ListItem", position: post.tags?.[0] || post.club ? 3 : 2, name: post.title },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] transition-colors duration-300 dark:bg-[#0B1120]">
      {/* Invisible trackers for reading history and saving progress */}
      <PostTrackersClient postId={post.id} />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <Header />
      <AdaptiveArticleHeader title={post.title} />

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
                {post.tags.map((tag: string) => (
                  <Link
                    href={topicPath(tag)}
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
                <Link href="/about" className="flex items-center gap-2 hover:text-white transition-colors">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#16A34A] to-[#4ade80] flex items-center justify-center">
                    <span className="text-xs font-bold text-white">P</span>
                  </div>
                  <span className="font-semibold text-white/90">{post.author || "Pranay Agrawal"}</span>
                </Link>
                <span className="text-white/40">•</span>
                <span>{post.date}</span>
                {post.updatedAt && new Date(post.updatedAt).toDateString() !== new Date(post.date).toDateString() && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-[#4ade80]/80">Updated {new Date(post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>

              <div className="mt-4">
                <ShareBar
                  title={post.title}
                  url={`https://www.thetouchlinedribble.in/post/${post.slug || post.id}`}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1300px] gap-8 px-4 py-10 sm:px-6 xl:grid-cols-[200px_minmax(0,1fr)_280px]">
          <aside className="w-full hidden xl:block relative">
            <MilestoneScrubber />
          </aside>
          
          <article className="min-w-0 xl:px-4">
            {/* Interactive actions block (Like, Bookmark, Follow) */}
            <PostActionsClient 
              post={{
                id: post.id,
                title: post.title,
                club: post.club,
                playerName: post.playerName,
                likedBy: post.likedBy || []
              }} 
            />

            {articleContentModel && (
              <ArticleAudioPlayer
                title={post.title}
                excerpt={post.excerpt}
                model={articleContentModel}
              />
            )}

            {/* Magazine kicker — section label */}
            <div className="article-kicker">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{post.tags?.[0] || post.club || "Analysis"}</span>
              <span className="text-[#94A3B8] dark:text-gray-600 font-normal">·</span>
              <span className="text-[#64748B] dark:text-gray-500 font-semibold normal-case tracking-normal text-[0.72rem]">{post.readTime}</span>
            </div>

            {/* Magazine content wrapper with left accent line */}
            <div className="article-magazine-wrapper pl-0 xl:pl-5">
              {/* Content Renderer (Renders static HTML for crawlers, hydrating glossary on mount) */}
              <PostEmbedHydrationClient>
                {articleContentModel && (
                   <ArticleContentRenderer model={articleContentModel} />
                )}
              </PostEmbedHydrationClient>
            </div>

            {/* Hot Take Heat Index — interactive polls from the editor */}
            {post.hotTakes && post.hotTakes.length > 0 && (
              <div className="mt-10 space-y-6">
                {post.hotTakes.map((take: { id: string; statement: string }) => (
                  <HotTakeHeatIndex
                    key={take.id}
                    postId={post.id}
                    takeId={take.id}
                    statement={take.statement}
                  />
                ))}
              </div>
            )}

            {/* Article end flourish */}
            <div className="article-end-mark">⬥ End ⬥</div>

            {/* Magazine tags strip */}
            {post.tags && post.tags.length > 0 && (
              <div className="article-tags-strip">
                {post.tags.map((tag: string) => (
                  <Link key={tag} href={topicPath(tag)}>
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Author card — magazine byline */}
            <div className="author-card-magazine">
              <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-[#16A34A] to-[#4ade80] flex items-center justify-center shadow-lg shadow-[#16A34A]/20">
                <span className="text-lg font-black text-white font-outfit">P</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#16A34A] dark:text-[#4ade80] mb-1">Written By</div>
                <Link href="/about" className="text-base font-bold text-[#0F172A] dark:text-white hover:text-[#16A34A] dark:hover:text-[#4ade80] transition-colors font-outfit">
                  {post.author || "Pranay Agrawal"}
                </Link>
                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1 leading-relaxed">
                  Tactical breakdowns your pundit missed. Bold opinions backed by data, not vibes.
                </p>
              </div>
            </div>

            <div className="mt-10">
              <InlineNewsletterCard
                title="Get the strongest Touchline Dribble reads in one email"
                description="Use the newsletter as the low-noise way to keep up with new analysis and longform pieces."
              />
            </div>
          </article>
          
          <aside className="w-full xl:w-[280px] hidden xl:block space-y-8">
            <RecommendedArticles articleId={post.id} />
            <SupportBanner variant="compact" />
          </aside>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
