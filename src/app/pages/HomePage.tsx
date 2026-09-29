"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Newspaper, CheckCircle } from "@phosphor-icons/react";
import { Link } from "@/lib/router-compat";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SEO } from "../components/SEO";
import AeroHero from "../components/ui/aero-hero";
import { SectionMarker } from "../components/SectionMarker";
import { StoryFeatureCard } from "../components/StoryFeatureCard";
import { ArticleCard } from "../components/ui/blog-post-card";
import { QuickTakesSection } from "../components/QuickTakesSection";
import { InlineNewsletterCard } from "../components/InlineNewsletterCard";
import { PageState } from "../components/PageState";
import {
  getSiteSettings,
  getSiteSettingsAsync,
  type SiteSettings,
} from "../lib/siteSettingsStorage";
import { selectMatchdayContent, storyEdition } from "../lib/matchdayContent";
import { trackContentEvent } from "../lib/analytics";
import { useUserPreferences } from "../hooks/useUserPreferences";
import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";

async function fetchPublishedFeed<T>(path: string): Promise<T[]> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("The published feed is unavailable");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("The published feed is invalid");
  return data as T[];
}

interface HomePageProps {
  serverPosts?: BlogPost[];
  serverStories?: StoryFeature[];
  serverSettings?: SiteSettings | null;
}

