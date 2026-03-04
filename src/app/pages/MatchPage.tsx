import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router";
import {
    ArrowLeft, Trophy, MapPin, Users, Clock, RefreshCw,
    CircleDot, RectangleHorizontal, ArrowRightLeft, Shield,
} from "lucide-react";

/* ─── types ─── */
interface MatchEvent {
    time: number;
    extraTime?: number | null;
    team: string;
    player: string;
    assist?: string | null;
    type: string;
    detail: string;
}

interface StatRow {
    label: string;
    home: string | number;
    away: string | number;
}

interface MatchData {
    fixture: { venue?: string | null; city?: string | null; referee?: string | null };
    homeTeam: { name: string; logo: string };
    awayTeam: { name: string; logo: string };
    score: {
        home: number | null;
        away: number | null;
        halfTime?: { home: number | null; away: number | null };
        fullTime?: { home: number | null; away: number | null };
    };
    events: MatchEvent[];
    statistics: StatRow[];
}

/* ─── event icon helper ─── */
function EventIcon({ type, detail }: { type: string; detail: string }) {
    if (type === "Goal" || type.toLowerCase().includes("goal")) {
        if (detail?.includes("Penalty")) return <span className="text-lg">⚽</span>;
        if (detail?.includes("Own")) return <span className="text-lg opacity-60">⚽</span>;
        return <span className="text-lg">⚽</span>;
    }
    if (type === "Card" || type.toLowerCase().includes("card")) {
        if (detail?.includes("Red")) return <div className="w-3.5 h-5 rounded-sm bg-red-500 shadow-lg shadow-red-500/40" />;
        return <div className="w-3.5 h-5 rounded-sm bg-yellow-400 shadow-lg shadow-yellow-400/40" />;
    }
    if (type === "subst" || type.toLowerCase().includes("subst")) {
        return <ArrowRightLeft className="w-4 h-4 text-sky-400" />;
    }
    return <CircleDot className="w-4 h-4 text-gray-400" />;
}

/* ─── stat bar ─── */
function StatBar({ label, home, away }: StatRow) {
    const parseNum = (v: string | number) => {
        const s = String(v).replace("%", "");
        return parseFloat(s) || 0;
    };
    const hNum = parseNum(home);
    const aNum = parseNum(away);
    const total = hNum + aNum || 1;
    const hPct = (hNum / total) * 100;
    const aPct = (aNum / total) * 100;
    const homeWins = hNum > aNum;
    const awayWins = aNum > hNum;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
                <span className={`font-semibold tabular-nums ${homeWins ? "text-emerald-400" : "text-gray-300"}`}>{home}</span>
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{label}</span>
                <span className={`font-semibold tabular-nums ${awayWins ? "text-emerald-400" : "text-gray-300"}`}>{away}</span>
            </div>
            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                <div
                    className={`rounded-full transition-all duration-700 ${homeWins ? "bg-emerald-500" : "bg-gray-600"}`}
                    style={{ width: `${hPct}%` }}
                />
                <div
                    className={`rounded-full transition-all duration-700 ${awayWins ? "bg-emerald-500" : "bg-gray-600"}`}
                    style={{ width: `${aPct}%` }}
                />
            </div>
        </div>
    );
}

/* ─── tab button ─── */
function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${active
                    ? "bg-emerald-500/15 text-emerald-400 shadow-inner"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
        >
            {children}
        </button>
    );
}

