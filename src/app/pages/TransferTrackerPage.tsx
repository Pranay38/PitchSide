"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Repeat2, CheckCircle2, ArrowRight, ShieldQuestion, Search, SlidersHorizontal, X } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PageState } from "../components/PageState";
import { Tweet } from "../components/ui/tweet";
import type { TransferRecord, TransferStatus } from "../components/admin/AdminTransferTrackerTab";
import { getClubByName } from "../data/clubs";

const STATUS_STAGES: TransferStatus[] = ["rumour", "talks", "medical", "done"];
const STATUS_LABELS = ["Rumour", "Talks", "Medical", "Done Deal!"];

const STATUS_COLORS: Record<TransferStatus, string> = {
    rumour: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    talks: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    medical: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    done: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20",
};

export function TransferTrackerPage() {
    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [filterClub, setFilterClub] = useState("");

    const fetchTransfers = useCallback(async () => {
        try {
            const res = await fetch("/api/transfers");
            if (res.ok) {
                const data = await res.json();
                setTransfers(data);
            }
        } catch (e) {
            console.error("Failed to fetch transfers:", e);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120]">
                <Header />
                <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-12">
                    <div className="h-64 rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </main>
                <Footer />
            </div>
        );
    }

    // Unique clubs for filter
    const allClubs = useMemo(() => {
        const clubs = new Set<string>();
        transfers.forEach((e) => {
            if (e.toClub) clubs.add(e.toClub);
            if (e.fromClub) clubs.add(e.fromClub);
        });
        return Array.from(clubs).sort();
    }, [transfers]);

    const filteredTransfers = useMemo(() => {
        let out = transfers;
        if (query) {
            const q = query.toLowerCase();
            out = out.filter(
                (e) =>
                    e.player.toLowerCase().includes(q) ||
                    e.toClub.toLowerCase().includes(q) ||
                    (e.fromClub && e.fromClub.toLowerCase().includes(q))
            );
        }
        if (filterClub) {
            out = out.filter(
                (e) => e.toClub === filterClub || e.fromClub === filterClub
            );
        }
        return out;
    }, [transfers, query, filterClub]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            <SEO 
                title="Live Transfer Tracker" 
                description="Track the latest football transfers progressing from rumours and talks all the way to completed deals." 
            />
            <Header />
            
            <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-12 md:py-20">
                <div className="mb-12 text-center max-w-2xl mx-auto">
                    <p className="inline-flex items-center justify-center gap-2 rounded-full bg-[#16A34A]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#16A34A] mb-6">
                        <Repeat2 className="w-4 h-4" />
                        Live Tracker
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white mb-6 leading-tight">
                        The Deal Board
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
                        Follow the biggest moves of the window. Watch deals progress in real-time from early whispers through to medicals and official announcements.
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

                {filteredTransfers.length === 0 ? (
                    <PageState 
                        icon={Repeat2}
                        eyebrow="Window Closed"
                        title="No active deals currently"
                        description="Check back when the transfer window opens for live tracking or try a different filter."
                    />
                ) : (
                    <div className="grid gap-6">
                        {filteredTransfers.map(t => {
                            const statusIndex = STATUS_STAGES.indexOf(t.status);
                            const isDone = t.status === "done";
                            
                            const fromClubInfo = getClubByName(t.fromClub);
                            const toClubInfo = getClubByName(t.toClub);

                            return (
                                <div 
                                    key={t.id} 
                                    className={`relative bg-white dark:bg-[#1E293B] rounded-[2rem] p-6 lg:p-8 border ${isDone ? 'border-[#16A34A]/30 shadow-[#16A34A]/5' : 'border-gray-200 dark:border-gray-800'} shadow-sm flex flex-col lg:flex-row gap-8 lg:items-center overflow-hidden transition-all hover:shadow-lg`}
                                >
                                    {isDone && (
                                        <div className="absolute -right-12 -top-12 text-emerald-500/5 rotate-12 pointer-events-none">
                                            <CheckCircle2 className="w-64 h-64" />
                                        </div>
                                    )}
                                    
                                    {/* Info Panel */}
                                    <div className="flex-1 relative z-10">
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs uppercase font-black tracking-widest ${STATUS_COLORS[t.status]}`}>
                                                {STATUS_LABELS[statusIndex]}
                                            </span>
                                            {isDone && (
                                                <span className="text-emerald-500 flex items-center gap-1 text-sm font-bold">
                                                    <CheckCircle2 className="w-4 h-4" /> Official
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mb-4">
                                            {t.playerImageUrl && (
                                                <img src={t.playerImageUrl} alt={t.player} className="w-12 h-12 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                                            )}
                                            <h2 className="text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                                                {t.player}
                                            </h2>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#0F172A] px-4 py-2 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    {fromClubInfo?.logo ? (
                                                        <img src={fromClubInfo.logo} alt={t.fromClub} className="w-5 h-5 object-contain" />
                                                    ) : (
                                                        <ShieldQuestion className="w-5 h-5 text-gray-400" />
                                                    )}
                                                    <span className="text-rose-500 whitespace-nowrap">{t.fromClub}</span>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                                <div className="flex items-center gap-2">
                                                    {toClubInfo?.logo ? (
                                                        <img src={toClubInfo.logo} alt={t.toClub} className="w-5 h-5 object-contain" />
                                                    ) : (
                                                        <ShieldQuestion className="w-5 h-5 text-gray-400" />
                                                    )}
                                                    <span className="text-emerald-500 whitespace-nowrap">{t.toClub}</span>
                                                </div>
                                            </div>
                                            
                                            {t.fee && (
                                                <div className="bg-gray-50 dark:bg-[#0F172A] px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300">
                                                    Fee: <span className="font-bold text-[#0F172A] dark:text-white">{t.fee}</span>
                                                </div>
                                            )}
                                            
                                            {(() => {
                                                const extractTweetId = (text: string) => {
                                                    const match = text.match(/(?:x\.com|twitter\.com)\/(?:[a-zA-Z0-9_]+)\/status\/([0-9]+)/);
                                                    return match ? match[1] : null;
                                                };
                                                const tweetId = t.source ? extractTweetId(t.source) : null;
                                                
                                                if (tweetId) {
                                                    return (
                                                        <div className="w-full mt-4 flex items-center justify-center">
                                                            <div className="scale-90 origin-top lg:origin-center bg-white dark:bg-transparent rounded-xl">
                                                                <Tweet id={tweetId} />
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return t.source ? (
                                                    <div className="text-gray-400">
                                                        Reported by {t.source}
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                    
                                    {/* Tracker Visual Panel */}
                                    <div className="w-full lg:w-96 relative z-10">
                                        <div className="bg-gray-50 dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <div className="relative pt-6 pb-2">
                                                {/* Track Background */}
                                                <div className="absolute top-8 left-0 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                                
                                                {/* Track Fill */}
                                                <div 
                                                    className="absolute top-8 left-0 h-1.5 bg-gradient-to-r from-emerald-400 to-[#16A34A] rounded-full transition-all duration-1000 ease-out" 
                                                    style={{ width: `${(statusIndex / (STATUS_STAGES.length - 1)) * 100}%` }}
                                                />
                                                
                                                {/* Milestones */}
                                                <div className="relative flex justify-between">
                                                    {STATUS_STAGES.map((stage, idx) => {
                                                        const isCompleted = statusIndex >= idx;
                                                        const isCurrent = statusIndex === idx;
                                                        const label = STATUS_LABELS[idx] || "Unknown";
                                                        
                                                        return (
                                                            <div key={stage} className="flex flex-col items-center">
                                                                <div 
                                                                    className={`w-5 h-5 rounded-full z-10 border-4 transition-all duration-500 delay-100 ${
                                                                        isCompleted 
                                                                            ? "bg-[#16A34A] border-emerald-100 dark:border-emerald-900/50" 
                                                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                                    } ${isCurrent ? 'scale-125 shadow-md' : ''}`} 
                                                                />
                                                                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${
                                                                    isCurrent ? "text-[#16A34A] dark:text-emerald-400" : isCompleted ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                                                                }`}>
                                                                    {label.split(" ")[0]}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Total count */}
                <p className="mt-8 text-center text-xs text-gray-400 font-semibold">
                    {filteredTransfers.length} transfer {filteredTransfers.length === 1 ? "rumour" : "rumours"} tracked
                    {(query || filterClub) ? " (filtered)" : ""}
                </p>
            </main>
            
            <Footer />
        </div>
    );
}
