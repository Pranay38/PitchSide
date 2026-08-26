"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowLeft, ArrowRight, Bell, ExternalLink, Lock, Repeat2, ShieldQuestion, Sparkles } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { PostCard } from "../components/PostCard";
import { StoryFeatureCard } from "../components/StoryFeatureCard";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import { InlineNewsletterCard } from "../components/InlineNewsletterCard";
import { buildTransferReliabilityBoard, type TransferReliabilityEntry } from "../lib/transferReliability";
import {
  buildTransferDossierSlug,
  formatTransferWatchAmount,
  getTransferTierLabel,
  getTransferTopicLabel,
} from "../lib/transferWatch";
import {
  buildTransferSummary,
  buildTransferCoverageSummary,
  buildTransferTimeline,
  buildTransferSourceTimeline,
  getAdjacentTransferEntries,
  getRelatedTransferPosts,
  getRelatedTransferStories,
  matchesTransferEntrySlug,
} from "../lib/transferDossiers";
import {
  buildTransferSourceSnapshot,
  formatTransferSourceDate,
  getTransferSourceStanceLabel,
  getTransferSourcesForDossier,
  type TransferSourceArticle,
} from "../lib/transferSources";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { toast } from "sonner";
import { getClubByName } from "../data/clubs";

export function TransferDossierPage() {
  const params = useParams();
  const slug = params.slug ? String(params.slug) : "";
  const [entries, setEntries] = useState<TransferReliabilityEntry[]>([]);
  const [sources, setSources] = useState<TransferSourceArticle[]>([]);
  const [posts, setPosts] = useState(() => getPublishedPosts());
  const [stories, setStories] = useState(() => getAllStories());
  const [loading, setLoading] = useState(entries.length === 0);
  
  const { followedTransfers, toggleFollowedTransfer, newsletterOptIn } = useUserPreferences();

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getSiteSettingsAsync(),
      getPublishedPostsAsync(),
      getAllStoriesAsync(),
    ])
      .then(([settings, nextPosts, nextStories]) => {
        if (!isMounted) return;
        setEntries(buildTransferReliabilityBoard(settings.transferWatch));
        setSources(settings.transferSources);
        setPosts(nextPosts);
        setStories(nextStories);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const dossier = useMemo(() => (
    entries.find((entry) => matchesTransferEntrySlug(entry, slug)) || null
  ), [entries, slug]);

  const timeline = useMemo(() => (
    dossier ? buildTransferTimeline(dossier) : []
  ), [dossier]);
  const relatedPosts = useMemo(() => (
    dossier ? getRelatedTransferPosts(posts, dossier) : []
  ), [dossier, posts]);
  const relatedStories = useMemo(() => (
    dossier ? getRelatedTransferStories(stories, dossier) : []
  ), [dossier, stories]);
  const adjacentEntries = useMemo(() => (
    dossier ? getAdjacentTransferEntries(entries, dossier) : []
  ), [dossier, entries]);
  const dossierSources = useMemo(() => (
    dossier ? getTransferSourcesForDossier(sources, dossier) : []
  ), [dossier, sources]);
  const sourceSnapshot = useMemo(() => (
    buildTransferSourceSnapshot(dossierSources)
  ), [dossierSources]);
  const sourceTimeline = useMemo(() => (
    buildTransferSourceTimeline(dossierSources)
  ), [dossierSources]);
  const coverageSummary = useMemo(() => (
    buildTransferCoverageSummary(dossierSources)
  ), [dossierSources]);

  const followed = dossier ? followedTransfers.some((topic) => topic === dossier.topic) : false;
  const title = dossier ? `${dossier.player} to ${dossier.club} dossier` : "Transfer dossier";
  const fromClubInfo = dossier?.fromClub ? getClubByName(dossier.fromClub) : null;
  const toClubInfo = dossier ? getClubByName(dossier.club) : null;
  const radarData = useMemo(() => {
    if (!dossier?.scoutGrades) return null;
    return [
      { subject: "Pace", A: dossier.scoutGrades.pace, fullMark: 10 },
      { subject: "Final Third", A: dossier.scoutGrades.finalThird, fullMark: 10 },
      { subject: "Passing", A: dossier.scoutGrades.passing, fullMark: 10 },
      { subject: "Defensive IQ", A: dossier.scoutGrades.defensiveIQ, fullMark: 10 },
      { subject: "Physicality", A: dossier.scoutGrades.physicality, fullMark: 10 },
    ];
  }, [dossier]);

  if (!loading && !dossier) {
    return (
      <div className="page-atmosphere min-h-screen transition-colors duration-300">
        <Header />
        <main className="mx-auto w-full max-w-[900px] px-4 py-16 sm:px-6">
          <PageState
            icon={Repeat2}
            eyebrow="Transfer dossier"
            title="Dossier not found"
            description="This transfer case file does not exist yet, or the board entry has been removed."
            action={(
              <Link
                to="/transfers"
                className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white"
              >
                Back to transfers
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="page-atmosphere min-h-screen transition-colors duration-300">
        <Header />
        <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
          <div className="h-[320px] animate-pulse rounded-[2rem] bg-gray-200 dark:bg-gray-800" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title={title}
        description={buildTransferSummary(dossier)}
        url={`https://www.thetouchlinedribble.in/transfers/${buildTransferDossierSlug(dossier)}`}
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="relative">
            <Link to="/transfers" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#16A34A]">
              <ArrowLeft className="h-4 w-4" />
              Back to board
            </Link>
          </div>

          <div className="relative mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${dossier.status === "confirmed" ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#0F172A]/5 text-[#475569] dark:bg-white/5 dark:text-gray-300"}`}>
                  {dossier.status}
                </span>
                <span className="rounded-full bg-slate-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  {getTransferTierLabel(dossier.tier, dossier.status)}
                </span>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                  {dossier.reliabilityLabel}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                  {dossier.playerImageUrl && (
                      <img src={dossier.playerImageUrl} alt={dossier.player} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-[#0F172A]" />
                  )}
                  <h1 className="text-4xl font-black font-outfit text-[#0F172A] dark:text-white md:text-5xl">
                    {dossier.player}
                  </h1>
              </div>
              
              {/* Modern Club-to-Club Directional Display */}
              <div className="mt-8 flex flex-wrap items-center gap-4 md:gap-6 w-full max-w-full">
                {dossier.fromClub && (
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[200px] bg-white dark:bg-[#0F172A] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-md">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center p-2 border border-gray-100 dark:border-gray-700">
                      {fromClubInfo?.logo ? (
                          <img src={fromClubInfo.logo} alt={dossier.fromClub} className="w-full h-full object-contain" />
                      ) : (
                          <ShieldQuestion className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B] dark:text-gray-500">Leaving</span>
                      <span className="text-rose-500 font-bold text-lg sm:text-xl truncate">{dossier.fromClub}</span>
                    </div>
                  </div>
                )}
                
                {dossier.fromClub && (
                  <div className="flex items-center justify-center flex-shrink-0 bg-white/50 dark:bg-white/5 h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[200px] bg-white dark:bg-[#0F172A] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-md">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center p-2 border border-gray-100 dark:border-gray-700">
                    {toClubInfo?.logo ? (
                        <img src={toClubInfo.logo} alt={dossier.club} className="w-full h-full object-contain" />
                    ) : (
                        <ShieldQuestion className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B] dark:text-gray-500">Joining</span>
                    <span className="text-emerald-500 font-bold text-lg sm:text-xl truncate">{dossier.club}</span>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-base leading-7 text-[#64748B] dark:text-gray-400">
                {buildTransferSummary(dossier)}
              </p>

              {dossier.myTake && (
                <div className="mt-8 rounded-2xl bg-[#16A34A]/5 border border-[#16A34A]/20 p-5 md:p-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A] mb-3 flex items-center gap-2">
                    Market Context & My Take
                  </h3>
                  <div className="text-base leading-relaxed text-[#0F172A] dark:text-gray-300 font-medium whitespace-pre-wrap">
                    {dossier.myTake}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <div className="rounded-2xl bg-[#16A34A]/8 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Board score</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{dossier.reliabilityScore}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Fee signal</p>
                <p className="mt-2 text-base font-black font-outfit text-[#0F172A] dark:text-white">{formatTransferWatchAmount(dossier)}</p>
              </div>
              <div className="rounded-2xl bg-sky-500/5 p-4 border border-sky-500/10">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">External desk</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{sourceSnapshot.coverageCount}</p>
                <p className="mt-1 text-xs font-semibold text-[#64748B] dark:text-gray-400">
                  {sourceSnapshot.consensusLabel} consensus
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = toggleFollowedTransfer(dossier.topic);
                  toast.success(next ? `Following ${getTransferTopicLabel(dossier)} alerts` : "Transfer alert removed");
                }}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-bold transition-colors ${followed
                  ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                  : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                <Bell className="mb-2 h-4 w-4" />
                {followed ? "Following alert" : "Follow dossier"}
              </button>
            </div>
          </div>
        </section>

        {!newsletterOptIn ? (
          <section className="mt-10 relative">
            <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
              <InlineNewsletterCard 
                title="Unlock the Full Dossier" 
                description="Get access to our complete scouting profile, radar charts, timeline, and external coverage analysis by joining our free newsletter."
                className="w-full max-w-2xl shadow-2xl relative z-20"
              />
              {/* Blur backdrop for the gate */}
              <div className="absolute inset-0 bg-white/60 dark:bg-[#0F172A]/60 backdrop-blur-md rounded-[2rem] z-10" />
            </div>

            {/* Blurred preview content to tease the user */}
            <div className="opacity-40 pointer-events-none filter blur-sm">
              <div className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8 flex flex-col md:flex-row items-center gap-8 h-[300px]">
                <div className="flex-1 w-full max-w-sm h-full bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                  <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                  <div className="h-24 w-full bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <>
            {radarData && radarData.length > 0 && (
          <section className="mt-10">
            <div className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full max-w-sm h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#16A34A" strokeOpacity={0.2} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 800 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                      name="Player"
                      dataKey="A"
                      stroke="#16A34A"
                      fill="#16A34A"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Scouting Profile</p>
                <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                  Radar Evaluation
                </h2>
                <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                  This multi-axis plot breaks down the player's underlying profile attributes based on our film room scouting and statistical analysis.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {radarData.map((stat, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#64748B] dark:text-gray-400">{stat.subject}</span>
                        <span className="text-xl font-black font-outfit text-[#0F172A] dark:text-white">{stat.A}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">External signal desk</p>
                <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                  Linked coverage around this move
                </h2>
                <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                  {coverageSummary}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Coverage</p>
                  <p className="mt-2 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">{sourceSnapshot.coverageCount}</p>
                </div>
                <div className="rounded-2xl bg-amber-500/5 p-4 border border-amber-500/10">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">Consensus</p>
                  <p className="mt-2 text-2xl font-black font-outfit text-[#0F172A] dark:text-white">{sourceSnapshot.consensusLabel}</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/5 p-4 border border-emerald-500/10">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Latest update</p>
                  <p className="mt-2 text-sm font-black text-[#0F172A] dark:text-white">
                    {sourceSnapshot.lastExternalUpdateAt ? formatTransferSourceDate(sourceSnapshot.lastExternalUpdateAt) : "No linked update"}
                  </p>
                </div>
              </div>
            </div>

            {dossierSources.length === 0 ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-gray-300 bg-white/60 p-5 text-sm leading-6 text-[#64748B] dark:border-gray-700 dark:bg-[#0F172A] dark:text-gray-400">
                No BBC, ESPN, Athletic, club-site, or reporter links have been attached yet. The dossier still works, but this external desk becomes much stronger once those source cards are logged from the admin.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {dossierSources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-[1.5rem] border border-gray-200 bg-white p-5 transition-colors hover:border-[#16A34A]/30 hover:bg-[#16A34A]/5 dark:border-gray-800 dark:bg-[#0F172A]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                        {source.sourceLabel}
                      </span>
                      <span className="rounded-full bg-[#0F172A]/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:bg-white/5 dark:text-gray-300">
                        {getTransferSourceStanceLabel(source.stance)}
                      </span>
                      {source.paywalled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                          <Lock className="h-3 w-3" />
                          Paywalled
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-xl font-black font-outfit text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
                      {source.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                      {source.claimSummary || "External source coverage attached to the dossier."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#64748B] dark:text-gray-400">
                      <span>{formatTransferSourceDate(source.publishedAt || source.discoveredAt)}</span>
                      {source.reporter && <span>By {source.reporter}</span>}
                      <span className="inline-flex items-center gap-1 text-[#16A34A]">
                        Open source
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Signal timeline</p>
            <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
              The current dossier path
            </h2>

            {(dossier.aiScore || dossier.aiTake) && (
              <div className="mt-6 p-5 rounded-[1.5rem] bg-purple-500/5 border border-purple-500/20">
                 <div className="flex items-start gap-4">
                    {dossier.aiScore && (
                        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 flex items-center justify-center shadow-inner">
                            <span className="text-xl font-black font-outfit text-purple-600 dark:text-purple-400">{dossier.aiScore}</span>
                        </div>
                    )}
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> AI Take
                        </h3>
                        {dossier.aiTake && (
                            <p className="text-sm leading-6 text-[#0F172A] dark:text-gray-300 mt-2">
                                {dossier.aiTake}
                            </p>
                        )}
                    </div>
                 </div>
              </div>
            )}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {timeline.map((item) => (
                <div key={`${item.label}-${item.title}`} className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#0F172A]">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">{item.label}</p>
                  <h3 className="mt-2 text-xl font-black font-outfit text-[#0F172A] dark:text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">{item.note}</p>
                </div>
              ))}
            </div>

            {sourceTimeline.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-800">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">External timeline</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {sourceTimeline.map((item) => (
                    <a
                      key={`${item.label}-${item.title}-${item.url}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[1.5rem] border border-gray-200 bg-white p-5 transition-colors hover:border-[#16A34A]/30 hover:bg-[#16A34A]/5 dark:border-gray-800 dark:bg-[#0F172A]"
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">{item.label}</p>
                      <h3 className="mt-2 text-xl font-black font-outfit text-[#0F172A] dark:text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">{item.note}</p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-gray-400">
                        <span>{item.sourceLabel}</span>
                        {item.paywalled && (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                            <Lock className="h-3 w-3" />
                            Paywalled
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className="mt-10">
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Attached coverage</p>
              <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                Articles already orbiting this rumor
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {relatedStories.length > 0 && (
          <section className="mt-10">
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Story links</p>
              <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                Longform angles that touch the same lane
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {relatedStories.map((story) => (
                <StoryFeatureCard key={story.id} story={story} />
              ))}
            </div>
          </section>
        )}

        {adjacentEntries.length > 0 && (
          <section className="mt-10">
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">Adjacent dossiers</p>
              <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                More transfer cases around {dossier.club}
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {adjacentEntries.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/transfers/${buildTransferDossierSlug(entry)}`}
                  className="group rounded-[1.5rem] border border-gray-200 bg-white p-5 transition-colors hover:border-[#16A34A]/30 hover:bg-[#16A34A]/5 dark:border-gray-800 dark:bg-[#0F172A]"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                    {getTransferTierLabel(entry.tier, entry.status)}
                  </p>
                  <h3 className="mt-3 text-2xl font-black font-outfit text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
                    {entry.player}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                    {entry.boardLabel} · {formatTransferWatchAmount(entry)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
        </>
        )}
      </main>

      <Footer />
    </div>
  );
}
