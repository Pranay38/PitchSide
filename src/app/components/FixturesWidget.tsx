import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, Loader2, ChevronLeft, ChevronRight, TableProperties, Swords } from "lucide-react";

interface Match {
    id: number;
    utcDate: string;
    status: string;
    homeTeam: { name: string; crest: string };
    awayTeam: { name: string; crest: string };
    score: { home: number | null; away: number | null };
}

interface KnockoutMatch extends Match {
    stage: string;
    aggregateHome: number | null;
    aggregateAway: number | null;
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

const COMPETITIONS = [
    { code: "PL", name: "Premier League" },
    { code: "CL", name: "Champions League" },
    { code: "PD", name: "La Liga" },
    { code: "BL1", name: "Bundesliga" },
    { code: "SA", name: "Serie A" },
];

type ViewMode = "recent" | "next" | "prev";
type Tab = "fixtures" | "table" | "knockouts";

const STAGE_LABELS: Record<string, string> = {
    PLAYOFF: "Playoff Round",
    LAST_16: "Round of 16",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter-Finals",
    SEMI_FINALS: "Semi-Finals",
    FINAL: "Final",
};

function formatMatchTime(utcDate: string): string {
    const d = new Date(utcDate);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

function formatKnockoutDate(utcDate: string): string {
    const d = new Date(utcDate);
    return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function getStatusBadge(status: string) {
    switch (status) {
        case "IN_PLAY":
        case "LIVE":
            return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">LIVE</span>;
        case "PAUSED":
            return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-yellow-500 rounded-full">HT</span>;
        case "FINISHED":
            return <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-full">FT</span>;
        case "SCHEDULED":
        case "TIMED":
            return null;
        default:
            return null;
    }
}

export function FixturesWidget() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [standings, setStandings] = useState<StandingEntry[]>([]);
    const [knockouts, setKnockouts] = useState<KnockoutMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeComp, setActiveComp] = useState("PL");
    const [viewMode, setViewMode] = useState<ViewMode>("recent");
    const [offset, setOffset] = useState(0);
    const [tab, setTab] = useState<Tab>("fixtures");

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/fixtures?competition=${activeComp}&mode=${viewMode}&offset=${offset}`);
            if (res.ok) {
                const data = await res.json();
                setMatches(data.matches || []);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.error || "Failed to load fixtures.");
            }
        } catch {
            setError("Could not load fixtures.");
        }
        setLoading(false);
    }, [activeComp, viewMode, offset]);

    const fetchStandings = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/standings?competition=${activeComp}`);
            if (res.ok) {
                const data = await res.json();
                setStandings(data.table || []);
                setKnockouts(data.knockouts || []);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.error || "Failed to load standings.");
            }
        } catch {
            setError("Could not load standings.");
        }
        setLoading(false);
    }, [activeComp]);

    useEffect(() => {
        if (tab === "fixtures") fetchMatches();
        else fetchStandings(); // fetches both standings + knockouts
    }, [tab, fetchMatches, fetchStandings]);

    const switchComp = (code: string) => {
        setActiveComp(code);
        setOffset(0);
        setViewMode("recent");
        // Reset tab — if switching to CL keep whatever tab, otherwise reset to fixtures
        if (code !== "CL" && tab === "knockouts") setTab("fixtures");
    };

    const goNext = () => {
        if (viewMode === "recent") { setViewMode("next"); setOffset(0); }
        else if (viewMode === "next") { setOffset((o) => o + 3); }
        else if (viewMode === "prev") {
            if (offset <= 1) { setViewMode("recent"); setOffset(0); }
            else { setOffset((o) => Math.max(0, o - 3)); }
        }
    };

    const goPrev = () => {
        if (viewMode === "recent") { setViewMode("prev"); setOffset(1); }
        else if (viewMode === "prev") { setOffset((o) => o + 3); }
        else if (viewMode === "next") {
            if (offset <= 0) { setViewMode("recent"); setOffset(0); }
            else { setOffset((o) => Math.max(0, o - 3)); }
        }
    };

    const getViewLabel = () => {
        if (viewMode === "recent") return "Recent Results";
        if (viewMode === "next") return "Upcoming Fixtures";
        return "Past Results";
    };

    // Group knockout matches by stage
    const knockoutsByStage = knockouts.reduce((acc, m) => {
        const stage = m.stage || "OTHER";
        if (!acc[stage]) acc[stage] = [];
        acc[stage].push(m);
        return acc;
    }, {} as Record<string, KnockoutMatch[]>);

    // Order stages logically
    const stageOrder = ["PLAYOFF", "LAST_16", "ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];
    const orderedStages = stageOrder.filter((s) => knockoutsByStage[s]);

    const isCL = activeComp === "CL";

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-[#16A34A]" />
                    Scores & Fixtures
                </h3>
                {/* Tab toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button
                        onClick={() => setTab("fixtures")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === "fixtures"
                                ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm"
                                : "text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white"
                            }`}
                    >
                        Fixtures
                    </button>
                    <button
                        onClick={() => setTab("table")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "table"
                                ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm"
                                : "text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white"
                            }`}
                    >
                        <TableProperties className="w-3 h-3" />
                        Table
                    </button>
                    {isCL && (
                        <button
                            onClick={() => setTab("knockouts")}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "knockouts"
                                    ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm"
                                    : "text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white"
                                }`}
                        >
                            <Swords className="w-3 h-3" />
                            Knockouts
                        </button>
                    )}
                </div>
            </div>

            {/* Competition Tabs */}
            <div className="flex overflow-x-auto px-3 py-2 gap-1 border-b border-gray-100 dark:border-gray-800 scrollbar-thin">
                {COMPETITIONS.map((comp) => (
                    <button
                        key={comp.code}
                        onClick={() => switchComp(comp.code)}
                        className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${activeComp === comp.code
                                ? "bg-[#16A34A] text-white shadow-sm"
                                : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                    >
                        {comp.name}
                    </button>
                ))}
            </div>

            {/* Navigation bar (fixtures tab only) */}
            {tab === "fixtures" && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A]/50">
                    <button onClick={goPrev} className="flex items-center gap-1 text-xs font-medium text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-xs font-semibold text-[#0F172A] dark:text-white">{getViewLabel()}</span>
                    <button onClick={goNext} className="flex items-center gap-1 text-xs font-medium text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="max-h-[450px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-[#64748B]">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm">Loading...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 px-4">
                        <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                        <p className="text-sm text-[#64748B] dark:text-gray-400">{error}</p>
                    </div>
                ) : tab === "fixtures" ? (
                    /* ── Fixtures View ── */
                    matches.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm text-[#64748B] dark:text-gray-400">No matches found for this period.</p>
                            <p className="text-xs text-[#94A3B8] mt-1">Try navigating to a different date range.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {matches.map((match) => (
                                <div key={match.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] text-[#94A3B8] dark:text-gray-500 font-medium">{formatMatchTime(match.utcDate)}</span>
                                        {getStatusBadge(match.status)}
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                                                <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.homeTeam.name}</span>
                                            </div>
                                            <span className={`text-sm font-bold min-w-[20px] text-right ${match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED" ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>
                                                {match.score.home !== null ? match.score.home : "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                                                <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.awayTeam.name}</span>
                                            </div>
                                            <span className={`text-sm font-bold min-w-[20px] text-right ${match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED" ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>
                                                {match.score.away !== null ? match.score.away : "-"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : tab === "table" ? (
                    /* ── League Table View ── */
                    standings.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <TableProperties className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm text-[#64748B] dark:text-gray-400">No standings available.</p>
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-[#0F172A]">
                                <tr className="text-[#94A3B8] dark:text-gray-500 uppercase tracking-wider">
                                    <th className="text-left py-2.5 px-3 font-semibold w-8">#</th>
                                    <th className="text-left py-2.5 px-1 font-semibold">Team</th>
                                    <th className="text-center py-2.5 px-1 font-semibold w-8">P</th>
                                    <th className="text-center py-2.5 px-1 font-semibold w-8">W</th>
                                    <th className="text-center py-2.5 px-1 font-semibold w-8">D</th>
                                    <th className="text-center py-2.5 px-1 font-semibold w-8">L</th>
                                    <th className="text-center py-2.5 px-1 font-semibold w-10 hidden sm:table-cell">GD</th>
                                    <th className="text-center py-2.5 px-3 font-semibold w-10">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {standings.map((entry) => (
                                    <tr key={entry.position} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-2 px-3 font-bold text-[#0F172A] dark:text-white">{entry.position}</td>
                                        <td className="py-2 px-1">
                                            <div className="flex items-center gap-2">
                                                {entry.team.crest && <img src={entry.team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                                                <span className="font-medium text-[#0F172A] dark:text-white truncate">{entry.team.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.played}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.won}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.draw}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.lost}</td>
                                        <td className="py-2 px-1 text-center hidden sm:table-cell">
                                            <span className={entry.gd > 0 ? "text-[#16A34A]" : entry.gd < 0 ? "text-red-500" : "text-[#64748B] dark:text-gray-400"}>
                                                {entry.gd > 0 ? `+${entry.gd}` : entry.gd}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-center font-bold text-[#0F172A] dark:text-white">{entry.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    /* ── Knockouts View (CL only) ── */
                    orderedStages.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <Swords className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm text-[#64748B] dark:text-gray-400">No knockout fixtures available yet.</p>
                            <p className="text-xs text-[#94A3B8] mt-1">Knockout rounds will appear here once drawn.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {orderedStages.map((stage) => (
                                <div key={stage}>
                                    {/* Stage Header */}
                                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A]/80 sticky top-0 z-10">
                                        <h4 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-2">
                                            <Swords className="w-3.5 h-3.5" />
                                            {STAGE_LABELS[stage] || stage.replace(/_/g, " ")}
                                        </h4>
                                    </div>
                                    {/* Matches in this stage */}
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {knockoutsByStage[stage].map((match) => (
                                            <div key={match.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] text-[#94A3B8] dark:text-gray-500 font-medium">
                                                        {formatKnockoutDate(match.utcDate)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {match.aggregateHome !== null && match.aggregateAway !== null && match.status === "FINISHED" && (
                                                            <span className="text-[10px] text-[#64748B] dark:text-gray-400 font-medium">
                                                                Agg: {match.aggregateHome}-{match.aggregateAway}
                                                            </span>
                                                        )}
                                                        {getStatusBadge(match.status)}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                                                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.homeTeam.name}</span>
                                                        </div>
                                                        <span className={`text-sm font-bold min-w-[20px] text-right ${match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED" ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>
                                                            {match.score.home !== null ? match.score.home : "-"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                                                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.awayTeam.name}</span>
                                                        </div>
                                                        <span className={`text-sm font-bold min-w-[20px] text-right ${match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED" ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>
                                                            {match.score.away !== null ? match.score.away : "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
