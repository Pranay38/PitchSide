import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, Loader2, ChevronLeft, ChevronRight, TableProperties, Swords, X } from "lucide-react";

interface Match {
    id: number;
    utcDate: string;
    status: string;
    homeTeam: { name: string; crest: string };
    awayTeam: { name: string; crest: string };
    score: { home: number | null; away: number | null };
    competition?: string; // competition code
}

interface KnockoutMatch extends Match {
    stage: string;
    aggregateHome: number | null;
    aggregateAway: number | null;
}

interface MatchStat { label: string; home: string | number; away: string | number; }
interface MatchEvent { time: number; extraTime: number | null; team: string; teamLogo: string; player: string; assist: string | null; type: string; detail: string; }
interface MatchDetail {
    fixture: { venue: string | null; city: string | null; referee: string | null; status: string };
    homeTeam: { name: string; logo: string };
    awayTeam: { name: string; logo: string };
    score: {
        home: number | null; away: number | null;
        halfTime: { home: number | null; away: number | null };
        fullTime: { home: number | null; away: number | null };
        extraTime: { home: number | null; away: number | null };
        penalty: { home: number | null; away: number | null };
    };
    statistics: MatchStat[];
    events: MatchEvent[];
}

interface StandingEntry {
    position: number;
    team: { name: string; crest: string };
    played: number; won: number; draw: number; lost: number;
    gf: number; ga: number; gd: number; points: number;
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
    PLAYOFF: "Playoff Round", LAST_16: "Round of 16", ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter-Finals", SEMI_FINALS: "Semi-Finals", FINAL: "Final",
};

