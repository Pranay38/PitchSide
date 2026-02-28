import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { searchPlayers as searchLocal, getPlayerById, players as localPlayers, STAT_LABELS } from "../data/players";
import type { Player, PlayerStats } from "../data/players";
import { ArrowLeft, Search, X, Share2, RotateCcw, Trophy } from "lucide-react";

// ── API types ──
interface APIPlayer {
    id: string;
    name: string;
    age: number;
    nationality: string;
    photo: string;
    team: string;
    teamLogo: string;
    league: string;
    position: string;
    stats: PlayerStats;
}

/** Convert API player to our Player format */
function apiToPlayer(ap: APIPlayer): Player {
    return {
        id: `api-${ap.id}`,
        name: ap.name,
        fullName: ap.name,
        team: ap.team,
        league: ap.league,
        position: ap.position,
        nationality: ap.nationality,
        age: ap.age,
        image: ap.photo,
        teamColor: "#16A34A",
        stats: ap.stats,
    };
}

/** Try API search, fall back to local data */
async function searchPlayersHybrid(query: string): Promise<Player[]> {
    // Always include local matches
    const local = searchLocal(query);

    // Try API
    try {
        const res = await fetch(`/api/football?action=search&name=${encodeURIComponent(query)}`);
        if (res.ok) {
            const data = await res.json();
            const apiPlayers: Player[] = (data.players || []).map(apiToPlayer);
            // Merge: API first, then local (deduplicated by name)
            const seen = new Set(apiPlayers.map((p) => p.name.toLowerCase()));
            const merged = [...apiPlayers, ...local.filter((p: Player) => !seen.has(p.name.toLowerCase()))];
            return merged.slice(0, 12);
        }
    } catch {
        // API not available, use local only
    }
    return local.slice(0, 12);
}

