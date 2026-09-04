"use client";

import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArrowRight, Calendar, Newspaper, Timer } from "lucide-react";
import { SEO } from "../components/SEO";
import { SupportBanner } from "../components/SupportBanner";
import { InlineNewsletterCard } from "../components/InlineNewsletterCard";
import type { BlogPost } from "../data/posts";

interface WeeklyDigestPageProps {
  initialPosts: BlogPost[];
}

export function WeeklyDigestPage({ initialPosts }: WeeklyDigestPageProps) {
  const weeklyPosts = useMemo(() => {
    // Filter posts from the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return initialPosts
      .filter((post) => {
        const postDate = new Date(post.date);
        return postDate >= sevenDaysAgo && postDate <= now;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [initialPosts]);

  const leadStory = weeklyPosts.length > 0 ? weeklyPosts[0] : null;
  const supportingStories = weeklyPosts.slice(1, 4);
  const quickReads = weeklyPosts.slice(4);

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="The Whistle — Weekly Digest"
        description="The best tactical analysis, bold opinions, and quick reads from the last 7 days."
      />
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6">
        <div className="mb-12 border-l-4 border-primary pl-5">
          <div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-primary">
            <Calendar className="h-4 w-4" />
            THE WHISTLE
          </div>
          <h1 className="mt-3 font-headline text-5xl font-bold leading-none text-foreground sm:text-7xl">
            Weekly Digest
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-relaxed text-muted-foreground font-newsreader italic">
            The best tactical analysis, bold opinions, and quick reads from the last 7 days. Curated for the thinking fan.
          </p>
        </div>

        {weeklyPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-24 text-center text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No posts published in the last 7 days.</p>
          </div>
        ) : (
          <>
            {/* ── Lead Story ── */}
            {leadStory && (
              <section className="mb-16">
                <Link
                  to={`/post/${leadStory.slug || leadStory.id}`}
                  className="group flex flex-col md:flex-row gap-6 bg-card rounded-2xl border border-border overflow-hidden hover:bg-secondary transition-all"
                >
                  <div className="w-full md:w-2/3 h-64 md:h-[400px] overflow-hidden">
                    <img 
                      src={leadStory.coverImage} 
                      alt={leadStory.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="w-full md:w-1/3 p-6 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">Lead Story</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {leadStory.readTime}
                      </span>
                    </div>
                    <h2 className="font-headline font-bold text-3xl text-foreground mb-4 group-hover:text-primary transition-colors">
                      {leadStory.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed font-newsreader italic mb-8">
                      {leadStory.excerpt}
                    </p>
                    <div className="mt-auto flex items-center text-sm font-bold text-primary gap-2">
                      Read full analysis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* ── Supporting Grid ── */}
            {supportingStories.length > 0 && (
              <section className="mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {supportingStories.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.slug || post.id}`}
                      className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:bg-secondary transition-all"
                    >
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={post.coverImage} 
                          alt={post.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            {post.category || post.club}
                          </span>
                        </div>
                        <h3 className="font-headline font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="mt-auto text-xs text-muted-foreground flex items-center gap-1">
                          <Timer className="w-3 h-3" /> {post.readTime}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Quick Reads ── */}
            {quickReads.length > 0 && (
              <section className="mb-16">
                <h3 className="font-headline font-bold text-2xl text-foreground mb-6">More from this week</h3>
                <div className="grid gap-px bg-border rounded-2xl overflow-hidden border border-border">
                  {quickReads.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.slug || post.id}`}
                      className="group flex gap-5 items-center bg-card p-5 hover:bg-secondary transition-colors"
                    >
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl hidden sm:block">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-headline font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {post.category || post.club}
                          </span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-xs text-muted-foreground">{post.readTime}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="section-divider my-16" />
        
        {/* ── Bottom Section ── */}
        <section className="w-full max-w-4xl mx-auto space-y-12">
          <SupportBanner variant="compact" />
          <InlineNewsletterCard />
        </section>

      </main>
      <Footer />
    </div>
  );
}
