import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, ExternalLink, RefreshCw } from "lucide-react";

type WindowType = "summer" | "winter";

interface TransferStats {
    available: boolean;
    summary: string;
    league?: string;
    team?: string;
    position?: string;
    starts?: number;
    minutes?: number;
    goals?: number;
    assists?: number;
    cleanSheets?: number;
    points?: number;
    form?: number;
}

interface TransferItem {
    player: string;
    from: string;
    to: string;
    fee: string;
    window: string;
    windowType: WindowType;
    tm_url: string | null;
    stats: TransferStats;
}

interface TransfersData {
    season: string;
    generatedAt: string;
    totals: {
        all: number;
        summer: number;
        winter: number;
        withLiveStats: number;
    };
    windows: {
        summer: TransferItem[];
        winter: TransferItem[];
    };
}

function StatChip({ label }: { label: string }) {
    return (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[#475569] dark:text-[#CBD5E1]">
            {label}
        </span>
    );
}

function TransferWindowColumn({
    title,
    accentClass,
    items,
}: {
    title: string;
    accentClass: string;
    items: TransferItem[];
}) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-[#111827]">
            <div className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${accentClass}`}>
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{title}</h4>
                    <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">{items.length} transfers</span>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">No transfers recorded in this window.</div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[520px] overflow-y-auto">
                    {items.map((item) => (
                        <a
                            key={`${item.player}-${item.from}-${item.to}`}
                            href={item.tm_url || `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(item.player)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h5 className="inline-flex items-center gap-1 text-[13px] font-bold text-[#2563EB] dark:text-[#60A5FA] group-hover:underline">
                                        <span className="truncate">{item.player}</span>
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </h5>
                                    <p className="text-[12px] text-[#475569] dark:text-[#CBD5E1] mt-0.5">
                                        {item.from} <span className="text-[#94A3B8]">→</span> {item.to}
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-md whitespace-nowrap">
                                    {item.fee}
                                </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.stats.league && <StatChip label={item.stats.league} />}
                                {item.stats.team && <StatChip label={item.stats.team} />}
                                {item.stats.position && <StatChip label={item.stats.position} />}
                                {typeof item.stats.goals === "number" && <StatChip label={`${item.stats.goals}G`} />}
                                {typeof item.stats.assists === "number" && <StatChip label={`${item.stats.assists}A`} />}
                                {typeof item.stats.points === "number" && <StatChip label={`${item.stats.points} pts`} />}
                                {typeof item.stats.minutes === "number" && <StatChip label={`${item.stats.minutes} mins`} />}
                            </div>

                            <p className={`text-[11px] mt-2 ${item.stats.available ? "text-accent-theme dark:text-accent-light" : "text-[#64748B] dark:text-[#94A3B8]"}`}>
                                {item.stats.summary}
                            </p>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

export function SeasonTransfersBoard() {
    const [data, setData] = useState<TransfersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchTransfers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/season-transfers?t=${Date.now()}`);
            if (!res.ok) {
                setError("Could not load transfers.");
                return;
            }
            const json = await res.json();
            setData(json);
        } catch {
            setError("Failed to fetch transfer data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransfers();
        const interval = setInterval(fetchTransfers, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchTransfers]);

    return (
        <section className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm bg-white dark:bg-[#1E293B]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-accent-theme/10 to-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-accent-theme" />
                            Current Season Transfers
                        </h3>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                            {data ? `${data.season} · ${data.totals.all} tracked transfers · ${data.totals.withLiveStats} with live stats` : "Fetching current-season transfers"}
                        </p>
                    </div>
                    <button
                        onClick={fetchTransfers}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Refresh transfers"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#94A3B8] ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {loading && !data ? (
                <div className="px-4 py-10 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">Loading transfer windows...</div>
            ) : error && !data ? (
                <div className="px-4 py-10 text-center text-sm text-red-500">{error}</div>
            ) : data ? (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-50/40 dark:bg-[#0F172A]/30">
                    <TransferWindowColumn
                        title="Summer Window"
                        accentClass="bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/20"
                        items={data.windows.summer}
                    />
                    <TransferWindowColumn
                        title="Winter Window"
                        accentClass="bg-gradient-to-r from-sky-50 to-transparent dark:from-sky-900/20"
                        items={data.windows.winter}
                    />
                </div>
            ) : null}
        </section>
    );
}
