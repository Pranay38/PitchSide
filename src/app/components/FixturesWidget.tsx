import { useState, useEffect } from "react";
import { Trophy, Calendar, Loader2 } from "lucide-react";

interface Match {
    id: number;
    competition: { name: string; emblem: string };
    utcDate: string;
    status: string;
    homeTeam: { name: string; crest: string };
    awayTeam: { name: string; crest: string };
    score: { home: number | null; away: number | null };
}

const COMPETITIONS = [
    { code: "PL", name: "Premier League" },
    { code: "CL", name: "Champions League" },
    { code: "PD", name: "La Liga" },
    { code: "BL1", name: "Bundesliga" },
    { code: "SA", name: "Serie A" },
];

function formatMatchTime(utcDate: string): string {
    const d = new Date(utcDate);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `Today, ${time}`;
    if (isTomorrow) return `Tomorrow, ${time}`;
    return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
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
        default:
            return null;
    }
}

export function FixturesWidget() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeComp, setActiveComp] = useState("PL");

    useEffect(() => {
        const fetchMatches = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/fixtures?competition=${activeComp}`);
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
        };

        fetchMatches();
    }, [activeComp]);

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-[#16A34A]" />
                    Scores & Fixtures
                </h3>
            </div>

            {/* Competition Tabs */}
            <div className="flex overflow-x-auto px-3 py-2 gap-1 border-b border-gray-100 dark:border-gray-800 scrollbar-thin">
                {COMPETITIONS.map((comp) => (
                    <button
                        key={comp.code}
                        onClick={() => setActiveComp(comp.code)}
                        className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${activeComp === comp.code
                                ? "bg-[#16A34A] text-white shadow-sm"
                                : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                    >
                        {comp.name}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12 text-[#64748B]">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm">Loading fixtures...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 px-4">
                        <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                        <p className="text-sm text-[#64748B] dark:text-gray-400">{error}</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <Calendar className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                        <p className="text-sm text-[#64748B] dark:text-gray-400">No fixtures in the next few days.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                {/* Date/Time + Status */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] text-[#94A3B8] dark:text-gray-500 font-medium">
                                        {formatMatchTime(match.utcDate)}
                                    </span>
                                    {getStatusBadge(match.status)}
                                </div>

                                {/* Teams */}
                                <div className="space-y-1.5">
                                    {/* Home Team */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {match.homeTeam.crest && (
                                                <img
                                                    src={match.homeTeam.crest}
                                                    alt=""
                                                    className="w-5 h-5 object-contain flex-shrink-0"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                            )}
                                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">
                                                {match.homeTeam.name}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold min-w-[20px] text-right ${match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED"
                                                ? "text-[#0F172A] dark:text-white"
                                                : "text-[#94A3B8]"
                                            }`}>
                                            {match.score.home !== null ? match.score.home : "-"}
                                        </span>
                                    </div>
                                    {/* Away Team */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {match.awayTeam.crest && (
                                                <img
                                                    src={match.awayTeam.crest}
                                                    alt=""
                                                    className="w-5 h-5 object-contain flex-shrink-0"
                                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                                />
                                            )}
                                            <span className="text-sm font-medium text-[#0F172A] dark:text-white truncate">
                                                {match.awayTeam.name}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold min-w-[20px] text-right ${match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED"
                                                ? "text-[#0F172A] dark:text-white"
                                                : "text-[#94A3B8]"
                                            }`}>
                                            {match.score.away !== null ? match.score.away : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
