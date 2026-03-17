import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Filter, Repeat2, ShieldCheck } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useClubPreference } from "../hooks/useClubPreference";
import { getTransferWatchEntriesAsync } from "../lib/siteSettingsStorage";
import { buildTransferReliabilityBoard, type TransferReliabilityEntry } from "../lib/transferReliability";
import { formatTransferWatchAmount, getTransferTopicLabel } from "../lib/transferWatch";
import { getFollowedTransfers, toggleFollowedTransfer } from "../lib/libraryStorage";
import { toast } from "sonner";

export function TransferReliabilityPage() {
  const { favoriteClub } = useClubPreference();
  const [entries, setEntries] = useState<TransferReliabilityEntry[]>([]);
  const [followedTransfers, setFollowedTransfers] = useState<string[]>([]);
  const [clubFilter, setClubFilter] = useState("all");

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

    setFollowedTransfers(getFollowedTransfers());
    return () => {
      isMounted = false;
    };
  }, []);

  const clubs = useMemo(() => Array.from(new Set(entries.map((entry) => entry.club))).sort(), [entries]);
  const visibleEntries = useMemo(() => (
    clubFilter === "all" ? entries : entries.filter((entry) => entry.club === clubFilter)
  ), [entries, clubFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title="Transfer Reliability Board"
        description="A cleaner market board with confidence scores, reliability tiers, and alert follow buttons."
        url="https://pitchside-orcin.vercel.app/transfers"
      />
      <Header favoriteClub={favoriteClub} />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <section className="mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-3">Transfer Market</p>
          <h1 className="text-3xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white">
            Transfer Reliability Board
          </h1>
          <p className="text-base text-[#64748B] dark:text-gray-400 max-w-3xl mt-3">
            Instead of dumping rumors into one feed, this board scores how much conviction each item deserves right now.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to="/alerts"
              className="px-4 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold hover:bg-[#15803d]"
            >
              Open Alert Center
            </Link>
            <Link
              to="/"
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-[#0F172A] dark:text-white hover:border-[#16A34A]/30"
            >
              Back to homepage
            </Link>
          </div>
        </section>

        <section className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] p-3 inline-flex items-center gap-3">
            <Filter className="w-4 h-4 text-[#16A34A]" />
            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="bg-transparent text-sm text-[#0F172A] dark:text-white outline-none"
            >
              <option value="all">All clubs</option>
              {clubs.map((club) => (
                <option key={club} value={club}>{club}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-[#64748B] dark:text-gray-400">
            {visibleEntries.length} market item{visibleEntries.length !== 1 ? "s" : ""} scored
          </p>
        </section>

        <section className="space-y-4">
          {visibleEntries.length > 0 ? visibleEntries.map((entry) => {
            const followed = followedTransfers.some((topic) => topic === entry.topic);
            return (
              <div key={entry.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.18em] ${entry.status === "confirmed" ? "bg-[#16A34A]/10 text-[#16A34A]" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"}`}>
                        {entry.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.18em] ${entry.reliabilityScore >= 75 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-slate-500/10 text-slate-600 dark:text-slate-300"}`}>
                        {entry.reliabilityLabel}
                      </span>
                    </div>
                    {(() => {
                        const badge = getSourceBadge(entry.rationale);
                        if (!badge) return null;
                        return (
                          <div className="mt-3 flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md bg-opacity-10 font-bold text-[10px] uppercase tracking-wider ${badge.color}">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            {badge.label}
                          </div>
                        );
                    })()}
                    
                    <h2 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white">{entry.player}</h2>
                    <p className="text-sm text-[#16A34A] font-bold mt-1">{entry.club}</p>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-3">
                      {entry.boardLabel} · {formatTransferWatchAmount(entry)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start lg:items-end gap-3">
                    <div className="rounded-2xl bg-[#0F172A] text-white px-5 py-4 min-w-[160px]">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Confidence</p>
                      <p className="text-4xl font-black font-outfit mt-2">{entry.reliabilityScore}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = toggleFollowedTransfer(entry.topic);
                        setFollowedTransfers(getFollowedTransfers());
                        toast.success(next ? `Following ${getTransferTopicLabel(entry)} alerts` : "Transfer alert removed");
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold border ${followed
                        ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                        : "border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white hover:border-[#16A34A]/30"
                      }`}
                    >
                      {followed ? "Following Alert" : "Follow Transfer"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 mt-5">
                  <div className="rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white">Reliability read</p>
                    </div>
                    <div className="h-2.5 rounded-full bg-white dark:bg-[#1F2937] overflow-hidden">
                      <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${entry.reliabilityScore}%` }} />
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8] mb-3">Why it scores this way</p>
                    <div className="relative pl-4 space-y-4 before:absolute before:inset-y-2 before:left-[7px] before:w-[2px] before:bg-gray-200 dark:before:bg-gray-800">
                      {entry.rationale.map((line, index) => (
                        <div key={line} className="relative">
                          <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-[#16A34A] border-2 border-white dark:border-[#111827]" />
                          <div className="bg-white dark:bg-[#0F172A] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                             <div className="flex items-center gap-2 mb-1">
                               <Clock className="w-3 h-3 text-gray-400" />
                               <span className="text-[10px] font-bold text-gray-400 uppercase">Update {entry.rationale.length - index}</span>
                             </div>
                             <p className="text-sm text-[#475569] dark:text-gray-300 leading-relaxed">{line}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-[#0F172A]/60 p-6 text-sm text-[#64748B] dark:text-gray-400">
              No transfer watch items are loaded yet. Add them in admin and the board will score them automatically.
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
