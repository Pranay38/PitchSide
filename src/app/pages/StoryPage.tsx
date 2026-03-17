import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, Quote, Sparkles, BookOpen } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ReadingProgress } from "../components/ReadingProgress";
import type { StoryChapter, StoryFeature } from "../data/stories";
import {
  getStoryBySlug,
  getStoryBySlugAsync,
  getStoryPreview,
  getAllStories,
} from "../lib/storyStorage";
import { PostCard } from "../components/PostCard";
import { ReactionUI } from "../components/ReactionUI";

function StoryVisual({ story, chapter }: { story: StoryFeature; chapter: StoryChapter }) {
  return (
    <div
      className="rounded-[2rem] overflow-hidden text-white border border-white/10 shadow-2xl shadow-[#0F172A]/30"
      style={{ background: `linear-gradient(150deg, ${story.themeFrom}, ${story.themeTo})` }}
    >
      <div className="p-6 md:p-7">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70 mb-3">
          {chapter.visual.eyebrow}
        </p>
        <h3 className="text-3xl md:text-4xl font-black font-outfit leading-[0.95] max-w-md">
          {chapter.visual.headline}
        </h3>
        <p className="text-sm md:text-base text-white/72 mt-4 max-w-md">
          {chapter.visual.subheadline}
        </p>

        <div className="mt-8 rounded-[1.5rem] bg-black/20 border border-white/10 p-5">
          <p className="text-5xl font-black font-outfit">{chapter.visual.primaryValue}</p>
          <p className="text-sm font-semibold text-white/70 mt-1">{chapter.visual.primaryLabel}</p>
        </div>

        <div className="mt-6 space-y-4">
          {chapter.visual.bars.map((bar) => (
            <div key={bar.label}>
              <div className="flex items-center justify-between text-xs font-semibold text-white/85 mb-1.5">
                <span>{bar.label}</span>
                <span>{bar.value}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full bg-white" style={{ width: `${bar.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoryPage() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get("preview") === "1";
  const previewId = searchParams.get("storyId") || "";
  const initialPreviewStory = isPreviewMode ? getStoryPreview(previewId, slug) : undefined;
  const [story, setStory] = useState<StoryFeature | undefined>(() => (
    initialPreviewStory || getStoryBySlug(slug, isPreviewMode)
  ));
  const [activeChapterId, setActiveChapterId] = useState(story?.chapters[0]?.id || "");
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});
  
  // Calculate reading time based on total words (approx 200 words per minute)
  const readingTime = story 
    ? Math.max(1, Math.ceil(story.chapters.reduce((total, ch) => total + ch.body.join(" ").split(" ").length, 0) / 200))
    : 0;
    
  // Fetch related stories (exclude current)
  const relatedStories = story 
    ? getAllStories()
        .filter(s => s.id !== story.id)
        .sort((a, b) => {
          const getScore = (p: typeof a) => (p.reactions?.fire || 0) * 2 + (p.reactions?.mindblown || 0) * 2 + (p.reactions?.target || 0) * 2 - (p.reactions?.thumbsdown || 0) - (p.reactions?.cold || 0);
          return getScore(b) - getScore(a);
        })
        .slice(0, 3) 
    : [];

  useEffect(() => {
    const localPreviewStory = isPreviewMode ? getStoryPreview(previewId, slug) : undefined;
    if (localPreviewStory) {
      setStory(localPreviewStory);
      return;
    }

    setStory(getStoryBySlug(slug, isPreviewMode));

    let isMounted = true;
    getStoryBySlugAsync(slug, isPreviewMode)
      .then((nextStory) => {
        if (isMounted && nextStory) {
          setStory(nextStory);
        }
      })
      .catch(() => {
        // Keep local snapshot if API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, [slug, isPreviewMode, previewId]);

  useEffect(() => {
    if (!story) return;

    setActiveChapterId(story.chapters[0]?.id || "");

    const sections = story.chapters
      .map((chapter) => chapterRefs.current[chapter.id])
      .filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        const topEntry = visibleEntries[0];
        if (topEntry) {
          setActiveChapterId(topEntry.target.getAttribute("data-chapter-id") || story.chapters[0].id);
        }
      },
      {
        threshold: [0.3, 0.55, 0.8],
        rootMargin: "-10% 0px -25% 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [story]);

  if (!story) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
        <Header />
        <main className="max-w-[760px] mx-auto px-4 sm:px-6 py-24">
          <div className="rounded-[2rem] bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 p-10 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-3">Stories</p>
            <h1 className="text-3xl font-black font-outfit text-[#0F172A] dark:text-white mb-3">
              Story not found
            </h1>
            <p className="text-[#64748B] dark:text-gray-400 mb-6">
              This scrollytelling piece does not exist or has not been published yet.
            </p>
            <Link
              to="/stories"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#16A34A] text-white font-bold"
            >
              Back to stories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const activeChapter = story.chapters.find((chapter) => chapter.id === activeChapterId) || story.chapters[0];

  const storySchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": story.title,
    "description": story.excerpt,
    "image": [story.coverImage],
    "datePublished": new Date(story.date).toISOString(),
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
        "url": "https://pitchside-orcin.vercel.app/logo.png"
      }
    }
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title={isPreviewMode ? `${story.title} Preview` : story.title}
        description={story.excerpt}
        image={story.coverImage}
        url={`https://pitchside-orcin.vercel.app/stories/${story.slug}`}
        type="article"
        date={story.date}
        schema={storySchema}
      />
      <ReadingProgress />
      <Header />

      <main>
        <section
          className="relative overflow-hidden text-white"
          style={{ background: `linear-gradient(145deg, ${story.themeFrom}, ${story.themeTo})` }}
        >
          <div className="absolute inset-0 opacity-25">
            <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_40%),linear-gradient(to_bottom,rgba(15,23,42,0.18),rgba(15,23,42,0.78))]" />

          <div className="relative max-w-[1180px] mx-auto px-4 sm:px-6 py-12 md:py-16 lg:py-20">
            <Link
              to="/stories"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-white/80 hover:text-white mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to stories
            </Link>

            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-3 mb-5">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#bbf7d0]">
                  {story.eyebrow}
                </p>
                {isPreviewMode && (
                  <span className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-amber-400/15 text-amber-100 border border-white/10">
                    Preview
                  </span>
                )}
                {story.isDraft && (
                  <span className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-white/10 text-white border border-white/10">
                    Draft
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-black font-outfit leading-[0.92]">
                {story.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/82 font-semibold mt-4 max-w-3xl">
                {story.subtitle}
              </p>
              <p className="text-base md:text-lg text-white/72 mt-6 max-w-3xl">
                {story.excerpt}
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  <BookOpen className="w-4 h-4 text-[#16A34A]" /> {readingTime} min read
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  {story.date}
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  {story.chapters.length} chapters
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1180px] mx-auto px-4 sm:px-6 py-10 md:py-12">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_420px] gap-8 xl:gap-10">
            <div className="space-y-8">
              {story.chapters.map((chapter, index) => (
                <section
                  key={chapter.id}
                  ref={(node) => {
                    chapterRefs.current[chapter.id] = node;
                  }}
                  data-chapter-id={chapter.id}
                  className="min-h-[72vh] flex items-center"
                >
                  <div className="w-full rounded-[2rem] bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 p-6 md:p-8 lg:p-10 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">
                          {chapter.kicker}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-black font-outfit text-[#0F172A] dark:text-white leading-[0.97]">
                          {chapter.title}
                        </h2>
                      </div>
                      <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-xs font-bold text-[#475569] dark:text-gray-300">
                        <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                        {index + 1} / {story.chapters.length}
                      </div>
                    </div>

                    <div className="xl:hidden mb-6">
                      <StoryVisual story={story} chapter={chapter} />
                    </div>

                    <div className="space-y-4">
                      {chapter.body.length === 1 && chapter.body[0].trim().startsWith("<") ? (
                        <div
                          className="pitchside-article-content text-base md:text-lg leading-8 text-[#334155] dark:text-gray-200"
                          dangerouslySetInnerHTML={{ __html: chapter.body[0] }}
                        />
                      ) : (
                        chapter.body.map((paragraph) => (
                          <p
                            key={paragraph.slice(0, 32)}
                            className="text-base md:text-lg leading-8 text-[#334155] dark:text-gray-200"
                          >
                            {paragraph}
                          </p>
                        ))
                      )}
                    </div>

                    {chapter.image?.src && (
                      <figure className="mt-8 rounded-[1.5rem] overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5">
                        <img
                          src={chapter.image.src}
                          alt={chapter.image.alt || chapter.title}
                          className="w-full max-h-[520px] object-cover"
                        />
                        {chapter.image.caption && (
                          <figcaption className="px-5 py-4 text-sm text-[#64748B] dark:text-gray-400">
                            {chapter.image.caption}
                          </figcaption>
                        )}
                      </figure>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
                      {chapter.metrics.map((metric) => (
                        <div
                          key={metric.label}
                          className="rounded-[1.25rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-4"
                        >
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">
                            {metric.label}
                          </p>
                          <p className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white mt-2">
                            {metric.value}
                          </p>
                          {metric.hint && (
                            <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2">
                              {metric.hint}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {chapter.pullQuote && (
                      <div className="mt-8 rounded-[1.5rem] border border-[#16A34A]/15 bg-[#16A34A]/5 p-5 md:p-6">
                        <div className="flex items-start gap-3">
                          <Quote className="w-5 h-5 text-[#16A34A] shrink-0 mt-1" />
                          <p className="text-lg md:text-xl font-semibold text-[#0F172A] dark:text-white leading-8">
                            {chapter.pullQuote}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-8 rounded-[1.5rem] bg-[#0F172A] text-white p-5 md:p-6">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#4ade80] mb-2">
                        What this chapter means
                      </p>
                      <p className="text-base md:text-lg text-white/86 leading-8">
                        {chapter.takeaway}
                      </p>
                    </div>
                  </div>
                </section>
              ))}

              <ReactionUI itemId={story.id} itemType="story" initialReactions={story.reactions} />
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-24 space-y-5">
                <StoryVisual story={story} chapter={activeChapter} />

                <div className="rounded-[1.75rem] bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-4">
                    Chapter Map
                  </p>
                  <div className="space-y-2">
                    {story.chapters.map((chapter, index) => {
                      const isActive = chapter.id === activeChapter.id;
                      return (
                        <button
                          key={chapter.id}
                          onClick={() => chapterRefs.current[chapter.id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                          className={`w-full text-left rounded-2xl px-4 py-3 transition-all duration-300 ${
                            isActive
                              ? "bg-[#16A34A]/10 border border-[#16A34A]/20"
                              : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8] mb-1">
                            Chapter {index + 1}
                          </p>
                          <p className={`text-sm font-bold ${isActive ? "text-[#16A34A]" : "text-[#0F172A] dark:text-white"}`}>
                            {chapter.title}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
        
        {/* Related Stories Section */}
        {relatedStories.length > 0 && (
          <section className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B1120] py-16">
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 rounded-full gradient-accent" />
                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-[#0F172A] dark:text-white">
                  Keep Reading
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedStories.map(related => (
                  <PostCard key={related.id} post={{
                    id: related.id,
                    title: related.title,
                    excerpt: related.excerpt,
                    coverImage: related.coverImage,
                    club: related.eyebrow || "Story",
                    tags: ["Story"],
                    date: related.date,
                    readTime: `${Math.max(1, Math.ceil(related.chapters.reduce((t, c) => t + c.body.join(" ").split(" ").length, 0) / 200))} min read`,
                    content: ""
                  }} />
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
