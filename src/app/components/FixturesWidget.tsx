import { useState, useEffect, useCallback } from "react";
import { Trophy, Calendar, Loader2, ChevronLeft, ChevronRight, TableProperties, Swords, Target } from "lucide-react";

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

interface StandingEntry {
    position: number;
    team: { name: string; crest: string };
    played: number; won: number; draw: number; lost: number;
    gf: number; ga: number; gd: number; points: number;
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

/* ── Constants ── */
const COMPETITIONS = [
    { code: "PL", name: "Premier League", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { code: "CL", name: "Champions League", emoji: "🏆" },
    { code: "PD", name: "La Liga", emoji: "🇪🇸" },
    { code: "BL1", name: "Bundesliga", emoji: "🇩🇪" },
    { code: "SA", name: "Serie A", emoji: "🇮🇹" },
    { code: "FL1", name: "Ligue 1", emoji: "🇫🇷" },
];

type ViewMode = "recent" | "next" | "prev";
type Tab = "fixtures" | "table" | "knockouts" | "scorers";

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

/* ── Match Row ── */
function MatchRow({ match }: { match: Match }) {
    const hasScore = ["FINISHED", "IN_PLAY", "PAUSED"].includes(match.status);
    return (
        <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#94A3B8] font-medium">{formatMatchTime(match.utcDate)}</span>
                <StatusBadge status={match.status} />
            </div>
            {/* Home */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {match.homeTeam.crest && <img src={match.homeTeam.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => (e.currentTarget.style.display = "none")} />}
                    <span className="text-[13px] font-medium text-[#0F172A] dark:text-white truncate">{match.homeTeam.name}</span>
                </div>
                <span className={`text-[13px] font-bold min-w-[20px] text-right ${hasScore ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>{match.score.home ?? "-"}</span>
            </div>
            {/* Away */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {match.awayTeam.crest && <img src={match.awayTeam.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" onError={e => (e.currentTarget.style.display = "none")} />}
                    <span className="text-[13px] font-medium text-[#0F172A] dark:text-white truncate">{match.awayTeam.name}</span>
                </div>
                <span className={`text-[13px] font-bold min-w-[20px] text-right ${hasScore ? "text-[#0F172A] dark:text-white" : "text-[#94A3B8]"}`}>{match.score.away ?? "-"}</span>
            </div>
        </div>
    );
}

/* ── Main Widget ── */
export function FixturesWidget() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [standings, setStandings] = useState<StandingEntry[]>([]);
    const [knockouts, setKnockouts] = useState<KnockoutMatch[]>([]);
    const [scorers, setScorers] = useState<ScorerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeComp, setActiveComp] = useState("PL");
    const [viewMode, setViewMode] = useState<ViewMode>("recent");
    const [offset, setOffset] = useState(0);
    const [tab, setTab] = useState<Tab>("fixtures");

    const fetchMatches = useCallback(async () => {
        setLoading(true); setError("");
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

    const fetchScorers = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const res = await fetch(`/api/standings?competition=${activeComp}&view=scorers&limit=20`);
            if (res.ok) { const d = await res.json(); setScorers(d.scorers || []); }
            else setError((await res.json().catch(() => ({}))).error || "Failed to load top scorers.");
        } catch { setError("Could not load top scorers."); }
        setLoading(false);
    }, [activeComp]);

    useEffect(() => {
        if (tab === "fixtures") fetchMatches();
        else if (tab === "scorers") fetchScorers();
        else fetchStandings();
    }, [tab, fetchMatches, fetchStandings, fetchScorers]);

    const switchComp = (code: string) => { setActiveComp(code); setOffset(0); setViewMode("recent"); if (code !== "CL" && tab === "knockouts") setTab("fixtures"); };
    const goNext = () => { if (viewMode === "recent") { setViewMode("next"); setOffset(0); } else if (viewMode === "next") setOffset(o => o + 3); else { if (offset <= 1) { setViewMode("recent"); setOffset(0); } else setOffset(o => Math.max(0, o - 3)); } };
    const goPrev = () => { if (viewMode === "recent") { setViewMode("prev"); setOffset(1); } else if (viewMode === "prev") setOffset(o => o + 3); else { if (offset <= 0) { setViewMode("recent"); setOffset(0); } else setOffset(o => Math.max(0, o - 3)); } };
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
                        <button onClick={() => setTab("scorers")} className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 ${tab === "scorers" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B]"}`}><Target className="w-3 h-3" />Scorers</button>
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
                            {matches.map(m => <MatchRow key={m.id} match={m} />)}
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
                ) : tab === "scorers" ? (
                    scorers.length === 0 ? (
                        <div className="text-center py-12"><Target className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" /><p className="text-sm text-[#64748B]">No top scorer data available</p></div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {scorers.map(entry => (
                                <div key={`${entry.rank}-${entry.player}`} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-7 h-7 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                            {entry.rank}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white truncate">{entry.player}</p>
                                            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">{entry.team}{entry.played ? ` • ${entry.played} apps` : ""}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-[14px] font-black text-[#0F172A] dark:text-white">{entry.goals} <span className="text-[10px] font-semibold text-[#94A3B8]">G</span></p>
                                        <p className="text-[10px] text-[#94A3B8]">
                                            {entry.assists ?? 0} A{entry.penalties > 0 ? ` • ${entry.penalties} pen` : ""}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                        {knockoutsByStage[stage].map(m => <MatchRow key={m.id} match={m} />)}
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
