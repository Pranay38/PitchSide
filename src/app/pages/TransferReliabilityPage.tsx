import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Filter, Repeat2, Search, ShieldCheck, Bell, ShieldQuestion } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { useClubPreference } from "../hooks/useClubPreference";
import { getTransferWatchEntriesAsync } from "../lib/siteSettingsStorage";
import { buildTransferReliabilityBoard, type TransferReliabilityEntry } from "../lib/transferReliability";
import {
  buildTransferDossierSlug,
  formatTransferWatchAmount,
  getTransferTierLabel,
  getTransferTopicLabel,
} from "../lib/transferWatch";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { toast } from "sonner";
import { getClubByName } from "../data/clubs";

function getTierClasses(entry: TransferReliabilityEntry): string {
  if (entry.status === "confirmed") {
    return "bg-[#16A34A]/10 text-[#16A34A]";
  }

  if (entry.tier === 1) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  if (entry.tier === 2) return "bg-sky-500/10 text-sky-600 dark:text-sky-300";
  if (entry.tier === 3) return "bg-amber-500/10 text-amber-600 dark:text-amber-300";
  if (entry.tier === 4) return "bg-orange-500/10 text-orange-600 dark:text-orange-300";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-300";
}

export function TransferReliabilityPage() {
  const { favoriteClub } = useClubPreference();
  const [entries, setEntries] = useState<TransferReliabilityEntry[]>([]);
  
  const { followedTransfers, toggleFollowedTransfer } = useUserPreferences();

  const [clubFilter, setClubFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    getTransferWatchEntriesAsync()
      .then((transferWatch) => {
        if (!isMounted) return;
        const board = buildTransferReliabilityBoard(transferWatch);
        setEntries(board);
        if (favoriteClub && board.some((entry) => entry.club === favoriteClub)) {
          setClubFilter(favoriteClub);
        }
      })
      .catch(() => {
        if (isMounted) setEntries([]);
      });

    return () => {
      isMounted = false;
    };
  }, [favoriteClub]);

  const clubs = useMemo(() => Array.from(new Set(entries.map((entry) => entry.club))).sort(), [entries]);
  const visibleEntries = useMemo(() => {
    const clubScoped = clubFilter === "all"
      ? entries
      : entries.filter((entry) => entry.club === clubFilter);

    if (!query.trim()) return clubScoped;

    const needle = query.trim().toLowerCase();
    return clubScoped.filter((entry) => (
      [entry.player, entry.club, entry.boardLabel, getTransferTierLabel(entry.tier, entry.status)]
        .some((value) => value.toLowerCase().includes(needle))
    ));
  }, [clubFilter, entries, query]);

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Transfer Reliability Board"
        description="Tiered rumor signals, dossier pages, and a cleaner market board for tracking the strongest football links."
        url="https://thetouchlinedribble.in/transfers"
      />
      <Header favoriteClub={favoriteClub} />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              Transfer Market
            </p>
          </div>

          <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black font-outfit text-[#0F172A] dark:text-white md:text-5xl">
                Reliability tiers now lead into dossier pages, not just a rumor list.
              </h1>
              <p className="mt-3 text-base leading-7 text-[#64748B] dark:text-gray-400">
                Each item carries its 1-5 source tier into the board score, then opens a dedicated dossier with signal context and attached editorial coverage.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[340px]">
              <div className="rounded-2xl bg-[#16A34A]/8 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Items</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{entries.length}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Visible</p>
                <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">{visibleEntries.length}</p>
              </div>
              <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Mode</p>
                <p className="mt-2 text-base font-black font-outfit text-[#0F172A] dark:text-white">Tier + dossier</p>
              </div>
            </div>
          </div>

          <div className="relative mt-7 flex flex-wrap gap-2">
            <Link to="/alerts" className="filter-chip">Alert center</Link>
            <Link to="/archive?topic=Transfers" className="filter-chip">Transfer archive</Link>
            <div className="filter-chip">
              <Repeat2 className="h-3.5 w-3.5" />
              Tier-led scoring
            </div>
          </div>
        </section>

        <section className="section-surface mt-10 rounded-[2rem] border border-gray-200 p-4 shadow-sm dark:border-gray-800 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[2fr_220px_220px]">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 dark:border-gray-700 dark:bg-[#08111f]">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search player, club, or tier"
                className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] dark:text-white"
              />
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 dark:border-gray-700 dark:bg-[#08111f]">
              <Filter className="h-4 w-4 text-[#16A34A]" />
              <select
                value={clubFilter}
                onChange={(event) => setClubFilter(event.target.value)}
                className="w-full bg-transparent text-sm text-[#0F172A] outline-none dark:text-white"
              >
                <option value="all">All clubs</option>
                {clubs.map((club) => (
                  <option key={club} value={club}>{club}</option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl bg-[#16A34A]/10 px-4 py-3 text-sm font-semibold text-[#16A34A]">
              {visibleEntries.length} dossier{visibleEntries.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-5">
          {visibleEntries.length > 0 ? visibleEntries.map((entry) => {
            const followed = followedTransfers.some((topic) => topic === entry.topic);
            const fromClubInfo = entry.fromClub ? getClubByName(entry.fromClub) : null;
            const toClubInfo = getClubByName(entry.club);

            return (
              <article key={entry.id} className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${entry.status === "confirmed" ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-[#0F172A]/5 text-[#475569] dark:bg-white/5 dark:text-gray-300"}`}>
                        {entry.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${getTierClasses(entry)}`}>
                        {getTransferTierLabel(entry.tier, entry.status)}
                      </span>
                      <span className="rounded-full bg-slate-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                        {entry.reliabilityLabel}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                        {entry.playerImageUrl && (
                            <img src={entry.playerImageUrl} alt={entry.player} className="w-16 h-16 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                        )}
                        <h2 className="text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                          {entry.player}
                        </h2>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-3 font-bold text-[#16A34A] bg-[#0F172A]/5 dark:bg-white/5 px-4 py-2.5 rounded-xl w-fit">
                      {entry.fromClub && (
                        <>
                          <div className="flex items-center gap-2">
                            {fromClubInfo?.logo ? (
                                <img src={fromClubInfo.logo} alt={entry.fromClub} className="w-5 h-5 object-contain" />
                            ) : (
                                <ShieldQuestion className="w-5 h-5 text-gray-400" />
                            )}
                            <span className="text-rose-500">{entry.fromClub}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        {toClubInfo?.logo ? (
                            <img src={toClubInfo.logo} alt={entry.club} className="w-5 h-5 object-contain" />
                        ) : (
                            <ShieldQuestion className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-emerald-500">{entry.club}</span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                      {entry.boardLabel} · {formatTransferWatchAmount(entry)} · Last updated {new Date(entry.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {entry.rationale.map((line, index) => (
                        <div key={`${entry.id}-${index}`} className="rounded-[1.25rem] bg-[#F8FAFC] px-4 py-3 text-sm leading-6 text-[#334155] dark:bg-[#08111f] dark:text-gray-200">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[320px] xl:grid-cols-1">
                    <div className="rounded-[1.5rem] bg-[#0F172A] px-5 py-4 text-white">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Board score</p>
                      <p className="mt-2 text-4xl font-black font-outfit">{entry.reliabilityScore}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = toggleFollowedTransfer(entry.topic);
                        toast.success(next ? `Following ${getTransferTopicLabel(entry)} alerts` : "Transfer alert removed");
                      }}
                      className={`rounded-[1.25rem] border px-4 py-3 text-sm font-bold transition-colors ${followed
                        ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                        : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {followed ? "Following alert" : "Follow transfer"}
                    </button>
                    <Link
                      to={`/transfers/${buildTransferDossierSlug(entry)}`}
                      className="inline-flex items-center justify-between rounded-[1.25rem] border border-gray-200 px-4 py-3 text-sm font-bold text-[#0F172A] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-700 dark:text-white"
                    >
                      Open dossier
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
                  <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#0F172A]">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">Reliability read</p>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#1F2937]">
                      <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${entry.reliabilityScore}%` }} />
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#0F172A]">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Dossier angle</p>
                    <p className="mt-3 text-sm leading-7 text-[#475569] dark:text-gray-300">
                      {entry.status === "confirmed"
                        ? "This case file is effectively closed, but the dossier still captures how strong the move looked before confirmation."
                        : "The dossier page breaks the rumor out of the feed so the next update has a place to land without getting lost in the board."}
                    </p>
                  </div>
                </div>
              </article>
            );
          }) : (
            <PageState
              icon={Repeat2}
              eyebrow="Transfers"
              title="No transfer dossiers matched"
              description={query.trim()
                ? "Try a broader player or club search, or clear the current club filter."
                : "Add transfer watch entries in admin and they will populate the board automatically."}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