function formatMatchTime(utcDate: string): string {
    const d = new Date(utcDate);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

function getStatusBadge(status: string) {
    switch (status) {
        case "IN_PLAY": case "LIVE": return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">LIVE</span>;
        case "PAUSED": return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-yellow-500 rounded-full">HT</span>;
        case "FINISHED": return <span className="px-2 py-0.5 text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-full">FT</span>;
        default: return null;
    }
}

/* ────────────────────────────────
   Stat Bar Component
   ──────────────────────────────── */
function StatBar({ label, home, away }: MatchStat) {
    const homeNum = typeof home === "string" ? parseInt(home) || 0 : home;
    const awayNum = typeof away === "string" ? parseInt(away) || 0 : away;
    const total = homeNum + awayNum || 1;
    const homePercent = (homeNum / total) * 100;

    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-[#0F172A] dark:text-white">{home}</span>
                <span className="text-[#94A3B8] text-[11px]">{label}</span>
                <span className="font-semibold text-[#0F172A] dark:text-white">{away}</span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div
                    className="bg-[#16A34A] rounded-l-full transition-all"
                    style={{ width: `${homePercent}%` }}
                />
                <div
                    className="bg-blue-500 rounded-r-full transition-all"
                    style={{ width: `${100 - homePercent}%` }}
                />
            </div>
        </div>
    );
}

/* ────────────────────────────────
   Match Stats Panel
   ──────────────────────────────── */
function MatchStatsPanel({ match, competitionCode, onClose }: {
    match: Match;
    competitionCode: string;
    onClose: () => void;
}) {
    const [detail, setDetail] = useState<MatchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const matchDate = new Date(match.utcDate).toISOString().split("T")[0];
                const params = new URLSearchParams({
                    home: match.homeTeam.name,
                    away: match.awayTeam.name,
                    date: matchDate,
                    competition: competitionCode,
                });
                const res = await fetch(`/api/match?${params}`);
                if (res.ok) {
                    setDetail(await res.json());
                } else {
                    const errData = await res.json().catch(() => ({}));
                    setError(errData.error || "Could not load match details.");
                }
            } catch {
                setError("Failed to fetch match details.");
            }
            setLoading(false);
        })();
    }, [match, competitionCode]);

    if (loading) return (
        <div className="p-6 flex items-center justify-center bg-gray-50 dark:bg-[#0F172A]/50 border-t border-gray-200 dark:border-gray-700">
            <Loader2 className="w-5 h-5 animate-spin text-[#16A34A] mr-2" />
            <span className="text-sm text-[#64748B]">Loading match stats...</span>
        </div>
    );

    if (error || !detail) return (
        <div className="p-4 bg-gray-50 dark:bg-[#0F172A]/50 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-[#64748B]">{error || "No data available"}</p>
            <button onClick={onClose} className="mt-2 text-xs text-[#16A34A] hover:underline">Close</button>
        </div>
    );

    const goals = detail.events.filter(e => e.type === "Goal");
    const cards = detail.events.filter(e => e.type === "Card");
    const subs = detail.events.filter(e => e.type === "subst");

    return (
        <div className="bg-white dark:bg-[#1E293B] border-t-2 border-[#16A34A]/30">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#16A34A]/5 to-transparent dark:from-[#16A34A]/10 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Match Stats</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <X className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
            </div>

            <div className="px-4 py-4">
                {/* Score Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 flex-1">
                        {detail.homeTeam.logo && <img src={detail.homeTeam.logo} alt="" className="w-8 h-8 object-contain" />}
                        <span className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">{detail.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-3 px-4">
                        <span className="text-3xl font-black text-[#0F172A] dark:text-white">{detail.score.home ?? "-"}</span>
                        <span className="text-xl text-[#94A3B8] font-light">–</span>
                        <span className="text-3xl font-black text-[#0F172A] dark:text-white">{detail.score.away ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight text-right">{detail.awayTeam.name}</span>
                        {detail.awayTeam.logo && <img src={detail.awayTeam.logo} alt="" className="w-8 h-8 object-contain" />}
                    </div>
                </div>

                {/* Score line */}
                <div className="flex justify-center gap-4 text-[10px] text-[#94A3B8] mb-5">
                    {detail.score.halfTime.home !== null && <span>HT: {detail.score.halfTime.home}–{detail.score.halfTime.away}</span>}
                    {detail.score.extraTime.home !== null && <span>ET: {detail.score.extraTime.home}–{detail.score.extraTime.away}</span>}
                    {detail.score.penalty.home !== null && <span>Pens: {detail.score.penalty.home}–{detail.score.penalty.away}</span>}
                </div>

                {/* Goals */}
                {goals.length > 0 && (
                    <div className="mb-5 bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl p-3">
                        <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">⚽ Goals</h5>
                        <div className="space-y-2">
                            {goals.map((g, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className="text-[#16A34A] font-bold w-10 flex-shrink-0">{g.time}'{g.extraTime ? `+${g.extraTime}` : ""}</span>
                                    <div className="flex-1">
                                        <span className="font-semibold text-[#0F172A] dark:text-white">{g.player}</span>
                                        {g.detail === "Penalty" && <span className="text-[#94A3B8] ml-1">(pen)</span>}
                                        {g.detail === "Own Goal" && <span className="text-red-500 ml-1">(o.g.)</span>}
                                        {g.assist && <span className="text-[#94A3B8] ml-1">• Assist: {g.assist}</span>}
                                    </div>
                                    <span className="text-[10px] text-[#94A3B8] flex-shrink-0">{g.team}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Statistics Bars */}
                {detail.statistics.length > 0 && (
                    <div className="mb-5">
                        <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">📊 Statistics</h5>
                        {detail.statistics.map((stat, i) => (
                            <StatBar key={i} {...stat} />
                        ))}
                    </div>
                )}

                {/* Cards */}
                {cards.length > 0 && (
                    <div className="mb-5 bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl p-3">
                        <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">🟨 Cards</h5>
                        <div className="space-y-1.5">
                            {cards.map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-[#64748B] font-bold w-10">{c.time}'</span>
                                    <span className={`w-3 h-4 rounded-sm flex-shrink-0 ${c.detail.includes("Red") ? "bg-red-500" : "bg-yellow-400"}`} />
                                    <span className="text-[#0F172A] dark:text-white font-medium">{c.player}</span>
                                    <span className="text-[#94A3B8] text-[11px]">({c.team})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Substitutions */}
                {subs.length > 0 && (
                    <div className="mb-4 bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl p-3">
                        <h5 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">🔄 Substitutions</h5>
                        <div className="space-y-1.5">
                            {subs.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="text-[#64748B] font-bold w-10">{s.time}'</span>
                                    <span className="text-[#16A34A] font-medium">↑ {s.player}</span>
                                    {s.assist && <span className="text-red-400">↓ {s.assist}</span>}
                                    <span className="text-[#94A3B8] text-[11px]">({s.team})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#94A3B8] pt-3 border-t border-gray-100 dark:border-gray-800">
                    {detail.fixture.referee && <span>🏁 {detail.fixture.referee}</span>}
                    {detail.fixture.venue && <span>🏟️ {detail.fixture.venue}{detail.fixture.city ? `, ${detail.fixture.city}` : ""}</span>}
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────
   Match Row Component
   ──────────────────────────────── */
function MatchRow({ match, competitionCode, onSelect, isSelected }: {
    match: Match; competitionCode: string; onSelect: (id: number) => void; isSelected: boolean;
}) {
    const isClickable = match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED";
    return (
        <div>
            <div
                onClick={() => isClickable && onSelect(isSelected ? -1 : match.id)}
                className={`px-4 py-3 transition-colors ${isClickable ? "cursor-pointer hover:bg-[#16A34A]/5 dark:hover:bg-[#16A34A]/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"} ${isSelected ? "bg-[#16A34A]/5 dark:bg-[#16A34A]/10" : ""}`}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#94A3B8] dark:text-gray-500 font-medium">{formatMatchTime(match.utcDate)}</span>
                    <div className="flex items-center gap-2">
                        {isClickable && !isSelected && <span className="text-[10px] text-[#16A34A] font-medium">Tap for stats →</span>}
                        {getStatusBadge(match.status)}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.homeTeam.name}</span>
                        </div>
                        <span className={`text-sm font-bold min-w-[20px] text-right ${isClickable ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>{match.score.home !== null ? match.score.home : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => (e.currentTarget.style.display = "none")} />}
                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{match.awayTeam.name}</span>
                        </div>
                        <span className={`text-sm font-bold min-w-[20px] text-right ${isClickable ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>{match.score.away !== null ? match.score.away : "-"}</span>
                    </div>
                </div>
            </div>
            {isSelected && <MatchStatsPanel match={match} competitionCode={competitionCode} onClose={() => onSelect(-1)} />}
        </div>
    );
}

/* ────────────────────────────────
   Main Widget
   ──────────────────────────────── */
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
    const [selectedMatch, setSelectedMatch] = useState(-1);

    const fetchMatches = useCallback(async () => {
        setLoading(true); setError(""); setSelectedMatch(-1);
        try {
            const res = await fetch(`/api/fixtures?competition=${activeComp}&mode=${viewMode}&offset=${offset}`);
            if (res.ok) { setMatches((await res.json()).matches || []); }
            else { setError((await res.json().catch(() => ({}))).error || "Failed to load."); }
        } catch { setError("Could not load fixtures."); }
        setLoading(false);
    }, [activeComp, viewMode, offset]);

    const fetchStandings = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const res = await fetch(`/api/standings?competition=${activeComp}`);
            if (res.ok) { const d = await res.json(); setStandings(d.table || []); setKnockouts(d.knockouts || []); }
            else { setError((await res.json().catch(() => ({}))).error || "Failed to load."); }
        } catch { setError("Could not load standings."); }
        setLoading(false);
    }, [activeComp]);

    useEffect(() => { if (tab === "fixtures") fetchMatches(); else fetchStandings(); }, [tab, fetchMatches, fetchStandings]);

    const switchComp = (code: string) => { setActiveComp(code); setOffset(0); setViewMode("recent"); setSelectedMatch(-1); if (code !== "CL" && tab === "knockouts") setTab("fixtures"); };
    const goNext = () => { setSelectedMatch(-1); if (viewMode === "recent") { setViewMode("next"); setOffset(0); } else if (viewMode === "next") { setOffset(o => o + 3); } else { if (offset <= 1) { setViewMode("recent"); setOffset(0); } else { setOffset(o => Math.max(0, o - 3)); } } };
    const goPrev = () => { setSelectedMatch(-1); if (viewMode === "recent") { setViewMode("prev"); setOffset(1); } else if (viewMode === "prev") { setOffset(o => o + 3); } else { if (offset <= 0) { setViewMode("recent"); setOffset(0); } else { setOffset(o => Math.max(0, o - 3)); } } };
    const getViewLabel = () => viewMode === "recent" ? "Recent Results" : viewMode === "next" ? "Upcoming Fixtures" : "Past Results";

    const knockoutsByStage = knockouts.reduce((acc, m) => { const s = m.stage || "OTHER"; if (!acc[s]) acc[s] = []; acc[s].push(m); return acc; }, {} as Record<string, KnockoutMatch[]>);
    const orderedStages = ["PLAYOFF", "LAST_16", "ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"].filter(s => knockoutsByStage[s]);
    const isCL = activeComp === "CL";

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-[#16A34A]" /> Scores & Fixtures
                </h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button onClick={() => setTab("fixtures")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === "fixtures" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400"}`}>Fixtures</button>
                    <button onClick={() => setTab("table")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "table" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400"}`}><TableProperties className="w-3 h-3" />Table</button>
                    {isCL && <button onClick={() => setTab("knockouts")} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "knockouts" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400"}`}><Swords className="w-3 h-3" />Knockouts</button>}
                </div>
            </div>

            {/* Competition Tabs */}
            <div className="flex overflow-x-auto px-3 py-2 gap-1 border-b border-gray-100 dark:border-gray-800 scrollbar-thin">
                {COMPETITIONS.map(c => (
                    <button key={c.code} onClick={() => switchComp(c.code)} className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${activeComp === c.code ? "bg-[#16A34A] text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{c.name}</button>
                ))}
            </div>

            {/* Nav */}
            {tab === "fixtures" && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A]/50">
                    <button onClick={goPrev} className="flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#16A34A] transition-colors"><ChevronLeft className="w-4 h-4" />Previous</button>
                    <span className="text-xs font-semibold text-[#0F172A] dark:text-white">{getViewLabel()}</span>
                    <button onClick={goNext} className="flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#16A34A] transition-colors">Next<ChevronRight className="w-4 h-4" /></button>
                </div>
            )}

            {/* Content */}
            <div className="max-h-[550px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-[#64748B]"><Loader2 className="w-5 h-5 animate-spin mr-2" /><span className="text-sm">Loading...</span></div>
                ) : error ? (
                    <div className="text-center py-10 px-4"><Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">{error}</p></div>
                ) : tab === "fixtures" ? (
                    matches.length === 0 ? (
                        <div className="text-center py-10 px-4"><Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">No matches found.</p><p className="text-xs text-[#94A3B8] mt-1">Try a different date range.</p></div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {matches.map(m => <MatchRow key={m.id} match={m} competitionCode={activeComp} onSelect={setSelectedMatch} isSelected={selectedMatch === m.id} />)}
                        </div>
                    )
                ) : tab === "table" ? (
                    standings.length === 0 ? (
                        <div className="text-center py-10 px-4"><TableProperties className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">No standings available.</p></div>
                    ) : (
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-[#0F172A]">
                                <tr className="text-[#94A3B8] uppercase tracking-wider">
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
                                {standings.map(e => (
                                    <tr key={e.position} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="py-2 px-3 font-bold text-[#0F172A] dark:text-white">{e.position}</td>
                                        <td className="py-2 px-1"><div className="flex items-center gap-2">{e.team.crest && <img src={e.team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={ev => ((ev.currentTarget as HTMLImageElement).style.display = "none")} />}<span className="font-medium text-[#0F172A] dark:text-white truncate">{e.team.name}</span></div></td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.played}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.won}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.draw}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.lost}</td>
                                        <td className="py-2 px-1 text-center hidden sm:table-cell"><span className={e.gd > 0 ? "text-[#16A34A]" : e.gd < 0 ? "text-red-500" : "text-[#64748B]"}>{e.gd > 0 ? `+${e.gd}` : e.gd}</span></td>
                                        <td className="py-2 px-3 text-center font-bold text-[#0F172A] dark:text-white">{e.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    orderedStages.length === 0 ? (
                        <div className="text-center py-10 px-4"><Swords className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">No knockout fixtures yet.</p></div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {orderedStages.map(stage => (
                                <div key={stage}>
                                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A]/80 sticky top-0 z-10">
                                        <h4 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-2"><Swords className="w-3.5 h-3.5" />{STAGE_LABELS[stage] || stage.replace(/_/g, " ")}</h4>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {knockoutsByStage[stage].map(m => <MatchRow key={m.id} match={m} competitionCode={activeComp} onSelect={setSelectedMatch} isSelected={selectedMatch === m.id} />)}
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
