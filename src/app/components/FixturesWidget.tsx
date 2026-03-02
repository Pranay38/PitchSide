import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, Loader2, ChevronLeft, ChevronRight, TableProperties, Swords, X, CircleDot, AlertTriangle, ArrowDownUp } from "lucide-react";

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

interface MatchDetail {
    id: number;
    utcDate: string;
    status: string;
    homeTeam: { name: string; crest: string };
    awayTeam: { name: string; crest: string };
    score: {
        halfTime: { home: number | null; away: number | null };
        fullTime: { home: number | null; away: number | null };
        extraTime: { home: number | null; away: number | null };
        penalties: { home: number | null; away: number | null };
    };
    goals: { minute: number; extraTime: number | null; team: string; scorer: string; assist: string | null; type: string }[];
    bookings: { minute: number; team: string; player: string; card: string }[];
    substitutions: { minute: number; team: string; playerIn: string; playerOut: string }[];
    referee: string | null;
    venue: string | null;
    competition: { name: string; emblem: string };
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
        case "IN_PLAY": case "LIVE":
            return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">LIVE</span>;
        case "PAUSED":
            return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-yellow-500 rounded-full">HT</span>;
        case "FINISHED":
            return <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-full">FT</span>;
        default: return null;
    }
}

/* ── Match Stats Panel ── */
function MatchStatsPanel({ matchId, onClose }: { matchId: number; onClose: () => void }) {
    const [detail, setDetail] = useState<MatchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/match?id=${matchId}`);
                if (res.ok) setDetail(await res.json());
                else setError("Could not load match details.");
            } catch { setError("Failed to fetch match details."); }
            setLoading(false);
        })();
    }, [matchId]);

    if (loading) return (
        <div className="p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#16A34A] mr-2" />
            <span className="text-sm text-[#64748B]">Loading stats...</span>
        </div>
    );

    if (error || !detail) return (
        <div className="p-6 text-center">
            <p className="text-sm text-red-500">{error || "No data"}</p>
            <button onClick={onClose} className="mt-2 text-xs text-[#16A34A] hover:underline">Close</button>
        </div>
    );

    const homeGoals = detail.goals.filter(g => g.team === detail.homeTeam.name || g.team.includes(detail.homeTeam.name.split(" ")[0]));
    const awayGoals = detail.goals.filter(g => !homeGoals.includes(g));

    return (
        <div className="bg-white dark:bg-[#1E293B] border-t border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#0F172A]/80 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-[#0F172A] dark:text-white">Match Details</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <X className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
            </div>

            {/* Score */}
            <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1">
                        {detail.homeTeam.crest && <img src={detail.homeTeam.crest} alt="" className="w-8 h-8 object-contain" />}
                        <span className="text-sm font-bold text-[#0F172A] dark:text-white">{detail.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4">
                        <span className="text-2xl font-black text-[#0F172A] dark:text-white">{detail.score.fullTime.home ?? "-"}</span>
                        <span className="text-lg text-[#94A3B8]">-</span>
                        <span className="text-2xl font-black text-[#0F172A] dark:text-white">{detail.score.fullTime.away ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-sm font-bold text-[#0F172A] dark:text-white">{detail.awayTeam.name}</span>
                        {detail.awayTeam.crest && <img src={detail.awayTeam.crest} alt="" className="w-8 h-8 object-contain" />}
                    </div>
                </div>

                {/* Score breakdown */}
                <div className="flex justify-center gap-4 text-[10px] text-[#94A3B8] mb-4">
                    {detail.score.halfTime.home !== null && (
                        <span>HT: {detail.score.halfTime.home}-{detail.score.halfTime.away}</span>
                    )}
                    {detail.score.extraTime.home !== null && (
                        <span>ET: {detail.score.extraTime.home}-{detail.score.extraTime.away}</span>
                    )}
                    {detail.score.penalties.home !== null && (
                        <span>Pens: {detail.score.penalties.home}-{detail.score.penalties.away}</span>
                    )}
                </div>

                {/* Goals */}
                {detail.goals.length > 0 && (
                    <div className="mb-4">
                        <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <CircleDot className="w-3 h-3" /> Goals
                        </h5>
                        <div className="space-y-1.5">
                            {detail.goals.map((goal, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#16A34A] font-bold w-8">{goal.minute}'{goal.extraTime ? `+${goal.extraTime}` : ""}</span>
                                        <span className="text-[#0F172A] dark:text-white font-medium">
                                            {goal.scorer}
                                            {goal.type === "PENALTY" && <span className="text-[#94A3B8] ml-1">(pen)</span>}
                                            {goal.type === "OWN" && <span className="text-red-500 ml-1">(o.g.)</span>}
                                        </span>
                                    </div>
                                    {goal.assist && (
                                        <span className="text-[#94A3B8] text-[11px]">Assist: {goal.assist}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bookings */}
                {detail.bookings.length > 0 && (
                    <div className="mb-4">
                        <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Cards
                        </h5>
                        <div className="space-y-1">
                            {detail.bookings.map((b, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-[#64748B] font-bold w-8">{b.minute}'</span>
                                    <span className={`w-3 h-4 rounded-sm flex-shrink-0 ${b.card === "RED_CARD" ? "bg-red-500" : "bg-yellow-400"}`} />
                                    <span className="text-[#0F172A] dark:text-white">{b.player}</span>
                                    <span className="text-[#94A3B8] text-[11px]">({b.team})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Substitutions */}
                {detail.substitutions.length > 0 && (
                    <div className="mb-3">
                        <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <ArrowDownUp className="w-3 h-3" /> Substitutions
                        </h5>
                        <div className="space-y-1">
                            {detail.substitutions.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-[#64748B] font-bold w-8">{s.minute}'</span>
                                    <span className="text-[#16A34A]">↑ {s.playerIn}</span>
                                    <span className="text-red-400">↓ {s.playerOut}</span>
                                    <span className="text-[#94A3B8] text-[11px]">({s.team})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#94A3B8] pt-2 border-t border-gray-100 dark:border-gray-800">
                    {detail.referee && <span>🏁 Referee: {detail.referee}</span>}
                    {detail.venue && <span>🏟️ {detail.venue}</span>}
                    <span>📅 {new Date(detail.utcDate).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
            </div>
        </div>
    );
}

/* ── Match Row Component ── */
function MatchRow({ match, onSelect, isSelected }: { match: Match; onSelect: (id: number) => void; isSelected: boolean }) {
    const isClickable = match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED";

    return (
        <div>
            <div
                onClick={() => isClickable && onSelect(isSelected ? -1 : match.id)}
                className={`px-4 py-3 transition-colors ${isClickable
                        ? "cursor-pointer hover:bg-[#16A34A]/5 dark:hover:bg-[#16A34A]/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    } ${isSelected ? "bg-[#16A34A]/5 dark:bg-[#16A34A]/10" : ""}`}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#94A3B8] dark:text-gray-500 font-medium">{formatMatchTime(match.utcDate)}</span>
                    <div className="flex items-center gap-2">
                        {isClickable && !isSelected && <span className="text-[10px] text-[#16A34A] font-medium">Tap for stats</span>}
                        {getStatusBadge(match.status)}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.homeTeam.name}</span>
                        </div>
                        <span className={`text-sm font-bold min-w-[20px] text-right ${isClickable ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>
                            {match.score.home !== null ? match.score.home : "-"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.awayTeam.name}</span>
                        </div>
                        <span className={`text-sm font-bold min-w-[20px] text-right ${isClickable ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>
                            {match.score.away !== null ? match.score.away : "-"}
                        </span>
                    </div>
                </div>
            </div>
            {isSelected && <MatchStatsPanel matchId={match.id} onClose={() => onSelect(-1)} />}
        </div>
    );
}

/* ── Main Widget ── */
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
    const [selectedMatch, setSelectedMatch] = useState<number>(-1);

    const fetchMatches = useCallback(async () => {
        setLoading(true);
        setError("");
        setSelectedMatch(-1);
        try {
            const res = await fetch(`/api/fixtures?competition=${activeComp}&mode=${viewMode}&offset=${offset}`);
            if (res.ok) { const data = await res.json(); setMatches(data.matches || []); }
            else { const errData = await res.json().catch(() => ({})); setError(errData.error || "Failed to load fixtures."); }
        } catch { setError("Could not load fixtures."); }
        setLoading(false);
    }, [activeComp, viewMode, offset]);

    const fetchStandings = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/standings?competition=${activeComp}`);
            if (res.ok) { const data = await res.json(); setStandings(data.table || []); setKnockouts(data.knockouts || []); }
            else { const errData = await res.json().catch(() => ({})); setError(errData.error || "Failed to load standings."); }
        } catch { setError("Could not load standings."); }
        setLoading(false);
    }, [activeComp]);

    useEffect(() => {
        if (tab === "fixtures") fetchMatches();
        else fetchStandings();
    }, [tab, fetchMatches, fetchStandings]);

    const switchComp = (code: string) => {
        setActiveComp(code);
        setOffset(0);
        setViewMode("recent");
        setSelectedMatch(-1);
        if (code !== "CL" && tab === "knockouts") setTab("fixtures");
    };

    const goNext = () => {
        setSelectedMatch(-1);
        if (viewMode === "recent") { setViewMode("next"); setOffset(0); }
        else if (viewMode === "next") { setOffset(o => o + 3); }
        else if (viewMode === "prev") { if (offset <= 1) { setViewMode("recent"); setOffset(0); } else { setOffset(o => Math.max(0, o - 3)); } }
    };

    const goPrev = () => {
        setSelectedMatch(-1);
        if (viewMode === "recent") { setViewMode("prev"); setOffset(1); }
        else if (viewMode === "prev") { setOffset(o => o + 3); }
        else if (viewMode === "next") { if (offset <= 0) { setViewMode("recent"); setOffset(0); } else { setOffset(o => Math.max(0, o - 3)); } }
    };

    const getViewLabel = () => {
        if (viewMode === "recent") return "Recent Results";
        if (viewMode === "next") return "Upcoming Fixtures";
        return "Past Results";
    };

    const knockoutsByStage = knockouts.reduce((acc, m) => { const s = m.stage || "OTHER"; if (!acc[s]) acc[s] = []; acc[s].push(m); return acc; }, {} as Record<string, KnockoutMatch[]>);
    const stageOrder = ["PLAYOFF", "LAST_16", "ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];
    const orderedStages = stageOrder.filter(s => knockoutsByStage[s]);
    const isCL = activeComp === "CL";

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-[#16A34A]" />
                    Scores & Fixtures
                </h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button onClick={() => setTab("fixtures")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === "fixtures" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white"}`}>Fixtures</button>
                    <button onClick={() => setTab("table")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "table" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white"}`}><TableProperties className="w-3 h-3" />Table</button>
                    {isCL && <button onClick={() => setTab("knockouts")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "knockouts" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white"}`}><Swords className="w-3 h-3" />Knockouts</button>}
                </div>
            </div>

            {/* Competition Tabs */}
            <div className="flex overflow-x-auto px-3 py-2 gap-1 border-b border-gray-100 dark:border-gray-800 scrollbar-thin">
                {COMPETITIONS.map(comp => (
                    <button key={comp.code} onClick={() => switchComp(comp.code)} className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${activeComp === comp.code ? "bg-[#16A34A] text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{comp.name}</button>
                ))}
            </div>

            {/* Navigation */}
            {tab === "fixtures" && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A]/50">
                    <button onClick={goPrev} className="flex items-center gap-1 text-xs font-medium text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors"><ChevronLeft className="w-4 h-4" />Previous</button>
                    <span className="text-xs font-semibold text-[#0F172A] dark:text-white">{getViewLabel()}</span>
                    <button onClick={goNext} className="flex items-center gap-1 text-xs font-medium text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors">Next<ChevronRight className="w-4 h-4" /></button>
                </div>
            )}

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-[#64748B]"><Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Loading...</span></div>
                ) : error ? (
                    <div className="text-center py-10 px-4"><Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B] dark:text-gray-400">{error}</p></div>
                ) : tab === "fixtures" ? (
                    matches.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm text-[#64748B] dark:text-gray-400">No matches found for this period.</p>
                            <p className="text-xs text-[#94A3B8] mt-1">Try navigating to a different date range.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {matches.map(match => (
                                <MatchRow key={match.id} match={match} onSelect={setSelectedMatch} isSelected={selectedMatch === match.id} />
                            ))}
                        </div>
                    )
                ) : tab === "table" ? (
                    standings.length === 0 ? (
                        <div className="text-center py-10 px-4"><TableProperties className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B] dark:text-gray-400">No standings available.</p></div>
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
                                {standings.map(entry => (
                                    <tr key={entry.position} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-2 px-3 font-bold text-[#0F172A] dark:text-white">{entry.position}</td>
                                        <td className="py-2 px-1"><div className="flex items-center gap-2">{entry.team.crest && <img src={entry.team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}<span className="font-medium text-[#0F172A] dark:text-white truncate">{entry.team.name}</span></div></td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.played}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.won}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.draw}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B] dark:text-gray-400">{entry.lost}</td>
                                        <td className="py-2 px-1 text-center hidden sm:table-cell"><span className={entry.gd > 0 ? "text-[#16A34A]" : entry.gd < 0 ? "text-red-500" : "text-[#64748B] dark:text-gray-400"}>{entry.gd > 0 ? `+${entry.gd}` : entry.gd}</span></td>
                                        <td className="py-2 px-3 text-center font-bold text-[#0F172A] dark:text-white">{entry.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    orderedStages.length === 0 ? (
                        <div className="text-center py-10 px-4"><Swords className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B] dark:text-gray-400">No knockout fixtures available yet.</p><p className="text-xs text-[#94A3B8] mt-1">Knockout rounds will appear here once drawn.</p></div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {orderedStages.map(stage => (
                                <div key={stage}>
                                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A]/80 sticky top-0 z-10">
                                        <h4 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-2"><Swords className="w-3.5 h-3.5" />{STAGE_LABELS[stage] || stage.replace(/_/g, " ")}</h4>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {knockoutsByStage[stage].map(match => (
                                            <MatchRow key={match.id} match={match} onSelect={setSelectedMatch} isSelected={selectedMatch === match.id} />
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