// ── Player Search Card ──
function PlayerSearchCard({
    label,
    player,
    onSelect,
    onClear,
}: {
    label: string;
    player: Player | null;
    onSelect: (p: Player) => void;
    onClear: () => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Player[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSearch = (value: string) => {
        setQuery(value);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!value.trim()) {
            setResults(localPlayers.slice(0, 8));
            setShowDropdown(true);
            return;
        }

        // Debounce API search
        setLoading(true);
        searchTimeout.current = setTimeout(async () => {
            const found = await searchPlayersHybrid(value);
            setResults(found);
            setShowDropdown(true);
            setLoading(false);
        }, 300);
    };

    if (player) {
        const statValues = Object.values(player.stats) as number[];
        const overall = Math.round(
            statValues.reduce((a: number, b: number) => a + b, 0) / statValues.length
        );
        return (
            <div className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all hover:shadow-lg">
                <div className="h-2" style={{ backgroundColor: player.teamColor }} />
                <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-gray-500">{label}</span>
                        <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#94A3B8] transition-colors" title="Change player">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border-2" style={{ borderColor: player.teamColor }}>
                            <img src={player.image} alt={player.name} className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&size=64&background=16A34A&color=fff&bold=true`; }}
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-lg text-[#0F172A] dark:text-white truncate">{player.name}</h3>
                            <p className="text-sm text-[#64748B] dark:text-gray-400">{player.team} · {player.position}</p>
                            <p className="text-xs text-[#94A3B8] dark:text-gray-500 mt-0.5">{player.nationality}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="text-2xl font-black" style={{ color: player.teamColor }}>{overall}</div>
                        <span className="text-xs text-[#94A3B8] dark:text-gray-500 uppercase tracking-wider font-medium">Overall</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-gray-500 mb-3 block">{label}</span>
            <div className="relative" ref={dropdownRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                    type="text"
                    placeholder="Search any player..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { setResults(localPlayers.slice(0, 8)); setShowDropdown(true); }}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {showDropdown && results.length > 0 && (
                    <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                        {results.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => { onSelect(p); setShowDropdown(false); setQuery(""); }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#0F172A] transition-colors text-left border-b border-gray-100 dark:border-gray-800 last:border-none"
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=36&background=16A34A&color=fff&bold=true`; }}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm text-[#0F172A] dark:text-white truncate">{p.name}</div>
                                    <div className="text-xs text-[#94A3B8] dark:text-gray-500">{p.team} · {p.league}</div>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A]">{p.position}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
                {localPlayers.slice(0, 4).map((p: Player) => (
                    <button key={p.id} onClick={() => onSelect(p)}
                        className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-[#16A34A]/10 hover:text-[#16A34A] transition-colors">
                        {p.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Stat Bars ──
function StatComparisonBars({ player1, player2 }: { player1: Player; player2: Player }) {
    const stats = Object.keys(STAT_LABELS) as (keyof PlayerStats)[];
    return (
        <div className="space-y-3">
            {stats.map((stat: keyof PlayerStats) => {
                const v1 = player1.stats[stat];
                const v2 = player2.stats[stat];
                const max = Math.max(v1, v2);
                return (
                    <div key={stat} className="flex items-center gap-3">
                        <div className="flex-1 flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white min-w-[28px] text-right">{v1}</span>
                            <div className="flex-1 h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[180px]">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out ml-auto"
                                    style={{ width: `${v1}%`, backgroundColor: player1.teamColor, opacity: v1 >= max ? 1 : 0.5 }} />
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400 w-[80px] text-center uppercase tracking-wider">{STAT_LABELS[stat]}</span>
                        <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-3.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-[180px]">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${v2}%`, backgroundColor: player2.teamColor, opacity: v2 >= max ? 1 : 0.5 }} />
                            </div>
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white min-w-[28px]">{v2}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
    if (active && payload?.length) {
        return (
            <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg px-3 py-2">
                <p className="font-semibold text-sm text-[#0F172A] dark:text-white mb-1">{payload[0]?.payload?.stat}</p>
                {payload.map((e: { name: string; value: number; color: string }, i: number) => (
                    <p key={i} className="text-xs" style={{ color: e.color }}>{e.name}: <span className="font-bold">{e.value}</span></p>
                ))}
            </div>
        );
    }
    return null;
}

// ── Main Compare Page ──
export function ComparePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const p1Id = searchParams.get("p1");
    const p2Id = searchParams.get("p2");

    const [player1, setPlayer1] = useState<Player | null>(
        p1Id ? getPlayerById(p1Id) || null : getPlayerById("messi") || null
    );
    const [player2, setPlayer2] = useState<Player | null>(
        p2Id ? getPlayerById(p2Id) || null : getPlayerById("ronaldo") || null
    );
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams();
        if (player1) params.set("p1", player1.id);
        if (player2) params.set("p2", player2.id);
        setSearchParams(params, { replace: true });
    }, [player1, player2, setSearchParams]);

    const radarData = player1 && player2
        ? (Object.keys(STAT_LABELS) as (keyof PlayerStats)[]).map((key) => ({
            stat: STAT_LABELS[key],
            [player1.name]: player1.stats[key],
            [player2.name]: player2.stats[key],
        }))
        : [];

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = window.location.href;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2 text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-[#16A34A]" />
                            <h1 className="text-lg font-bold text-[#0F172A] dark:text-white">Player Compare</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setPlayer1(null); setPlayer2(null); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                            <RotateCcw className="w-4 h-4" /><span className="hidden sm:inline">Reset</span>
                        </button>
                        <button onClick={handleShare}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] text-white text-sm font-medium rounded-lg hover:bg-[#15803d] transition-all hover:shadow-lg hover:shadow-[#16A34A]/25">
                            <Share2 className="w-4 h-4" />{copied ? "Copied!" : "Share"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1100px] mx-auto px-6 py-8">
                {/* Player Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <PlayerSearchCard label="Player 1" player={player1} onSelect={setPlayer1} onClear={() => setPlayer1(null)} />
                    <PlayerSearchCard label="Player 2" player={player2} onSelect={setPlayer2} onClear={() => setPlayer2(null)} />
                </div>

                {/* VS Badge */}
                {player1 && player2 && (
                    <div className="flex justify-center -mt-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-[#0F172A] dark:bg-white flex items-center justify-center shadow-lg">
                            <span className="text-white dark:text-[#0F172A] font-black text-sm">VS</span>
                        </div>
                    </div>
                )}

                {/* Radar Chart */}
                {player1 && player2 && (
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white text-center mb-2">Stat Comparison</h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 text-center mb-6">Hover over the chart to see detailed values</p>
                        <div className="flex justify-center gap-8 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player1.teamColor }} />
                                <span className="text-sm font-medium text-[#0F172A] dark:text-white">{player1.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player2.teamColor }} />
                                <span className="text-sm font-medium text-[#0F172A] dark:text-white">{player2.name}</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={420}>
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="stat" tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} tickCount={5} />
                                <Radar name={player1.name} dataKey={player1.name} stroke={player1.teamColor} fill={player1.teamColor} fillOpacity={0.25} strokeWidth={2} animationDuration={800} />
                                <Radar name={player2.name} dataKey={player2.name} stroke={player2.teamColor} fill={player2.teamColor} fillOpacity={0.25} strokeWidth={2} animationDuration={800} />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Stat Bars */}
                {player1 && player2 && (
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white text-center mb-2">Head to Head</h2>
                        <div className="flex justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player1.teamColor }} />
                                <span className="text-sm font-bold text-[#0F172A] dark:text-white">{player1.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#0F172A] dark:text-white">{player2.name}</span>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player2.teamColor }} />
                            </div>
                        </div>
                        <StatComparisonBars player1={player1} player2={player2} />
                    </div>
                )}

                {/* Empty state */}
                {(!player1 || !player2) && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="text-5xl mb-4">⚽</div>
                        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">Select two players to compare</h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 text-center max-w-md">
                            Search and pick two players above to see their stats overlaid on a radar chart with head-to-head stat bars.
                        </p>
                        <div className="mt-8">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] dark:text-gray-500 text-center mb-3">Popular Comparisons</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {[["messi", "ronaldo"], ["haaland", "mbappe"], ["saka", "vinicius"], ["palmer", "bellingham"], ["salah", "son"]].map(([a, b]) => {
                                    const pA = getPlayerById(a);
                                    const pB = getPlayerById(b);
                                    if (!pA || !pB) return null;
                                    return (
                                        <button key={`${a}-${b}`} onClick={() => { setPlayer1(pA); setPlayer2(pB); }}
                                            className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-[#0F172A] dark:text-white hover:bg-[#16A34A]/10 hover:text-[#16A34A] transition-all">
                                            {pA.name} vs {pB.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-[#94A3B8] dark:text-gray-600 mt-8">
                    Stats are FIFA-inspired ratings. {localPlayers.length} players available locally. Add a FOOTBALL_API_KEY in Vercel for live API search.
                </p>
            </main>
        </div>
    );
}
