"use client";

import { useEffect, useMemo, useState } from "react";
import { Radio, Search, SlidersHorizontal, X } from "lucide-react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SEO } from "../components/SEO";
import { Link } from "@/lib/router-compat";
import { getTransferWatchEntriesAsync } from "../lib/siteSettingsStorage";
import { buildTransferReliabilityBoard, type TransferReliabilityEntry } from "../lib/transferReliability";
import {
    buildTransferDossierSlug,
    formatTransferWatchAmount,
    getTransferTierLabel,
} from "../lib/transferWatch";
import { getClubByName } from "../data/clubs";

// ── Kanban columns ────────────────────────────────────────────────────────────

type KanbanStage = "monitoring" | "in-talks" | "medical" | "done-deal";

const STAGES: { id: KanbanStage; label: string; emoji: string; color: string; bg: string; border: string }[] = [
    {
        id: "monitoring",
        label: "Monitoring",
        emoji: "🔭",
        color: "text-sky-500",
        bg: "bg-sky-500/5",
        border: "border-sky-500/20",
    },
    {
        id: "in-talks",
        label: "In Talks",
        emoji: "🤝",
        color: "text-amber-500",
        bg: "bg-amber-500/5",
        border: "border-amber-500/20",
    },
    {
        id: "medical",
        label: "Medical",
        emoji: "🏥",
        color: "text-purple-500",
        bg: "bg-purple-500/5",
        border: "border-purple-500/20",
    },
    {
        id: "done-deal",
        label: "Done Deal",
        emoji: "✅",
        color: "text-[#16A34A]",
        bg: "bg-[#16A34A]/5",
        border: "border-[#16A34A]/20",
    },
];

// Map TransferWatchEntry tier/status → Kanban stage
function entryToStage(entry: TransferReliabilityEntry): KanbanStage {
    if (entry.status === "confirmed") return "done-deal";
    const tier = entry.tier ?? 3;
    if (tier <= 2) return "medical";
    if (tier === 3) return "in-talks";
    return "monitoring";
}

// ── Card ──────────────────────────────────────────────────────────────────────

