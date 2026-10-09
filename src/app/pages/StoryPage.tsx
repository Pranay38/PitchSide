"use client";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "@/lib/router-compat";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ReadingProgress } from "../components/ReadingProgress";
import { CommentSection } from "../components/CommentSection";
import type { StoryFeature } from "../data/stories";
import {
  getStoryBySlug,
  getStoryBySlugAsync,
  getStoryPreview,
  getAllStories,
} from "../lib/storyStorage";
import { ReactionUI } from "../components/ReactionUI";
import { StoryFeatureCard } from "../components/StoryFeatureCard";
import { TouchlineAudioPlayer } from "../components/TouchlineAudioPlayer";

export function StoryPage({ initialStory }: { initialStory?: StoryFeature | null }) {
  const params = useParams();
  const slug = params.slug ? String(params.slug) : "";
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get("preview") === "1";
  const previewId = searchParams.get("storyId") || "";
  const initialPreviewStory = isPreviewMode ? getStoryPreview(previewId, slug) : undefined;
  const [story, setStory] = useState<StoryFeature | undefined>(() => (
    initialStory || initialPreviewStory || getStoryBySlug(slug, isPreviewMode)
  ));
  const [activeChapterId, setActiveChapterId] = useState(story?.chapters[0]?.id || "");
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});
  
  // Calculate reading time based on total words (approx 200 words per minute)
  const readingTime = story 
    ? Math.max(1, Math.ceil(story.chapters.reduce((total, ch) => total + ch.body.join(" ").split(" ").length, 0) / 200))
    : 0;
  const relatedStories = useMemo(() => {
    if (!story) return [];
    const words = (item: StoryFeature) => new Set(`${item.title} ${item.subtitle} ${item.excerpt}`.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    const currentWords = words(story);
    return getAllStories().filter(item => item.id !== story.id)
      .map(candidate => ({ candidate, score: (candidate.eyebrow === story.eyebrow ? 3 : 0) + [...words(candidate)].filter(word => currentWords.has(word)).length }))
      .sort((a, b) => b.score - a.score || Date.parse(b.candidate.publishedAt || b.candidate.date) - Date.parse(a.candidate.publishedAt || a.candidate.date))
      .slice(0, 3).map(item => item.candidate);
  }, [story]);
  const jumpToChapter = (id: string) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chapterRefs.current[id]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    setActiveChapterId(id);
    chapterRefs.current[id]?.focus({ preventScroll: true });
  };

  useEffect(() => {
    // Published content is authoritative and must not disappear when local
    // storage is empty or the browser API request is blocked by a crawler.
    if (initialStory && !isPreviewMode) {
      setStory(initialStory);
      return;
    }
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
  }, [slug, isPreviewMode, previewId, initialStory]);

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
          setActiveChapterId(topEntry.target.getAttribute("data-chapter-id") || story.chapters[0]?.id || "");
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
              This story does not exist or has not been published yet.
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
        "url": "https://www.thetouchlinedribble.in/logo.png"
      }
    }
  });

  const chapterLinks = (
    <nav aria-label="Story chapters" className="space-y-1">
      {story.chapters.map((chapter) => (
        <button key={chapter.id} type="button" aria-current={activeChapterId === chapter.id ? "location" : undefined}
          onClick={() => jumpToChapter(chapter.id)}
          className={`block min-h-11 w-full border-l-2 px-4 py-2 text-left text-sm leading-6 transition-colors motion-reduce:transition-none focus-visible:outline-green-600 ${activeChapterId === chapter.id ? "border-green-700 text-green-700 dark:border-green-400 dark:text-green-400" : "border-transparent text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"}`}>
          {chapter.title}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 dark:bg-[#101412] dark:text-stone-100">
      <SEO title={isPreviewMode ? `${story.title} Preview` : story.title} description={story.excerpt} image={story.coverImage}
        url={`https://www.thetouchlinedribble.in/stories/${story.slug}`} type="article" date={story.date} schema={storySchema} />
      <ReadingProgress editorial />
      <Header />
      <main id="main-content" className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <header className="pb-10 pt-10 md:pb-14 md:pt-16">
          <Link to="/stories" className="mb-10 inline-flex min-h-11 items-center gap-2 text-sm text-stone-600 hover:text-green-700 dark:text-stone-400"><ArrowLeft className="h-4 w-4" />Stories</Link>
          <div className="max-w-[960px]">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.14em] text-green-700 dark:text-green-400">{story.eyebrow}{isPreviewMode ? " · Preview" : ""}{story.isDraft ? " · Draft" : ""}</p>
            <h1 className="font-newsreader text-[clamp(2.75rem,6vw,5.5rem)] font-medium leading-[1.03] tracking-tight [overflow-wrap:anywhere]">{story.title}</h1>
            {story.subtitle && <p className="mt-6 max-w-[740px] font-newsreader text-2xl leading-snug text-stone-600 dark:text-stone-300 md:text-3xl">{story.subtitle}</p>}
            {story.excerpt && <p className="mt-5 max-w-[65ch] text-base leading-7 text-stone-600 dark:text-stone-400">{story.excerpt}</p>}
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-500 dark:text-stone-400"><span>{story.date}</span><span>{readingTime} min read</span></div>
          </div>
        </header>
        {story.coverImage && <figure className="relative mb-12 aspect-[4/3] overflow-hidden bg-stone-200 dark:bg-stone-900 md:mb-16 md:aspect-[16/9]">
          <Image src={story.coverImage} alt={story.title} fill priority sizes="(max-width: 1180px) 100vw, 1120px" className="object-cover" />
        </figure>}
        <div className="grid items-start gap-12 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-stone-500">In this story</p>{chapterLinks}
          </aside>
          <article className="min-w-0 max-w-[720px]">
            {story.chapters.length > 1 && <details className="mb-10 border-y border-stone-300 py-3 dark:border-stone-700 lg:hidden"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">In this story</summary>{chapterLinks}</details>}
            {story.audioUrl && <div className="mb-10"><TouchlineAudioPlayer audioUrl={story.audioUrl} title={story.title} /></div>}
            <div className="space-y-14 md:space-y-20">
              {story.chapters.map(chapter => (
                <section key={chapter.id} id={chapter.id} tabIndex={-1} ref={node => { chapterRefs.current[chapter.id] = node; }} data-chapter-id={chapter.id} className="scroll-mt-28 focus:outline-none">
                  {chapter.kicker && <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-green-700 dark:text-green-400">{chapter.kicker}</p>}
                  <h2 className="mb-7 font-newsreader text-3xl font-medium leading-tight tracking-tight [overflow-wrap:anywhere] md:text-4xl">{chapter.title}</h2>
                  <div className="story-prose space-y-6 font-newsreader text-[21px] leading-[1.65] text-stone-800 dark:text-stone-200 md:text-[23px]">
                    {chapter.body.map((paragraph, index) => paragraph.trim().startsWith("<") ? (
                      <div key={index} className="pitchside-article-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(paragraph) }} />
                    ) : <p key={index}>{paragraph}</p>)}
                  </div>
                  {chapter.image?.src && <figure className="my-9"><img src={chapter.image.src} alt={chapter.image.alt || chapter.title} loading="lazy" className="h-auto w-full" />{chapter.image.caption && <figcaption className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">{chapter.image.caption}</figcaption>}</figure>}
                  {chapter.pullQuote && <blockquote className="my-10 border-l-2 border-green-700 pl-6 font-newsreader text-3xl leading-snug tracking-tight dark:border-green-400">{chapter.pullQuote}</blockquote>}
                </section>
              ))}
            </div>
            <div className="mt-12 border-t border-stone-300 pt-6 dark:border-stone-700"><ReactionUI itemId={story.id} itemType="story" /></div>
            <div className="py-12"><CommentSection postId={`story-${story.slug}`} /></div>
          </article>
        </div>
        {relatedStories.length > 0 && <section className="border-t border-stone-300 py-12 dark:border-stone-700 md:py-16"><h2 className="mb-8 font-newsreader text-4xl">More stories</h2><div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">{relatedStories.map(related => <StoryFeatureCard key={related.id} story={related} />)}</div></section>}
      </main>
      <Footer />
    </div>
  );
}