function ReadingSection({
  minute,
  title,
  description,
  posts,
  href,
  linkLabel,
  placement,
}: {
  minute: string;
  title: string;
  description: string;
  posts: BlogPost[];
  href: string;
  linkLabel: string;
  placement: string;
}) {
  return (
    <section
      className="py-24 md:py-32"
      aria-label={title}
      onClickCapture={(event) => {
        const anchor = (event.target as HTMLElement).closest("a");
        if (anchor)
          trackContentEvent("homepage_article_click", {
            placement,
            destination: anchor.getAttribute("href") || "",
          });
      }}
    >
      <SectionMarker minute={minute} label={title} />
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl sm:text-5xl font-headline font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            {description}
          </p>
        </div>
        <Link
          to={href}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      
      {!posts.length ? (
        <div className="w-full py-12 rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground">More content arriving before the next whistle.</p>
        </div>
      ) : (
        <div className={`grid gap-6 md:grid-cols-2 ${posts.length === 3 ? "xl:grid-cols-[2fr_1fr]" : ""}`}>
          {posts.map((post, index) => (
            <Link
              key={post.id}
              to={`/post/${post.slug || post.id}`}
              className={`block h-full group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${posts.length === 3 && index === 0 ? "xl:row-span-2" : ""}`}
            >
              <ArticleCard
                headline={post.title}
                excerpt={post.excerpt}
                cover={post.coverImage}
                tag={post.club}
                readingTime={post.readTime}
                writer={post.author}
                publishedAt={post.publishAt || post.date}
                className="h-full"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage({
  serverPosts,
  serverStories,
  serverSettings,
}: HomePageProps = {}) {
  const { newsletterOptIn, loading: preferencesLoading } = useUserPreferences();
  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchPublishedFeed<BlogPost>("/api/posts"),
    initialData: serverPosts,
    staleTime: 300000,
  });
  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchPublishedFeed<StoryFeature>("/api/stories"),
    initialData: serverStories,
    staleTime: 300000,
  });
  const { data: settings = getSiteSettings() } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettingsAsync,
    initialData: serverSettings || undefined,
    staleTime: 300000,
  });
  const content = useMemo(
    () => selectMatchdayContent(posts, stories, settings.homepageCuration),
    [posts, stories, settings],
  );
  const hasContent = !!content.hero || !!content.monthlyStory;
  return (
    <div className="page-atmosphere min-h-[100dvh] transition-colors duration-300">
      <SEO
        title="Home"
        description="Strong opinions on football’s biggest debates, with the evidence and knowledge behind them."
        url="https://www.thetouchlinedribble.in/"
      />
      <Header />
      <main>
        {content.hero && (
          <div
            onClickCapture={(event) => {
              if ((event.target as HTMLElement).closest("a"))
                trackContentEvent("homepage_article_click", {
                  placement: "kickoff",
                  article_id: content.hero!.id,
                });
            }}
          >
            <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-10">
              <SectionMarker
                minute="0′"
                label="Kick-off · The Big Talking Point"
              />
            </div>
            <AeroHero post={content.hero} />
          </div>
        )}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {!hasContent && (
            <PageState
              icon={Newspaper}
              title={
                isLoading
                  ? "Loading the latest reading…"
                  : error
                    ? "The homepage is unavailable right now"
                    : "The next edition is on its way"
              }
              description="Football opinions, useful explainers, and a monthly story."
            />
          )}
          {true && (
            <section
              className="py-24 md:py-32"
              aria-label="Our Verdict"
              onClickCapture={(event) => {
                const anchor = (event.target as HTMLElement).closest("a");
                if (anchor)
                  trackContentEvent("homepage_article_click", {
                    placement: "verdict",
                    destination: anchor.getAttribute("href") || "",
                  });
              }}
            >
              <SectionMarker minute="15′" label="Our Verdict" />
              <QuickTakesSection posts={content.verdicts} selected />
            </section>
          )}
          <ReadingSection
            minute="30′"
            title="Understand the Game"
            description="The knowledge behind the talking points. Clear explanations, grounded in football."
            posts={content.explainers}
            href="/learn"
            linkLabel="Explore the explainers"
            placement="understand"
          />
          {true && (
            <section
              className="py-24 md:py-32"
              aria-labelledby="monthly-story-heading"
              onClickCapture={(event) => {
                if ((event.target as HTMLElement).closest("a"))
                  trackContentEvent("homepage_article_click", {
                    placement: "halftime",
                    story_id: content.monthlyStory!.id,
                  });
              }}
            >
              <SectionMarker
                minute="HT"
                label="Half-time · The Monthly Story"
              />
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="kicker text-primary mb-2">
                    {storyEdition(content.monthlyStory)}
                  </p>
                  <h2
                    id="monthly-story-heading"
                    className="text-4xl sm:text-5xl font-headline font-bold tracking-tight text-foreground"
                  >
                    The story behind it.
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    One story a month. Take a moment to go deeper.
                  </p>
                </div>
                <Link
                  to="/stories"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"
                >
                  Explore all stories
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid">
                <StoryFeatureCard
                  story={content.monthlyStory}
                  variant="feature"
                  label={storyEdition(content.monthlyStory)}
                  ctaLabel="Read the monthly story"
                />
              </div>
            </section>
          )}
          <ReadingSection
            minute="60′"
            title="Latest From the Touchline"
            description="More perspectives and fresh reading from the site."
            posts={content.latest}
            href="/archive"
            linkLabel="All articles"
            placement="latest"
          />
          <ReadingSection
            minute="75′"
            title="Worth Another Read"
            description="Selected from the archive. Ideas worth returning to."
            posts={content.archive}
            href="/archive"
            linkLabel="Explore the archive"
            placement="archive"
          />
          <section className="py-24 md:py-32" aria-label="Added Time">
          <SectionMarker minute="90′" label="Added Time · Support & Subscribe" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {!preferencesLoading && !newsletterOptIn ? (
              <div className="lg:col-span-2 h-full">
                <InlineNewsletterCard
                  title="The Weekly Whistle"
                  description="One strong opinion. One useful football lesson. Every week. Get the next edition in your inbox."
                />
              </div>
            ) : (
              <div className="lg:col-span-2 h-full rounded-2xl bg-card border border-border p-8 flex items-center justify-center">
                 <p className="text-muted-foreground font-medium flex items-center gap-2">
                    <CheckCircle weight="fill" className="w-5 h-5 text-primary" /> You're subscribed to The Weekly Whistle.
                 </p>
              </div>
            )}
            
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 flex flex-col justify-center items-start shadow-xl relative overflow-hidden group">
              <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse group-hover:bg-primary/20 transition-all duration-700"></div>
              <h3 className="text-xl font-headline font-bold text-white relative z-10">Keep the Pitch Green</h3>
              <p className="mt-2 text-sm text-slate-400 mb-6 relative z-10">
                The Touchline Dribble is independent. If you enjoy the tactical deep dives, a small contribution helps keep the servers running.
              </p>
              <a 
                href="https://rzp.io/l/your-link-here" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative z-10 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] w-full sm:w-auto"
              >
                Support via Razorpay
              </a>
            </div>
          </div>
        </section>
        </div>
      </main>
      <Footer hideNewsletter />
    </div>
  );
}
// Cache buster: force Webpack rebuild