/* ─── main page ─── */
export function MatchPage() {
    const [searchParams] = useSearchParams();
    const matchId = searchParams.get("id");
    const homeQ = searchParams.get("home") || "";
    const awayQ = searchParams.get("away") || "";
    const dateQ = searchParams.get("date") || "";
    const compQ = searchParams.get("competition") || "PL";

    const [data, setData] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tab, setTab] = useState<"timeline" | "stats">("timeline");
    const [refreshing, setRefreshing] = useState(false);

    const fetchMatch = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            if (matchId) params.set("id", matchId);
            if (homeQ) params.set("home", homeQ);
            if (awayQ) params.set("away", awayQ);
            if (dateQ) params.set("date", dateQ);
            if (compQ) params.set("competition", compQ);

            const resp = await fetch(`/api/match?${params}`);
            if (!resp.ok) throw new Error("Failed to fetch match data");
            const json = await resp.json();
            setData(json);
        } catch (e: any) {
            setError(e.message || "Something went wrong");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [matchId, homeQ, awayQ, dateQ, compQ]);

    useEffect(() => {
        fetchMatch();
        // Auto-refresh every 60s
        const interval = setInterval(() => fetchMatch(true), 60000);
        return () => clearInterval(interval);
    }, [fetchMatch]);

    /* Loading state */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                    <p className="text-gray-400 text-sm font-medium animate-pulse">Loading match data...</p>
                </div>
            </div>
        );
    }

    /* Error state */
    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Match Not Found</h2>
                    <p className="text-gray-400 text-sm mb-6">{error || "Could not load match data. Please try again."}</p>
                    <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/25 transition">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const events = (data.events || []).sort((a, b) => {
        const aTime = a.time + (a.extraTime || 0) * 0.01;
        const bTime = b.time + (b.extraTime || 0) * 0.01;
        return aTime - bTime;
    });

    const goals = events.filter(e => e.type === "Goal" || e.type.toLowerCase().includes("goal"));
    const isLive = (data.score.home !== null && data.score.away !== null) && !events.some(e => e.detail === "Full Time");

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">
            {/* ─── Top nav bar ─── */}
            <div className="sticky top-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <div className="flex items-center gap-2">
                        {data.fixture.venue && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {data.fixture.venue}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => fetchMatch(true)}
                        className={`p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-emerald-400 ${refreshing ? "animate-spin" : ""}`}
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

                {/* ─── Competition badge ─── */}
                <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs uppercase tracking-[0.2em] font-semibold text-gray-500">
                        {compQ === "PL" ? "Premier League" : compQ === "CL" ? "Champions League" : compQ === "PD" ? "La Liga" : compQ === "BL1" ? "Bundesliga" : compQ === "SA" ? "Serie A" : compQ}
                    </span>
                </div>

                {/* ─── Score Header ─── */}
                <div className="relative rounded-2xl bg-gradient-to-b from-[#111827] to-[#0d1321] border border-white/5 p-6 sm:p-8 overflow-hidden">
                    {/* Glow effects */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full" />
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-sky-500/5 blur-3xl rounded-full" />

                    {isLive && (
                        <div className="flex justify-center mb-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/20">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[11px] uppercase tracking-widest font-bold text-red-400">Live</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-4 sm:gap-8">
                        {/* Home team */}
                        <div className="flex-1 flex flex-col items-center gap-3">
                            {data.homeTeam.logo && (
                                <img src={data.homeTeam.logo} alt={data.homeTeam.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl" />
                            )}
                            <h2 className="text-sm sm:text-base font-bold text-center text-gray-200">{data.homeTeam.name}</h2>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-3">
                                <span className="text-5xl sm:text-6xl font-black tabular-nums text-white">
                                    {data.score.home ?? "–"}
                                </span>
                                <span className="text-2xl text-gray-600 font-light">:</span>
                                <span className="text-5xl sm:text-6xl font-black tabular-nums text-white">
                                    {data.score.away ?? "–"}
                                </span>
                            </div>
                            {data.score.halfTime && data.score.halfTime.home !== null && (
                                <span className="text-[11px] text-gray-500 font-medium">
                                    HT {data.score.halfTime.home} – {data.score.halfTime.away}
                                </span>
                            )}
                        </div>

                        {/* Away team */}
                        <div className="flex-1 flex flex-col items-center gap-3">
                            {data.awayTeam.logo && (
                                <img src={data.awayTeam.logo} alt={data.awayTeam.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-2xl" />
                            )}
                            <h2 className="text-sm sm:text-base font-bold text-center text-gray-200">{data.awayTeam.name}</h2>
                        </div>
                    </div>

                    {/* Goal scorers quick summary */}
                    {goals.length > 0 && (
                        <div className="mt-5 flex justify-center">
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 text-[12px] text-gray-400">
                                <div className="text-center sm:text-right space-y-0.5">
                                    {goals.filter(g => g.team === data.homeTeam.name || g.team.includes(data.homeTeam.name.split(" ")[0])).map((g, i) => (
                                        <p key={i}>
                                            <span className="text-gray-300 font-medium">{g.player}</span>
                                            <span className="text-emerald-500 ml-1">{g.time}'</span>
                                            {g.detail?.includes("Penalty") && <span className="text-gray-500 ml-0.5">(P)</span>}
                                        </p>
                                    ))}
                                </div>
                                <div className="text-center sm:text-left space-y-0.5">
                                    {goals.filter(g => g.team === data.awayTeam.name || g.team.includes(data.awayTeam.name.split(" ")[0])).map((g, i) => (
                                        <p key={i}>
                                            <span className="text-gray-300 font-medium">{g.player}</span>
                                            <span className="text-emerald-500 ml-1">{g.time}'</span>
                                            {g.detail?.includes("Penalty") && <span className="text-gray-500 ml-0.5">(P)</span>}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Match info badges */}
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        {data.fixture.referee && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-gray-400 font-medium">
                                <Users className="w-3 h-3" /> {data.fixture.referee}
                            </span>
                        )}
                        {data.fixture.venue && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-[11px] text-gray-400 font-medium">
                                <MapPin className="w-3 h-3" /> {data.fixture.venue}
                                {data.fixture.city && <>, {data.fixture.city}</>}
                            </span>
                        )}
                    </div>
                </div>

                {/* ─── Tabs ─── */}
                <div className="flex justify-center gap-1 bg-white/5 rounded-xl p-1">
                    <TabButton active={tab === "timeline"} onClick={() => setTab("timeline")}>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Timeline</span>
                    </TabButton>
                    <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
                        <span className="flex items-center gap-1.5"><RectangleHorizontal className="w-3.5 h-3.5" /> Stats</span>
                    </TabButton>
                </div>

                {/* ─── Timeline Tab ─── */}
                {tab === "timeline" && (
                    <div className="space-y-0">
                        {events.length === 0 ? (
                            <div className="text-center py-16">
                                <Clock className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                                <p className="text-gray-400 text-sm font-medium">No events available yet</p>
                                <p className="text-gray-600 text-xs mt-1">Events will appear here once the match starts</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Center line */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent -translate-x-1/2" />

                                {events.map((event, i) => {
                                    const isHome = event.team === data.homeTeam.name || event.team.includes(data.homeTeam.name.split(" ")[0]);
                                    const isGoal = event.type === "Goal" || event.type.toLowerCase().includes("goal");
                                    const isSub = event.type === "subst" || event.type.toLowerCase().includes("subst");

                                    return (
                                        <div
                                            key={i}
                                            className={`relative flex items-center gap-3 py-3 transition-all duration-300 ${isGoal ? "scale-[1.02]" : ""
                                                }`}
                                            style={{ animationDelay: `${i * 50}ms` }}
                                        >
                                            {/* Home side (left) */}
                                            <div className={`flex-1 flex justify-end ${!isHome ? "invisible" : ""}`}>
                                                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isGoal
                                                        ? "bg-emerald-500/10 border border-emerald-500/20"
                                                        : "bg-white/[0.03] hover:bg-white/[0.06]"
                                                    }`}>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-semibold ${isGoal ? "text-emerald-400" : "text-gray-200"}`}>
                                                            {isSub ? event.player : event.player}
                                                        </p>
                                                        {event.assist && (
                                                            <p className="text-[11px] text-gray-500">
                                                                {isSub ? `↔ ${event.assist}` : `Assist: ${event.assist}`}
                                                            </p>
                                                        )}
                                                        {event.detail && !isSub && (
                                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">{event.detail}</p>
                                                        )}
                                                    </div>
                                                    <EventIcon type={event.type} detail={event.detail} />
                                                </div>
                                            </div>

                                            {/* Center minute badge */}
                                            <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isGoal
                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                                    : "bg-[#1a1f2e] border border-white/10 text-gray-300"
                                                }`}>
                                                {event.time}'
                                                {event.extraTime ? <span className="text-[8px] absolute -bottom-0.5 right-0">+{event.extraTime}</span> : null}
                                            </div>

                                            {/* Away side (right) */}
                                            <div className={`flex-1 flex justify-start ${isHome ? "invisible" : ""}`}>
                                                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${isGoal
                                                        ? "bg-emerald-500/10 border border-emerald-500/20"
                                                        : "bg-white/[0.03] hover:bg-white/[0.06]"
                                                    }`}>
                                                    <EventIcon type={event.type} detail={event.detail} />
                                                    <div className="text-left">
                                                        <p className={`text-sm font-semibold ${isGoal ? "text-emerald-400" : "text-gray-200"}`}>
                                                            {event.player}
                                                        </p>
                                                        {event.assist && (
                                                            <p className="text-[11px] text-gray-500">
                                                                {isSub ? `↔ ${event.assist}` : `Assist: ${event.assist}`}
                                                            </p>
                                                        )}
                                                        {event.detail && !isSub && (
                                                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">{event.detail}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Stats Tab ─── */}
                {tab === "stats" && (
                    <div className="space-y-3">
                        {data.statistics && data.statistics.length > 0 ? (
                            <div className="rounded-2xl bg-gradient-to-b from-[#111827] to-[#0d1321] border border-white/5 p-5 sm:p-6 space-y-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {data.homeTeam.logo && <img src={data.homeTeam.logo} alt="" className="w-5 h-5 object-contain" />}
                                        <span className="text-xs font-semibold text-gray-400">{data.homeTeam.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-400">{data.awayTeam.name}</span>
                                        {data.awayTeam.logo && <img src={data.awayTeam.logo} alt="" className="w-5 h-5 object-contain" />}
                                    </div>
                                </div>
                                {data.statistics.map((stat, i) => (
                                    <StatBar key={i} {...stat} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <RectangleHorizontal className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                                <p className="text-gray-400 text-sm font-medium">No statistics available</p>
                                <p className="text-gray-600 text-xs mt-1">
                                    Stats will appear here for completed matches.
                                    {!data.statistics?.length && " Detailed stats require RAPIDAPI_KEY."}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Auto-refresh notice ─── */}
                <div className="text-center pb-6">
                    <p className="text-[11px] text-gray-600 flex items-center justify-center gap-1.5">
                        <RefreshCw className="w-3 h-3" />
                        Auto-refreshes every 60 seconds during live matches
                    </p>
                </div>
            </div>
        </div>
    );
}