function WhisperCard({ entry }: { entry: TransferReliabilityEntry }) {
    const toClub = getClubByName(entry.club);
    const fromClub = entry.fromClub ? getClubByName(entry.fromClub) : null;
    const slug = buildTransferDossierSlug(entry);

    return (
        <Link
            to={`/transfers/${slug}`}
            className="group block p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] hover:border-[#16A34A]/30 hover:shadow-md transition-all duration-200"
        >
            {/* Player row */}
            <div className="flex items-center gap-3 mb-3">
                {entry.playerImageUrl ? (
                    <img
                        src={entry.playerImageUrl}
                        alt={entry.player}
                        className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center text-sm font-black text-gray-400">
                        {entry.player.charAt(0)}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-sm font-black text-[#0F172A] dark:text-white truncate group-hover:text-[#16A34A] transition-colors">
                        {entry.player}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {getTransferTierLabel(entry.tier, entry.status)}
                    </p>
                </div>
            </div>

            {/* Club flow */}
            <div className="flex items-center gap-2 text-xs">
                {fromClub ? (
                    <>
                        <span className="flex items-center gap-1 text-rose-400 font-bold truncate">
                            {fromClub.logo ? (
                                <img src={fromClub.logo} alt={entry.fromClub} className="w-4 h-4 object-contain" />
                            ) : null}
                            {entry.fromClub}
                        </span>
                        <span className="text-gray-400 flex-shrink-0">→</span>
                    </>
                ) : null}
                <span className="flex items-center gap-1 text-emerald-400 font-bold truncate">
                    {toClub?.logo ? (
                        <img src={toClub.logo} alt={entry.club} className="w-4 h-4 object-contain" />
                    ) : null}
                    {entry.club}
                </span>
            </div>

            {/* Fee + reliability */}
            <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-400">
                    {formatTransferWatchAmount(entry)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    {entry.reliabilityLabel}
                </span>
            </div>

            {entry.punchyLine && (
                <p className="mt-2 text-[11px] leading-4 text-gray-500 dark:text-gray-400 italic line-clamp-2">
                    "{entry.punchyLine}"
                </p>
            )}
        </Link>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function WhisperNetworkPage() {
    const [entries, setEntries] = useState<TransferReliabilityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [filterClub, setFilterClub] = useState("");

    useEffect(() => {
        getTransferWatchEntriesAsync()
            .then((raw) => {
                setEntries(buildTransferReliabilityBoard(raw));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Unique clubs for filter
    const allClubs = useMemo(() => {
        const clubs = new Set<string>();
        entries.forEach((e) => {
            clubs.add(e.club);
            if (e.fromClub) clubs.add(e.fromClub);
        });
        return Array.from(clubs).sort();
    }, [entries]);

    const filtered = useMemo(() => {
        let out = entries;
        if (query) {
            const q = query.toLowerCase();
            out = out.filter(
                (e) =>
                    e.player.toLowerCase().includes(q) ||
                    e.club.toLowerCase().includes(q) ||
                    (e.fromClub && e.fromClub.toLowerCase().includes(q))
            );
        }
        if (filterClub) {
            out = out.filter(
                (e) => e.club === filterClub || e.fromClub === filterClub
            );
        }
        return out;
    }, [entries, query, filterClub]);

    // Group by Kanban stage
    const byStage = useMemo(() => {
        const map: Record<KanbanStage, TransferReliabilityEntry[]> = {
            monitoring: [],
            "in-talks": [],
            medical: [],
            "done-deal": [],
        };
        for (const entry of filtered) {
            map[entryToStage(entry)].push(entry);
        }
        return map;
    }, [filtered]);

    return (
        <div className="page-atmosphere min-h-screen transition-colors duration-300">
            <SEO
                title="The Whisper Network — Live Transfer Rumour Board"
                description="Track every transfer rumour from Monitoring to Done Deal. The PitchSide classified Kanban for the transfer window."
                url="https://thetouchlinedribble.in/whisper-network"
            />
            <Header />

            <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
                {/* Hero */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Radio className="w-4 h-4 text-[#16A34A] animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                            LIVE INTELLIGENCE
                        </span>
                    </div>
                    <h1 className="text-4xl font-black font-outfit text-[#0F172A] dark:text-white md:text-5xl">
                        The Whisper Network
                    </h1>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-400 max-w-xl">
                        Every rumour, ranked and tracked through the transfer pipeline. From scouting to announcement.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search player or club…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#16A34A]"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={filterClub}
                            onChange={(e) => setFilterClub(e.target.value)}
                            className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white focus:outline-none focus:border-[#16A34A] appearance-none cursor-pointer"
                        >
                            <option value="">All clubs</option>
                            {allClubs.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {(query || filterClub) && (
                        <button
                            onClick={() => { setQuery(""); setFilterClub(""); }}
                            className="text-xs font-bold text-gray-400 hover:text-[#16A34A] transition-colors self-center"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Kanban board */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {STAGES.map((s) => (
                            <div key={s.id} className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                        {STAGES.map((stage) => {
                            const cards = byStage[stage.id];
                            return (
                                <div key={stage.id} className={`rounded-2xl border ${stage.border} ${stage.bg} p-4`}>
                                    {/* Column header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{stage.emoji}</span>
                                            <span className={`text-xs font-black uppercase tracking-[0.18em] ${stage.color}`}>
                                                {stage.label}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                            {cards.length}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div className="space-y-3">
                                        {cards.length > 0 ? (
                                            cards.map((entry) => (
                                                <WhisperCard key={entry.id} entry={entry} />
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-xs text-gray-400 font-semibold">
                                                No rumours here yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Total count */}
                {!loading && (
                    <p className="mt-6 text-center text-xs text-gray-400 font-semibold">
                        {filtered.length} transfer {filtered.length === 1 ? "rumour" : "rumours"} tracked
                        {(query || filterClub) ? " (filtered)" : ""}
                    </p>
                )}
            </main>

            <Footer />
        </div>
    );
}
