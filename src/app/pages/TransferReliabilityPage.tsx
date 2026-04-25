"use client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Repeat2, Search, ShieldQuestion } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { getClubByName } from "../data/clubs";
import { getSiteSettings, getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import { buildTransferReliabilityBoard, type TransferReliabilityEntry } from "../lib/transferReliability";
import { formatTransferWatchAmount } from "../lib/transferWatch";
import {
  buildTransferSourceSnapshot,
  getTransferSourcesForDossier,
  type TransferSourceArticle,
} from "../lib/transferSources";

export function TransferReliabilityPage() {
  const initialSettings = getSiteSettings();
  const [entries, setEntries] = useState<TransferReliabilityEntry[]>(() => (
    buildTransferReliabilityBoard(initialSettings.transferWatch)
  ));
  const [sources, setSources] = useState<TransferSourceArticle[]>(() => initialSettings.transferSources);
  const [loading, setLoading] = useState(entries.length === 0);
  const [query, setQuery] = useState("");
  const [filterClub, setFilterClub] = useState("");

  useEffect(() => {
    let isMounted = true;

    getSiteSettingsAsync()
      .then((settings) => {
        if (!isMounted) return;
        setEntries(buildTransferReliabilityBoard(settings.transferWatch));
        setSources(settings.transferSources);
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

  const sourceSnapshotByDossier = useMemo(() => {
    const next = new Map<string, ReturnType<typeof buildTransferSourceSnapshot>>();
    for (const entry of entries) {
      next.set(
        entry.dossierSlug,
        buildTransferSourceSnapshot(getTransferSourcesForDossier(sources, entry)),
      );
    }
    return next;
  }, [entries, sources]);

  const clubOptions = useMemo(() => {
    const next = new Set<string>();
    for (const entry of entries) {
      next.add(entry.club);
      if (entry.fromClub) next.add(entry.fromClub);
    }
    return Array.from(next).sort((left, right) => left.localeCompare(right));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesQuery = !needle || [
        entry.player,
        entry.club,
        entry.fromClub || "",
        entry.boardLabel,
        entry.reliabilityLabel,
      ].some((value) => value.toLowerCase().includes(needle));
      const matchesClub = !filterClub || entry.club === filterClub || entry.fromClub === filterClub;
      return matchesQuery && matchesClub;
    });
  }, [entries, filterClub, query]);

  const stats = useMemo(() => {
    const sourceBacked = entries.filter((entry) => (sourceSnapshotByDossier.get(entry.dossierSlug)?.coverageCount || 0) > 0).length;
    return {
      dossiers: entries.length,
      strongSignals: entries.filter((entry) => entry.reliabilityScore >= 75).length,
      confirmed: entries.filter((entry) => entry.status === "confirmed").length,
      sourceBacked,
    };
  }, [entries, sourceSnapshotByDossier]);

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Transfer Watch"
        description="Track transfer dossiers, reliability signals, and linked external coverage from one board."
        url="https://pitchside-orcin.vercel.app/transfers"
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        <section className="editorial-hero relative overflow-hidden rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#16A34A]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
              <Repeat2 className="h-4 w-4" />
              Transfer Watch
            </p>
            <h1 className="mt-5 text-4xl font-black font-outfit text-[#0F172A] dark:text-white md:text-5xl">
              Source-backed dossiers for the biggest moves in the market
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#475569] dark:text-gray-300">
              Follow the live board, open a dossier for the full club-to-club case file, and see which transfer stories already have linked external coverage behind them.
            </p>
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-[#0F172A]/80">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Active dossiers</p>
              <p className="mt-2 text-3xl font-black text-[#0F172A] dark:text-white">{stats.dossiers}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-[#0F172A]/80">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Strong signals</p>
              <p className="mt-2 text-3xl font-black text-[#0F172A] dark:text-white">{stats.strongSignals}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-[#0F172A]/80">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Confirmed</p>
              <p className="mt-2 text-3xl font-black text-[#0F172A] dark:text-white">{stats.confirmed}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-[#0F172A]/80">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">Linked coverage</p>
              <p className="mt-2 text-3xl font-black text-[#0F172A] dark:text-white">{stats.sourceBacked}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-800 dark:bg-[#111827]/90">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search player, club, or signal..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-11 py-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#0F172A] dark:text-white"
              />
            </div>

            <select
              value={filterClub}
              onChange={(event) => setFilterClub(event.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#0F172A] dark:text-white"
            >
              <option value="">All clubs</option>
              {clubOptions.map((club) => (
                <option key={club} value={club}>{club}</option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <section className="mt-8 grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[220px] animate-pulse rounded-[2rem] bg-gray-200 dark:bg-gray-800" />
            ))}
          </section>
        ) : filteredEntries.length === 0 ? (
          <section className="mt-8">
            <PageState
              icon={Repeat2}
              eyebrow="Transfer Watch"
              title="No dossiers match that filter"
              description="Try a different player, club, or signal to reopen the board."
            />
          </section>
        ) : (
          <section className="mt-8 grid gap-5">
            {filteredEntries.map((entry) => {
              const fromClubInfo = entry.fromClub ? getClubByName(entry.fromClub) : null;
              const toClubInfo = getClubByName(entry.club);
              const sourceSnapshot = sourceSnapshotByDossier.get(entry.dossierSlug) || buildTransferSourceSnapshot([]);

              return (
                <article
                  key={entry.id}
                  className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-[#111827]"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${entry.status === "confirmed" ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}>
                          {entry.status}
                        </span>
                        <span className="rounded-full bg-slate-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          {entry.reliabilityLabel}
                        </span>
                        <span className="rounded-full bg-[#0F172A]/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:bg-white/5 dark:text-gray-300">
                          {entry.reliabilityScore}/99
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-4">
                        {entry.playerImageUrl ? (
                          <img
                            src={entry.playerImageUrl}
                            alt={entry.player}
                            className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm dark:border-[#0F172A]"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#0F172A]">
                            <ShieldQuestion className="h-7 w-7 text-[#94A3B8]" />
                          </div>
                        )}

                        <div>
                          <h2 className="text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                            {entry.player}
                          </h2>
                          <p className="mt-1 text-sm font-semibold text-[#64748B] dark:text-gray-400">
                            {entry.boardLabel}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-4">
                        {entry.fromClub && (
                          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#0F172A]">
                            {fromClubInfo?.logo ? (
                              <img src={fromClubInfo.logo} alt={entry.fromClub} className="h-8 w-8 object-contain" />
                            ) : (
                              <ShieldQuestion className="h-5 w-5 text-[#94A3B8]" />
                            )}
                            <span className="text-sm font-bold text-rose-500">{entry.fromClub}</span>
                          </div>
                        )}
                        <ArrowRight className="hidden h-4 w-4 text-[#94A3B8] md:block" />
                        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-[#0F172A]">
                          {toClubInfo?.logo ? (
                            <img src={toClubInfo.logo} alt={entry.club} className="h-8 w-8 object-contain" />
                          ) : (
                            <ShieldQuestion className="h-5 w-5 text-[#94A3B8]" />
                          )}
                          <span className="text-sm font-bold text-[#16A34A]">{entry.club}</span>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-[#0F172A] dark:border-gray-800 dark:bg-[#0F172A] dark:text-white">
                          {formatTransferWatchAmount(entry)}
                        </div>
                      </div>

                      {(entry.punchyLine || entry.myTake) && (
                        <div className="mt-5 rounded-2xl border border-[#16A34A]/10 bg-[#16A34A]/5 p-4">
                          <p className="text-sm leading-6 text-[#0F172A] dark:text-white">
                            {entry.punchyLine || entry.myTake}
                          </p>
                        </div>
                      )}
                    </div>

                    <aside className="w-full xl:max-w-[320px]">
                      <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-[#0F172A]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#16A34A]">External desk</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-white px-3 py-3 dark:bg-[#111827]">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Coverage</p>
                            <p className="mt-1 text-2xl font-black text-[#0F172A] dark:text-white">{sourceSnapshot.coverageCount}</p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-3 dark:bg-[#111827]">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Consensus</p>
                            <p className="mt-1 text-lg font-black text-[#0F172A] dark:text-white">{sourceSnapshot.consensusLabel}</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                          {sourceSnapshot.coverageCount > 0
                            ? `${sourceSnapshot.confirmingCount} supporting links and ${sourceSnapshot.contradictingCount} pushback signals are attached so far.`
                            : "No external links attached yet. This dossier is still running on the internal editorial board alone."}
                        </p>
                        <Link
                          to={`/transfers/${entry.dossierSlug}`}
                          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-4 py-2.5 text-sm font-bold text-white"
                        >
                          Open dossier
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </aside>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
