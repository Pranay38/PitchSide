import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { RefreshCw, Zap } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { NewsTicker } from "../components/NewsTicker";
import { PollOfTheWeekPanel } from "../components/PollOfTheWeekPanel";
import { OnThisDayWidget } from "../components/OnThisDayWidget";
import { ManagerPressureWidget, type ManagerPressure } from "../components/ManagerPressureWidget";
import { PostCard } from "../components/PostCard";
import { getPublishedPosts } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";

interface DailyFeaturesData {
  lastUpdated: string;
    managerPressure: ManagerPressure[];
}

export function DailyFixPage() {
  const { favoriteClub } = useClubPreference();
  const [dailyFeatures, setDailyFeatures] = useState<DailyFeaturesData | null>(null);
  const posts = useMemo(() => getPublishedPosts().filter((post) => post.mustRead || post.thisWeek).slice(0, 4), []);

  useEffect(() => {
    let isMounted = true;

    fetch("/data/daily_features.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch daily fix data");
        return res.json();
      })
      .then((data) => {
        if (isMounted) setDailyFeatures(data);
      })
      .catch(() => {
        if (isMounted) setDailyFeatures(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title="The Daily Fix"
        description="Your daily football briefing: key talking points, rumor pulse, manager pressure, and the latest headlines."
        url="https://pitchside-orcin.vercel.app/daily-fix"
      />
      <Header favoriteClub={favoriteClub} />

            <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <section className="mb-10 text-center sm:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-3">
            Morning Briefing
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white leading-tight">
                The Daily Fix
              </h1>
              <p className="text-base text-[#64748B] dark:text-gray-400 max-w-2xl mt-3 mx-auto sm:mx-0">
                A curated lightweight football habit loop. The top stories, today's history, and the pulse of the internet.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-[#64748B] dark:text-gray-400">
              <RefreshCw className="w-4 h-4" />
              <span>
                {dailyFeatures?.lastUpdated
                  ? `Updated ${new Date(dailyFeatures.lastUpdated).toLocaleDateString()}`
                  : "Live modules update automatically"}
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          {/* Main Feed Column */}
          <div className="space-y-8">
             <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full gradient-accent" />
                  <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-[#0F172A] dark:text-white">
                    Top Stories
                  </h2>
                </div>
              </div>
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
          </div>

          {/* Sidebar / Curation Column */}
          <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-6 rounded-full bg-[#16A34A]" />
                <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-[#0F172A] dark:text-white">
                  The Pulse
                </h2>
              </div>
              
              <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#111827]">
                <div className="p-1">
                  <PollOfTheWeekPanel />
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden shadow-sm">
                <OnThisDayWidget />
              </div>
              
              {dailyFeatures && dailyFeatures.managerPressure && dailyFeatures.managerPressure.length > 0 && (
                 <div className="rounded-2xl overflow-hidden shadow-sm">
                   <ManagerPressureWidget data={dailyFeatures.managerPressure} />
                 </div>
              )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
