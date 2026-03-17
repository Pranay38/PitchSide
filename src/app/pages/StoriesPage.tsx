import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Layers3, ScanSearch } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import type { StoryFeature } from "../data/stories";

export function StoriesPage() {
  const [stories, setStories] = useState<StoryFeature[]>(() => getAllStories());

  useEffect(() => {
    let isMounted = true;

    getAllStoriesAsync()
      .then((nextStories) => {
        if (isMounted) {
          setStories(nextStories);
        }
      })
      .catch(() => {
        // Keep the local snapshot when the API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title="Stories"
        description="Scroll-driven football stories built for deeper, visual longform reading."
        url="https://pitchside-orcin.vercel.app/stories"
      />
      <Header />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <section className="mb-10 rounded-[2rem] overflow-hidden bg-[#0F172A] text-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 md:p-10 lg:p-12">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#4ade80] mb-4">
                Scrollytelling Studio
              </p>
              <h1 className="text-4xl md:text-5xl font-black font-outfit leading-[0.95] max-w-3xl">
                Longform football stories designed to move as you scroll.
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-2xl mt-5">
                This is where deeper pieces live: layered narratives, sticky visuals, momentum swings,
                and chapter-by-chapter storytelling instead of ordinary article blocks.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  <Layers3 className="w-4 h-4 text-[#4ade80]" />
                  Chapter-based reading
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  <ScanSearch className="w-4 h-4 text-[#4ade80]" />
                  Scroll-reactive visuals
                </div>
              </div>
            </div>

            <div className="relative min-h-[280px] lg:min-h-full">
              <img
                src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
                alt="Football stadium under lights"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#16A34A]/35 via-transparent to-[#0F172A]" />
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          {stories.map((story) => (
            <Link
              key={story.slug}
              to={`/stories/${story.slug}`}
              className="group rounded-[2rem] overflow-hidden bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 hover:border-[#16A34A]/30 transition-all duration-300"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="relative min-h-[240px] lg:min-h-full">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />
                  <div
                    className="absolute inset-0 opacity-80"
                    style={{ background: `linear-gradient(135deg, ${story.themeFrom}99, ${story.themeTo}66)` }}
                  />
                </div>

                <div className="p-7 md:p-8 lg:p-10">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-[#16A34A]/10 text-[#16A34A]">
                      {story.eyebrow}
                    </span>
                    <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">{story.date}</span>
                    <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">{story.readTime}</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-black font-outfit text-[#0F172A] dark:text-white leading-[1]">
                    {story.title}
                  </h2>
                  <p className="text-lg text-[#16A34A] font-semibold mt-3">
                    {story.subtitle}
                  </p>
                  <p className="text-base text-[#475569] dark:text-gray-300 mt-5 max-w-2xl">
                    {story.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {story.highlights.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-[#334155] dark:bg-white/5 dark:text-gray-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="inline-flex items-center gap-2 mt-8 text-sm font-black uppercase tracking-[0.18em] text-[#16A34A]">
                    Open story
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
