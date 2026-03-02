import { useState, useEffect, useCallback } from "react";
import { Calendar, Trophy, TrendingUp, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface MatchResult {
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    competition: string;
    utcDate: string;
    homeCrest: string;
    awayCrest: string;
}

interface TopPerformer {
    name: string;
    team: string;
    position: string;
    gwPoints: number;
    totalPoints: number;
    goals: number;
    assists: number;
    bonus: number;
}

interface StandingsEntry {
    position: number;
    team: string;
    crest: string;
    playedGames: number;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalDifference: number;
    league: string;
}

interface DigestData {
    weekLabel: string;
    gameweek: number;
    results: MatchResult[];
    topPerformers: TopPerformer[];
    standings: StandingsEntry[];
}

type DigestTab = "results" | "performers" | "standings";

const LEAGUE_FLAGS: Record<string, string> = {
    "Premier League": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "La Liga": "🇪🇸",
    "Serie A": "🇮🇹",
    "Bundesliga": "🇩🇪",
    "Ligue 1": "🇫🇷",
    "Champions League": "🏆",
};

export function WeeklyDigest() {
    const [data, setData] = useState<DigestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<DigestTab>("results");
    const [expanded, setExpanded] = useState(true);
    const [selectedLeague, setSelectedLeague] = useState("All");

    const fetchDigest = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/weekly-digest?t=${Date.now()}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                setError("Could not load digest");
            }
        } catch {
            setError("Failed to fetch weekly digest");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDigest();
    }, [fetchDigest]);

    const leagueNames = data
        ? [...new Set(
            activeTab === "standings"
                ? data.standings.map((s) => s.league)
                : data.results.map((r) => r.competition)
        )]
        : [];

    const filteredResults = data?.results.filter(
        (r) => selectedLeague === "All" || r.competition === selectedLeague
    ) || [];

    const filteredStandings = data?.standings.filter(
        (s) => selectedLeague === "All" || s.league === selectedLeague
    ) || [];

    // Group results by competition
    const groupedResults: Record<string, MatchResult[]> = {};
    for (const r of filteredResults) {
        if (!groupedResults[r.competition]) groupedResults[r.competition] = [];
        groupedResults[r.competition].push(r);
    }

    // Group standings by league
    const groupedStandings: Record<string, StandingsEntry[]> = {};
    for (const s of filteredStandings) {
        if (!groupedStandings[s.league]) groupedStandings[s.league] = [];
        groupedStandings[s.league].push(s);
    }

    const posColor = (pos: string) => {
        switch (pos) {
            case "GKP": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "DEF": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "MID": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "FWD": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const renderTabBtn = (tab: DigestTab, label: string, Icon: any) => (
        <button
            onClick={() => { setActiveTab(tab); setSelectedLeague("All"); }}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2 text-[11px] font-bold rounded-lg transition-all ${activeTab === tab
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-[#64748B] hover:bg-gray-100 dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                }`}
        >
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );

    return (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 to-transparent cursor-pointer select-none"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-xl">📊</span> Weekly Stat Digest
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchDigest(); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-[#94A3B8] ${loading ? "animate-spin" : ""}`} />
                        </button>
                        {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                    </div>
                </div>
                {data && (
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        {data.weekLabel} {data.gameweek > 0 ? `• GW${data.gameweek}` : ""}
                    </p>
                )}
            </div>

            {expanded && (
                <>
                    {/* Tabs */}
                    <div className="p-3 bg-gray-50/50 dark:bg-[#0B1120]/50 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex gap-1.5 p-1 bg-gray-200/50 dark:bg-[#1E293B] rounded-xl">
                            {renderTabBtn("results", "Results", Calendar)}
                            {renderTabBtn("performers", "Top GW", Trophy)}
                            {renderTabBtn("standings", "Tables", TrendingUp)}
                        </div>
                    </div>

                    {/* League Filter */}
                    {(activeTab === "results" || activeTab === "standings") && leagueNames.length > 1 && (
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 flex-wrap">
                            <button
                                onClick={() => setSelectedLeague("All")}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${selectedLeague === "All"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                All
                            </button>
                            {leagueNames.map((name) => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedLeague(name)}
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${selectedLeague === name
                                            ? "bg-emerald-500 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-gray-700"
                                        }`}
                                >
                                    {LEAGUE_FLAGS[name] || "⚽"} {name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {loading && !data ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-3" />
                                <span className="text-xs font-medium text-[#64748B]">Generating digest...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 px-4">
                                <p className="text-sm text-red-500 font-medium">{error}</p>
                            </div>
                        ) : data ? (
                            <>
                                {/* RESULTS TAB */}
                                {activeTab === "results" && (
                                    <div>
                                        {Object.keys(groupedResults).length === 0 ? (
                                            <p className="text-center text-sm text-[#94A3B8] py-12">No results this week yet</p>
                                        ) : (
                                            Object.entries(groupedResults).map(([comp, matches]) => (
                                                <div key={comp}>
                                                    <div className="px-4 py-2 bg-gray-50 dark:bg-[#1E293B]/50 border-b border-gray-100 dark:border-gray-800">
                                                        <span className="text-[11px] font-bold text-[#0F172A] dark:text-white">
                                                            {LEAGUE_FLAGS[comp] || "⚽"} {comp}
                                                        </span>
                                                    </div>
                                                    {matches.map((m, i) => (
                                                        <div
                                                            key={`${comp}-${i}`}
                                                            className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
                                                        >
                                                            {/* Home */}
                                                            <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                                                                <span className="text-[12px] font-semibold text-[#0F172A] dark:text-white truncate text-right">
                                                                    {m.homeTeam}
                                                                </span>
                                                                {m.homeCrest && (
                                                                    <img src={m.homeCrest} alt="" className="w-5 h-5 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            {/* Score */}
                                                            <div className="flex-shrink-0 w-14 text-center">
                                                                <span className="text-[13px] font-black text-[#0F172A] dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                                                    {m.homeScore ?? "–"} - {m.awayScore ?? "–"}
                                                                </span>
                                                            </div>
                                                            {/* Away */}
                                                            <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                {m.awayCrest && (
                                                                    <img src={m.awayCrest} alt="" className="w-5 h-5 flex-shrink-0" />
                                                                )}
                                                                <span className="text-[12px] font-semibold text-[#0F172A] dark:text-white truncate">
                                                                    {m.awayTeam}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* TOP PERFORMERS TAB */}
                                {activeTab === "performers" && (
                                    <div>
                                        {data.topPerformers.length === 0 ? (
                                            <p className="text-center text-sm text-[#94A3B8] py-12">No gameweek data available</p>
                                        ) : (
                                            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                                {data.topPerformers.map((p, i) => (
                                                    <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                                        {/* Rank */}
                                                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
                                                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">{i + 1}</span>
                                                        </div>
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-[13px] font-bold text-[#0F172A] dark:text-white truncate">{p.name}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${posColor(p.position)}`}>{p.position}</span>
                                                                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium">{p.team}</span>
                                                            </div>
                                                        </div>
                                                        {/* GW Points */}
                                                        <div className="text-right flex-shrink-0">
                                                            <span className="text-lg font-black text-emerald-500">{p.gwPoints}</span>
                                                            <span className="text-[9px] font-bold text-[#94A3B8] ml-0.5">pts</span>
                                                            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                                                {p.goals > 0 && <span className="text-[10px] text-[#64748B]">⚽{p.goals}</span>}
                                                                {p.assists > 0 && <span className="text-[10px] text-[#64748B]">🎯{p.assists}</span>}
                                                                {p.bonus > 0 && <span className="text-[10px] text-[#64748B]">⭐{p.bonus}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STANDINGS TAB */}
                                {activeTab === "standings" && (
                                    <div>
                                        {Object.keys(groupedStandings).length === 0 ? (
                                            <p className="text-center text-sm text-[#94A3B8] py-12">No standings data</p>
                                        ) : (
                                            Object.entries(groupedStandings).map(([league, table]) => (
                                                <div key={league}>
                                                    <div className="px-4 py-2 bg-gray-50 dark:bg-[#1E293B]/50 border-b border-gray-100 dark:border-gray-800">
                                                        <span className="text-[11px] font-bold text-[#0F172A] dark:text-white">
                                                            {LEAGUE_FLAGS[league] || "⚽"} {league}
                                                        </span>
                                                    </div>
                                                    <table className="w-full text-[11px]">
                                                        <thead>
                                                            <tr className="text-[#94A3B8] border-b border-gray-100 dark:border-gray-800">
                                                                <th className="text-left px-4 py-1.5 font-semibold w-6">#</th>
                                                                <th className="text-left py-1.5 font-semibold">Team</th>
                                                                <th className="text-center py-1.5 font-semibold w-8">P</th>
                                                                <th className="text-center py-1.5 font-semibold w-8">W</th>
                                                                <th className="text-center py-1.5 font-semibold w-8">D</th>
                                                                <th className="text-center py-1.5 font-semibold w-8">L</th>
                                                                <th className="text-center py-1.5 font-semibold w-8">GD</th>
                                                                <th className="text-center px-4 py-1.5 font-semibold w-10">Pts</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {table.map((row) => (
                                                                <tr
                                                                    key={`${league}-${row.position}`}
                                                                    className="border-b border-gray-50 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors"
                                                                >
                                                                    <td className="px-4 py-1.5 font-bold text-[#64748B] dark:text-[#94A3B8]">{row.position}</td>
                                                                    <td className="py-1.5 font-semibold text-[#0F172A] dark:text-white flex items-center gap-2">
                                                                        {row.crest && <img src={row.crest} alt="" className="w-4 h-4" />}
                                                                        {row.team}
                                                                    </td>
                                                                    <td className="text-center py-1.5 text-[#64748B] dark:text-[#94A3B8]">{row.playedGames}</td>
                                                                    <td className="text-center py-1.5 text-[#64748B] dark:text-[#94A3B8]">{row.won}</td>
                                                                    <td className="text-center py-1.5 text-[#64748B] dark:text-[#94A3B8]">{row.draw}</td>
                                                                    <td className="text-center py-1.5 text-[#64748B] dark:text-[#94A3B8]">{row.lost}</td>
                                                                    <td className="text-center py-1.5 text-[#64748B] dark:text-[#94A3B8]">
                                                                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                                                    </td>
                                                                    <td className="text-center px-4 py-1.5 font-black text-emerald-600 dark:text-emerald-400">{row.points}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/80 dark:bg-[#0B1120]/80 p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-[10px] text-[#94A3B8]">
                            Europe's Top 5 Leagues • Updated weekly
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
