import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, Loader2, ChevronLeft, ChevronRight, TableProperties, Swords, X } from "lucide-react";

/* ── Types ── */
interface Match {
    id: number; utcDate: string; status: string;
    homeTeam: { name: string; crest: string };
    awayTeam: { name: string; crest: string };
    score: { home: number | null; away: number | null };
}

interface KnockoutMatch extends Match {
    stage: string;
    aggregateHome: number | null;
    aggregateAway: number | null;
}

interface MatchStat { label: string; home: string | number; away: string | number; }
interface MatchEvent { time: number; extraTime: number | null; team: string; player: string; assist: string | null; type: string; detail: string; }
interface MatchDetail {
    fixture: { venue: string | null; city: string | null; referee: string | null };
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

/* ── Constants ── */
const COMPETITIONS = [
    { code: "PL", name: "Premier League", emoji: "🏴" },
    { code: "CL", name: "Champions League", emoji: "🏆" },
    { code: "PD", name: "La Liga", emoji: "🇪🇸" },
    { code: "BL1", name: "Bundesliga", emoji: "🇩🇪" },
    { code: "SA", name: "Serie A", emoji: "🇮🇹" },
];

type ViewMode = "recent" | "next" | "prev";
type Tab = "fixtures" | "table" | "knockouts";

const STAGE_LABELS: Record<string, string> = {
    PLAYOFF: "Playoff Round", LAST_16: "Round of 16", ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter-Finals", SEMI_FINALS: "Semi-Finals", FINAL: "Final",
};

/* ── Helpers ── */
function formatMatchTime(utcDate: string): string {
    const d = new Date(utcDate);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 0 && d.toDateString() === now.toDateString()) return `Today, ${time}`;
    if (days === 1 || (days === 0 && d.getDate() === now.getDate() - 1)) return `Yesterday, ${time}`;
    if (days === -1 || (days === 0 && d.getDate() === now.getDate() + 1)) return `Tomorrow, ${time}`;
    return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

function StatusBadge({ status }: { status: string }) {
    if (status === "IN_PLAY" || status === "LIVE") return <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">LIVE</span>;
    if (status === "PAUSED") return <span className="px-2 py-0.5 text-[10px] font-bold text-amber-900 bg-amber-400 rounded-full">HT</span>;
    if (status === "FINISHED") return <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 rounded-full">FT</span>;
    return null;
}

/* ── Stat Bar ── */
function StatBar({ label, home, away }: MatchStat) {
    const homeNum = typeof home === "string" ? parseInt(home) || 0 : home;
    const awayNum = typeof away === "string" ? parseInt(away) || 0 : away;
    const total = homeNum + awayNum || 1;
    const homePercent = (homeNum / total) * 100;
    return (
        <div className="mb-3 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-[#0F172A] dark:text-white w-12 text-left">{home}</span>
                <span className="text-[#94A3B8] text-[10px] font-medium uppercase tracking-wider">{label}</span>
                <span className="font-bold text-[#0F172A] dark:text-white w-12 text-right">{away}</span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                <div className="bg-[#16A34A] rounded-full transition-all duration-500" style={{ width: `${homePercent}%` }} />
                <div className="bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${100 - homePercent}%` }} />
            </div>
        </div>
    );
}

/* ── Match Stats Panel ── */
function MatchStatsPanel({ match, competitionCode, onClose }: { match: Match; competitionCode: string; onClose: () => void }) {
    const [detail, setDetail] = useState<MatchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true); setError("");
            try {
                const matchDate = new Date(match.utcDate).toISOString().split("T")[0];
                const params = new URLSearchParams({ id: String(match.id), home: match.homeTeam.name, away: match.awayTeam.name, date: matchDate, competition: competitionCode });
                const res = await fetch(`/api/match?${params}`);
                if (res.ok) setDetail(await res.json());
                else { const e = await res.json().catch(() => ({})); setError(e.error || "Stats unavailable"); }
            } catch { setError("Could not load stats"); }
            setLoading(false);
        })();
    }, [match, competitionCode]);

    if (loading) return (
        <div className="p-5 flex items-center justify-center bg-gradient-to-b from-[#16A34A]/5 to-transparent dark:from-[#16A34A]/10 border-t border-[#16A34A]/20">
            <Loader2 className="w-4 h-4 animate-spin text-[#16A34A] mr-2" />
            <span className="text-xs text-[#64748B]">Loading match stats...</span>
        </div>
    );

    if (error || !detail) return (
        <div className="p-4 bg-gray-50 dark:bg-[#0F172A]/50 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-[#94A3B8]">{error || "No stats available"}</p>
        </div>
    );

    const goals = detail.events.filter(e => e.type === "Goal");
    const cards = detail.events.filter(e => e.type === "Card");
    const subs = detail.events.filter(e => e.type === "subst");

    return (
        <div className="border-t-2 border-[#16A34A]/30 bg-gradient-to-b from-gray-50 to-white dark:from-[#0F172A]/80 dark:to-[#1E293B]">
            {/* Close */}
            <div className="flex justify-between items-center px-4 py-2">
                <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest">Match Stats</span>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="w-3.5 h-3.5 text-[#94A3B8]" /></button>
            </div>

            <div className="px-4 pb-4 space-y-4">
                {/* Score */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        {detail.homeTeam.logo && <img src={detail.homeTeam.logo} alt="" className="w-7 h-7 object-contain" />}
                        <span className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight">{detail.homeTeam.name}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <span className="text-2xl font-black text-[#0F172A] dark:text-white">{detail.score.home ?? "-"}</span>
                        <span className="text-lg text-[#94A3B8]">–</span>
                        <span className="text-2xl font-black text-[#0F172A] dark:text-white">{detail.score.away ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-xs font-bold text-[#0F172A] dark:text-white leading-tight text-right">{detail.awayTeam.name}</span>
                        {detail.awayTeam.logo && <img src={detail.awayTeam.logo} alt="" className="w-7 h-7 object-contain" />}
                    </div>
                </div>
                <div className="flex justify-center gap-4 text-[10px] text-[#94A3B8]">
                    {detail.score.halfTime.home !== null && <span>HT {detail.score.halfTime.home}–{detail.score.halfTime.away}</span>}
                    {detail.score.extraTime.home !== null && <span>ET {detail.score.extraTime.home}–{detail.score.extraTime.away}</span>}
                    {detail.score.penalty.home !== null && <span>Pens {detail.score.penalty.home}–{detail.score.penalty.away}</span>}
                </div>

                {/* Goals */}
                {goals.length > 0 && (
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h5 className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest mb-2">⚽ Goals</h5>
                        {goals.map((g, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs py-1">
                                <span className="text-[#16A34A] font-bold w-8 text-right">{g.time}'{g.extraTime ? `+${g.extraTime}` : ""}</span>
                                <span className="font-semibold text-[#0F172A] dark:text-white">{g.player}</span>
                                {g.detail === "Penalty" && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">PEN</span>}
                                {g.detail === "Own Goal" && <span className="text-[9px] bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">OG</span>}
                                {g.assist && <span className="text-[#94A3B8] text-[11px] ml-auto">Ast: {g.assist}</span>}
                            </div>
                        ))}
                    </div>
                )}

                {/* Statistics */}
                {detail.statistics.length > 0 && (
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h5 className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest mb-3">📊 Statistics</h5>
                        {detail.statistics.map((stat, i) => <StatBar key={i} {...stat} />)}
                    </div>
                )}

                {/* Cards & Subs in a row */}
                <div className="grid grid-cols-2 gap-2">
                    {cards.length > 0 && (
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h5 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2">🟨 Cards</h5>
                            {cards.map((c, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[11px] py-0.5">
                                    <span className="text-[#94A3B8] font-bold w-6">{c.time}'</span>
                                    <span className={`w-2.5 h-3.5 rounded-sm flex-shrink-0 ${c.detail.includes("Red") ? "bg-red-500" : "bg-yellow-400"}`} />
                                    <span className="text-[#0F172A] dark:text-white truncate">{c.player}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {subs.length > 0 && (
                        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h5 className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mb-2">🔄 Subs</h5>
                            {subs.map((s, i) => (
                                <div key={i} className="text-[11px] py-0.5">
                                    <span className="text-[#94A3B8] font-bold mr-1">{s.time}'</span>
                                    <span className="text-[#16A34A]">↑{s.player}</span>
                                    {s.assist && <span className="text-red-400 ml-1">↓{s.assist}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-x-3 text-[10px] text-[#94A3B8]">
                    {detail.fixture.referee && <span>🏁 {detail.fixture.referee}</span>}
                    {detail.fixture.venue && <span>🏟️ {detail.fixture.venue}</span>}
                </div>
            </div>
        </div>
    );
}

/* ── Match Row ── */
function MatchRow({ match, competitionCode, selectedId, onSelect }: { match: Match; competitionCode: string; selectedId: number; onSelect: (id: number) => void }) {
    const isClickable = ["FINISHED", "IN_PLAY", "PAUSED"].includes(match.status);
    const isSelected = selectedId === match.id;
    return (
        <div>
            <div
                onClick={() => isClickable && onSelect(isSelected ? -1 : match.id)}
                className={`px-4 py-3 transition-all ${isClickable ? "cursor-pointer" : ""} ${isSelected ? "bg-[#16A34A]/5 dark:bg-[#16A34A]/10" : isClickable ? "hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""}`}
            >
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-[#94A3B8] font-medium">{formatMatchTime(match.utcDate)}</span>
                    <div className="flex items-center gap-2">
                        {isClickable && !isSelected && <span className="text-[9px] text-[#16A34A] font-semibold tracking-wide">VIEW STATS →</span>}
                        <StatusBadge status={match.status} />
                    </div>
                </div>
                {/* Home */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => (e.currentTarget.style.display = "none")} />}
                        <span className="text-[13px] font-medium text-[#0F172A] dark:text-white truncate">{match.homeTeam.name}</span>
                    </div>
                    <span className={`text-[13px] font-bold min-w-[20px] text-right ${isClickable ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>{match.score.home ?? "-"}</span>
                </div>
                {/* Away */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => (e.currentTarget.style.display = "none")} />}
                        <span className="text-[13px] font-medium text-[#0F172A] dark:text-white truncate">{match.awayTeam.name}</span>
                    </div>
                    <span className={`text-[13px] font-bold min-w-[20px] text-right ${isClickable ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>{match.score.away ?? "-"}</span>
                </div>
            </div>
            {isSelected && <MatchStatsPanel match={match} competitionCode={competitionCode} onClose={() => onSelect(-1)} />}
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
    const [selectedMatch, setSelectedMatch] = useState(-1);

    const fetchMatches = useCallback(async () => {
        setLoading(true); setError(""); setSelectedMatch(-1);
        try {
            const res = await fetch(`/api/fixtures?competition=${activeComp}&mode=${viewMode}&offset=${offset}`);
            if (res.ok) setMatches((await res.json()).matches || []);
            else setError((await res.json().catch(() => ({}))).error || "Failed to load fixtures.");
        } catch { setError("Could not load fixtures."); }
        setLoading(false);
    }, [activeComp, viewMode, offset]);

    const fetchStandings = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const res = await fetch(`/api/standings?competition=${activeComp}`);
            if (res.ok) { const d = await res.json(); setStandings(d.table || []); setKnockouts(d.knockouts || []); }
            else setError((await res.json().catch(() => ({}))).error || "Failed to load standings.");
        } catch { setError("Could not load standings."); }
        setLoading(false);
    }, [activeComp]);

    useEffect(() => { tab === "fixtures" ? fetchMatches() : fetchStandings(); }, [tab, fetchMatches, fetchStandings]);

    const switchComp = (code: string) => { setActiveComp(code); setOffset(0); setViewMode("recent"); setSelectedMatch(-1); if (code !== "CL" && tab === "knockouts") setTab("fixtures"); };
    const goNext = () => { setSelectedMatch(-1); if (viewMode === "recent") { setViewMode("next"); setOffset(0); } else if (viewMode === "next") setOffset(o => o + 3); else { if (offset <= 1) { setViewMode("recent"); setOffset(0); } else setOffset(o => Math.max(0, o - 3)); } };
    const goPrev = () => { setSelectedMatch(-1); if (viewMode === "recent") { setViewMode("prev"); setOffset(1); } else if (viewMode === "prev") setOffset(o => o + 3); else { if (offset <= 0) { setViewMode("recent"); setOffset(0); } else setOffset(o => Math.max(0, o - 3)); } };
    const getViewLabel = () => viewMode === "recent" ? "Recent Results" : viewMode === "next" ? "Upcoming" : "Past Results";

    const knockoutsByStage = knockouts.reduce((acc, m) => { const s = m.stage || "OTHER"; if (!acc[s]) acc[s] = []; acc[s].push(m); return acc; }, {} as Record<string, KnockoutMatch[]>);
    const orderedStages = ["PLAYOFF", "LAST_16", "ROUND_OF_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"].filter(s => knockoutsByStage[s]);
    const isCL = activeComp === "CL";

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#16A34A]/5 to-transparent dark:from-[#16A34A]/10">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-[#16A34A]" />
                        Scores & Fixtures
                    </h3>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                        <button onClick={() => setTab("fixtures")} className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${tab === "fixtures" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B]"}`}>Fixtures</button>
                        <button onClick={() => setTab("table")} className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "table" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B]"}`}><TableProperties className="w-3 h-3" />Table</button>
                        {isCL && <button onClick={() => setTab("knockouts")} className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "knockouts" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B]"}`}><Swords className="w-3 h-3" />Knockouts</button>}
                    </div>
                </div>
            </div>

            {/* Competition pills */}
            <div className="flex overflow-x-auto px-3 py-2 gap-1.5 border-b border-gray-100 dark:border-gray-800">
                {COMPETITIONS.map(c => (
                    <button key={c.code} onClick={() => switchComp(c.code)} className={`flex-shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${activeComp === c.code ? "bg-[#16A34A] text-white shadow-md shadow-[#16A34A]/20" : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                        {c.emoji} {c.name}
                    </button>
                ))}
            </div>

            {/* Date Navigation (fixtures only) */}
            {tab === "fixtures" && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0F172A]/30">
                    <button onClick={goPrev} className="flex items-center gap-0.5 text-[11px] font-semibold text-[#64748B] hover:text-[#16A34A] transition-colors"><ChevronLeft className="w-4 h-4" />Previous</button>
                    <span className="text-[11px] font-bold text-[#0F172A] dark:text-white px-3 py-1 bg-white dark:bg-[#1E293B] rounded-full shadow-sm border border-gray-100 dark:border-gray-700">{getViewLabel()}</span>
                    <button onClick={goNext} className="flex items-center gap-0.5 text-[11px] font-semibold text-[#64748B] hover:text-[#16A34A] transition-colors">Next<ChevronRight className="w-4 h-4" /></button>
                </div>
            )}

            {/* Content */}
            <div className="max-h-[550px] overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#16A34A] mb-2" /><span className="text-xs text-[#94A3B8]">Loading...</span></div>
                ) : error ? (
                    <div className="text-center py-12 px-4"><Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">{error}</p></div>
                ) : tab === "fixtures" ? (
                    matches.length === 0 ? (
                        <div className="text-center py-12"><Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">No matches found</p><p className="text-xs text-[#94A3B8] mt-1">Try a different date range</p></div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {matches.map(m => <MatchRow key={m.id} match={m} competitionCode={activeComp} selectedId={selectedMatch} onSelect={setSelectedMatch} />)}
                        </div>
                    )
                ) : tab === "table" ? (
                    standings.length === 0 ? (
                        <div className="text-center py-12"><TableProperties className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">No standings available</p></div>
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
                                    <th className="text-center py-2.5 px-1 font-semibold w-9 hidden sm:table-cell">GD</th>
                                    <th className="text-center py-2.5 px-3 font-semibold w-9">Pts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {standings.map(e => (
                                    <tr key={e.position} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="py-2 px-3 font-bold text-[#0F172A] dark:text-white">{e.position}</td>
                                        <td className="py-2 px-1"><div className="flex items-center gap-2">{e.team.crest && <img src={e.team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={ev => ((ev.currentTarget as HTMLImageElement).style.display = "none")} />}<span className="font-medium text-[#0F172A] dark:text-white truncate">{e.team.name}</span></div></td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.played}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.won}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.draw}</td>
                                        <td className="py-2 px-1 text-center text-[#64748B]">{e.lost}</td>
                                        <td className="py-2 px-1 text-center hidden sm:table-cell"><span className={e.gd > 0 ? "text-[#16A34A] font-semibold" : e.gd < 0 ? "text-red-500 font-semibold" : "text-[#64748B]"}>{e.gd > 0 ? `+${e.gd}` : e.gd}</span></td>
                                        <td className="py-2 px-3 text-center font-bold text-[#0F172A] dark:text-white">{e.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    orderedStages.length === 0 ? (
                        <div className="text-center py-12"><Swords className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">No knockout fixtures yet</p></div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {orderedStages.map(stage => (
                                <div key={stage}>
                                    <div className="px-4 py-2.5 bg-gradient-to-r from-[#16A34A]/5 to-transparent dark:from-[#16A34A]/10 sticky top-0 z-10">
                                        <h4 className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest flex items-center gap-2"><Swords className="w-3.5 h-3.5" />{STAGE_LABELS[stage] || stage.replace(/_/g, " ")}</h4>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {knockoutsByStage[stage].map(m => <MatchRow key={m.id} match={m} competitionCode={activeComp} selectedId={selectedMatch} onSelect={setSelectedMatch} />)}
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
