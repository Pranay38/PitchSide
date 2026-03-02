import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, RefreshCw } from "lucide-react";

type WidgetTab = "live" | "table" | "scorers";

interface LeagueConfig {
    name: string;
    flag: string;
    code: string;
}

interface MatchItem {
    id: number;
    utcDate: string;
    status: string;
    homeTeam: { name: string; crest: string };
    awayTeam: { name: string; crest: string };
    score: { home: number | null; away: number | null };
}

interface StandingEntry {
    position: number;
    team: { name: string; crest: string };
    played: number;
    won: number;
    draw: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
}

interface ScorerEntry {
    rank: number;
    player: string;
    team: string;
    goals: number;
    assists: number | null;
    penalties: number;
    played: number | null;
}

const LEAGUES: LeagueConfig[] = [
    { name: "Premier League", flag: "🏴", code: "PL" },
    { name: "La Liga", flag: "🇪🇸", code: "PD" },
    { name: "Serie A", flag: "🇮🇹", code: "SA" },
    { name: "Bundesliga", flag: "🇩🇪", code: "BL1" },
    { name: "Ligue 1", flag: "🇫🇷", code: "FL1" },
    { name: "Champions League", flag: "🏆", code: "CL" },
];

function formatKickoff(utcDate: string): string {
    const date = new Date(utcDate);
    if (Number.isNaN(date.getTime())) return "Unknown time";

    const now = new Date();
    const dateOnly = date.toLocaleDateString();
    const nowOnly = now.toLocaleDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (dateOnly === nowOnly) return `Today, ${time}`;
    if (date.toLocaleDateString() === yesterday.toLocaleDateString()) return `Yesterday, ${time}`;
    if (date.toLocaleDateString() === tomorrow.toLocaleDateString()) return `Tomorrow, ${time}`;
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

function statusLabel(status: string): string {
    if (status === "IN_PLAY" || status === "LIVE") return "LIVE";
    if (status === "PAUSED") return "HT";
    if (status === "FINISHED") return "FT";
    if (status === "SCHEDULED" || status === "TIMED") return "Upcoming";
    return status || "Unknown";
}

function statusClass(status: string): string {
    if (status === "IN_PLAY" || status === "LIVE") {
        return "bg-red-500 text-white animate-pulse";
    }
    if (status === "PAUSED") {
        return "bg-amber-400 text-amber-900";
    }
    if (status === "FINISHED") {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400";
    }
    return "bg-gray-100 text-[#64748B] dark:bg-[#1E293B] dark:text-[#94A3B8]";
}

function matchSortRank(match: MatchItem): number {
    if (match.status === "IN_PLAY" || match.status === "LIVE") return 0;
    if (match.status === "PAUSED") return 1;
    if (match.status === "SCHEDULED" || match.status === "TIMED") return 2;
    return 3;
}

export function LiveScoresWidget() {
    const [activeTab, setActiveTab] = useState<WidgetTab>("live");
    const [selectedLeague, setSelectedLeague] = useState(0);
    const [expanded, setExpanded] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState<string>("");

    const [matches, setMatches] = useState<MatchItem[]>([]);
    const [table, setTable] = useState<StandingEntry[]>([]);
    const [scorers, setScorers] = useState<ScorerEntry[]>([]);

    const league = LEAGUES[selectedLeague];

    const sortedMatches = useMemo(() => {
        return [...matches].sort((a, b) => {
            const rankDiff = matchSortRank(a) - matchSortRank(b);
            if (rankDiff !== 0) return rankDiff;
            return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
        });
    }, [matches]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            if (activeTab === "live") {
                const response = await fetch(`/api/fixtures?competition=${league.code}&mode=recent&offset=0&t=${Date.now()}`);
                if (!response.ok) throw new Error("Could not load live matches.");
                const payload = await response.json();
                setMatches(payload.matches || []);
            } else if (activeTab === "table") {
                const response = await fetch(`/api/standings?competition=${league.code}&t=${Date.now()}`);
                if (!response.ok) throw new Error("Could not load league table.");
                const payload = await response.json();
                setTable(payload.table || []);
            } else {
                const response = await fetch(`/api/standings?competition=${league.code}&view=scorers&limit=20&t=${Date.now()}`);
                if (!response.ok) throw new Error("Could not load top scorers.");
                const payload = await response.json();
                setScorers(payload.scorers || []);
            }

            setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } catch (fetchError: any) {
            setError(fetchError?.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, [activeTab, league.code]);

    useEffect(() => {
        if (!expanded) return;
        fetchData();
    }, [expanded, fetchData]);

    const tabButton = (tab: WidgetTab, label: string, icon: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 text-[12px] font-bold rounded-xl transition-all ${
                activeTab === tab
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-[#64748B] hover:bg-gray-100 dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
            }`}
        >
            <span>{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div
                onClick={() => setExpanded((prev) => !prev)}
                className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent cursor-pointer select-none"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        Live Scores & Stats
                        <span className="ml-2 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live
                        </span>
                    </h3>
                    <div className="flex items-center gap-2">
                        {expanded && (
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    fetchData();
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-[#94A3B8] ${loading ? "animate-spin" : ""}`} />
                            </button>
                        )}
                        {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                    </div>
                </div>
                {!expanded && (
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        {league.flag} {league.name} — Tap to expand
                    </p>
                )}
            </div>

            {expanded && (
                <>
                    <div className="p-3 bg-gray-50/50 dark:bg-[#0B1120]/50 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex gap-1.5 p-1 bg-gray-200/50 dark:bg-[#1E293B] rounded-xl">
                            {tabButton("live", "Live Matches", "🔴")}
                            {tabButton("table", "League Table", "📊")}
                            {tabButton("scorers", "Top Scorers", "⚽")}
                        </div>
                    </div>

                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 flex-wrap">
                        {LEAGUES.map((entry, idx) => (
                            <button
                                key={entry.code}
                                onClick={() => setSelectedLeague(idx)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${
                                    selectedLeague === idx
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                                {entry.flag} {entry.name}
                            </button>
                        ))}
                    </div>

                    <div className="bg-[#0F172A]/0 min-h-[460px] max-h-[560px] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                                <span className="text-xs text-[#94A3B8]">Loading {league.name}...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <p className="text-sm font-semibold text-red-500">{error}</p>
                                <p className="text-xs text-[#94A3B8] mt-2">This widget now uses API data directly (no blocked iframe embeds).</p>
                            </div>
                        ) : activeTab === "live" ? (
                            sortedMatches.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No live or recent matches found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {sortedMatches.map((match) => (
                                        <div key={match.id} className="px-4 py-3">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] text-[#94A3B8] font-medium">{formatKickoff(match.utcDate)}</span>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusClass(match.status)}`}>
                                                    {statusLabel(match.status)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {match.homeTeam.crest && (
                                                        <img
                                                            src={match.homeTeam.crest}
                                                            alt=""
                                                            className="w-4 h-4 object-contain flex-shrink-0"
                                                            onError={(event) => ((event.currentTarget as HTMLImageElement).style.display = "none")}
                                                        />
                                                    )}
                                                    <span className="text-[13px] font-medium text-[#0F172A] dark:text-white truncate">{match.homeTeam.name}</span>
                                                </div>
                                                <span className="text-[13px] font-bold text-[#0F172A] dark:text-white">{match.score.home ?? "-"}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {match.awayTeam.crest && (
                                                        <img
                                                            src={match.awayTeam.crest}
                                                            alt=""
                                                            className="w-4 h-4 object-contain flex-shrink-0"
                                                            onError={(event) => ((event.currentTarget as HTMLImageElement).style.display = "none")}
                                                        />
                                                    )}
                                                    <span className="text-[13px] font-medium text-[#0F172A] dark:text-white truncate">{match.awayTeam.name}</span>
                                                </div>
                                                <span className="text-[13px] font-bold text-[#0F172A] dark:text-white">{match.score.away ?? "-"}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : activeTab === "table" ? (
                            table.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No table data available.</p>
                                </div>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-[#0F172A] z-10">
                                        <tr className="text-[#94A3B8] uppercase tracking-wider text-[10px]">
                                            <th className="text-left py-2.5 px-3 font-semibold w-7">#</th>
                                            <th className="text-left py-2.5 px-1 font-semibold">Team</th>
                                            <th className="text-center py-2.5 px-1 font-semibold w-7">P</th>
                                            <th className="text-center py-2.5 px-1 font-semibold w-7">W</th>
                                            <th className="text-center py-2.5 px-1 font-semibold w-7">D</th>
                                            <th className="text-center py-2.5 px-1 font-semibold w-7">L</th>
                                            <th className="text-center py-2.5 px-1 font-semibold w-9">GD</th>
                                            <th className="text-center py-2.5 px-3 font-semibold w-9">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {table.map((entry) => (
                                            <tr key={entry.position} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="py-2 px-3 font-bold text-[#0F172A] dark:text-white">{entry.position}</td>
                                                <td className="py-2 px-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {entry.team.crest && (
                                                            <img
                                                                src={entry.team.crest}
                                                                alt=""
                                                                className="w-4 h-4 object-contain flex-shrink-0"
                                                                onError={(event) => ((event.currentTarget as HTMLImageElement).style.display = "none")}
                                                            />
                                                        )}
                                                        <span className="font-medium text-[#0F172A] dark:text-white truncate">{entry.team.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-1 text-center text-[#64748B]">{entry.played}</td>
                                                <td className="py-2 px-1 text-center text-[#64748B]">{entry.won}</td>
                                                <td className="py-2 px-1 text-center text-[#64748B]">{entry.draw}</td>
                                                <td className="py-2 px-1 text-center text-[#64748B]">{entry.lost}</td>
                                                <td className="py-2 px-1 text-center">
                                                    <span className={entry.gd > 0 ? "text-[#16A34A] font-semibold" : entry.gd < 0 ? "text-red-500 font-semibold" : "text-[#64748B]"}>
                                                        {entry.gd > 0 ? `+${entry.gd}` : entry.gd}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-center font-bold text-[#0F172A] dark:text-white">{entry.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        ) : scorers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No top scorer data available.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {scorers.map((entry) => (
                                    <div key={`${entry.rank}-${entry.player}-${entry.team}`} className="px-4 py-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center">
                                                {entry.rank}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white truncate">{entry.player}</p>
                                                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">{entry.team}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[13px] font-bold text-[#0F172A] dark:text-white">{entry.goals} G</p>
                                            <p className="text-[10px] text-[#94A3B8]">
                                                {entry.assists ?? 0} A
                                                {entry.penalties > 0 ? ` • ${entry.penalties} pen` : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50/80 dark:bg-[#0B1120]/80 p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-[9px] text-[#94A3B8]">
                            Data source: football-data.org {lastUpdated ? `• Updated ${lastUpdated}` : ""}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
