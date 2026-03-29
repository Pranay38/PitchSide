import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router";
import {
    ArrowLeft, Flame, ThumbsUp, ThumbsDown, Send, MessageSquare, Share2, Clock,
    Loader2, Heart, ChevronDown, ChevronUp, Download, Timer,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SEO } from "../components/SEO";

interface Argument {
    id: string;
    side: "agree" | "disagree";
    author: string;
    text: string;
    createdAt: string;
    likes: number;
}

interface VoteHistoryEntry {
    side: "agree" | "disagree";
    timestamp: string;
}

interface Debate {
    id: string;
    title: string;
    description: string;
    category: string;
    agreeVotes: number;
    disagreeVotes: number;
    totalArguments: number;
    arguments?: Argument[];
    voteHistory?: VoteHistoryEntry[];
    createdAt: string;
    endsAt?: string;
    active: boolean;
}

// ─── Live Countdown Hook ───
function useCountdown(endsAt?: string) {
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!endsAt) { setTimeLeft(""); return; }

        const tick = () => {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft("00:00:00");
                setIsExpired(true);
                return;
            }
            setIsExpired(false);
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(
                `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
            );
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [endsAt]);

    return { timeLeft, isExpired };
}

// ─── Vote Bar ───
function VoteBar({ agree, disagree }: { agree: number; disagree: number }) {
    const total = agree + disagree || 1;
    const agreePct = Math.round((agree / total) * 100);
    const disagreePct = 100 - agreePct;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-emerald-400">Agree {agreePct}%</span>
                <span className="text-red-400">Disagree {disagreePct}%</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                <div className="bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${agreePct}%` }} />
                <div className="bg-red-500 rounded-full transition-all duration-700" style={{ width: `${disagreePct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
                <span>{agree} votes</span>
                <span>{disagree} votes</span>
            </div>
        </div>
    );
}

// ─── Swing Chart ───
function VoteSwingChart({ voteHistory }: { voteHistory: VoteHistoryEntry[] }) {
    if (!voteHistory || voteHistory.length < 2) return null;

    // Build cumulative time-series data
    let agreeCount = 0;
    let disagreeCount = 0;
    const dataPoints = voteHistory.map((entry) => {
        if (entry.side === "agree") agreeCount++;
        else disagreeCount++;
        return {
            time: new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            agree: agreeCount,
            disagree: disagreeCount,
        };
    });

    // Sample to max ~30 points for readability
    const step = Math.max(1, Math.floor(dataPoints.length / 30));
    const sampled = dataPoints.filter((_, i) => i % step === 0 || i === dataPoints.length - 1);

    return (
        <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Vote Momentum</p>
            <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={sampled}>
                    <defs>
                        <linearGradient id="agreeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="disagreeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                        contentStyle={{ background: "#1E293B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                        labelStyle={{ color: "#94A3B8" }}
                    />
                    <Area type="monotone" dataKey="agree" stroke="#10B981" strokeWidth={2} fill="url(#agreeGrad)" name="Agree" />
                    <Area type="monotone" dataKey="disagree" stroke="#EF4444" strokeWidth={2} fill="url(#disagreeGrad)" name="Disagree" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Shareable Result Card ───
function DebateResultCard({ debate, cardRef }: { debate: Debate; cardRef: React.RefObject<HTMLDivElement | null> }) {
    const total = debate.agreeVotes + debate.disagreeVotes || 1;
    const agreePct = Math.round((debate.agreeVotes / total) * 100);
    const disagreePct = 100 - agreePct;

    return (
        <div
            ref={cardRef}
            style={{ width: 600, padding: 40, position: "absolute", left: -9999, top: -9999, background: "linear-gradient(135deg, #0a0e1a 0%, #111827 45%, #0b1120 100%)" }}
        >
            <div style={{ borderBottom: "2px solid rgba(16,185,129,0.3)", paddingBottom: 20, marginBottom: 24 }}>
                <p style={{ color: "#10B981", fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                    DEBATE RESULT
                </p>
                <h2 style={{ color: "white", fontSize: 26, fontWeight: 900, lineHeight: 1.3 }}>{debate.title}</h2>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, background: "rgba(16,185,129,0.1)", borderRadius: 16, padding: 20, textAlign: "center" as const }}>
                    <p style={{ color: "#10B981", fontSize: 40, fontWeight: 900 }}>{agreePct}%</p>
                    <p style={{ color: "#6EE7B7", fontSize: 13, fontWeight: 700, marginTop: 4 }}>AGREE</p>
                    <p style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>{debate.agreeVotes} votes</p>
                </div>
                <div style={{ flex: 1, background: "rgba(239,68,68,0.1)", borderRadius: 16, padding: 20, textAlign: "center" as const }}>
                    <p style={{ color: "#EF4444", fontSize: 40, fontWeight: 900 }}>{disagreePct}%</p>
                    <p style={{ color: "#FCA5A5", fontSize: 13, fontWeight: 700, marginTop: 4 }}>DISAGREE</p>
                    <p style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>{debate.disagreeVotes} votes</p>
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ color: "#6B7280", fontSize: 11 }}>{debate.agreeVotes + debate.disagreeVotes} total votes • {debate.totalArguments} arguments</p>
                <p style={{ color: "#10B981", fontSize: 13, fontWeight: 900, letterSpacing: "0.1em" }}>⚽ PITCHSIDE</p>
            </div>
        </div>
    );
}

// ─── Countdown Badge ───
function CountdownBadge({ debate }: { debate: Debate }) {
    const { timeLeft, isExpired } = useCountdown(debate.endsAt);
    const isClosed = !debate.active || isExpired || (!debate.endsAt && (Date.now() - new Date(debate.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000));

    if (isClosed) {
        return <span className="text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">Closed</span>;
    }
    return (
        <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20 tabular-nums">
            <Timer className="w-2.5 h-2.5 animate-pulse" /> {timeLeft || "..."}
        </span>
    );
}

export function DebateCornerPage() {
    const [debates, setDebates] = useState<Debate[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedDebate, setExpandedDebate] = useState<Debate | null>(null);
    const [argText, setArgText] = useState("");
    const [argAuthor, setArgAuthor] = useState("");
    const [argSide, setArgSide] = useState<"agree" | "disagree">("agree");
    const [submitting, setSubmitting] = useState(false);
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
    const [sharingId, setSharingId] = useState<string | null>(null);
    const resultCardRef = useRef<HTMLDivElement>(null);

    const fetchDebates = useCallback(async () => {
        try {
            const res = await fetch("/api/debates");
            if (res.ok) {
                const data = await res.json();
                setDebates(data);
                setLoading(false);
            }
        } catch (e) { console.error(e); setLoading(false); }
    }, []);

    const fetchDetail = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/debates?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setExpandedDebate(data);
                setDebates(prev => prev.map(d => d.id === id ? { ...d, agreeVotes: data.agreeVotes, disagreeVotes: data.disagreeVotes } : d));
            }
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchDebates(); }, [fetchDebates]);

    // ─── Auto-refresh every 10s ───
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDebates();
            if (expandedId) fetchDetail(expandedId);
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchDebates, fetchDetail, expandedId]);

    const handleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setExpandedDebate(null);
        } else {
            setExpandedId(id);
            fetchDetail(id);
        }
    };

    const isDebateClosed = (debate: Debate) => {
        if (!debate.active) return true;
        if (debate.endsAt) return Date.now() > new Date(debate.endsAt).getTime();
        return Date.now() - new Date(debate.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;
    };

    const handleVote = async (id: string, side: "agree" | "disagree") => {
        if (votedIds.has(id)) return;
        try {
            await fetch("/api/debates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "vote", id, side }),
            });
            setVotedIds(prev => new Set(prev).add(id));
            setDebates(prev => prev.map(d => {
                if (d.id !== id) return d;
                return side === "agree"
                    ? { ...d, agreeVotes: d.agreeVotes + 1 }
                    : { ...d, disagreeVotes: d.disagreeVotes + 1 };
            }));
            if (expandedDebate?.id === id) {
                setExpandedDebate(prev => prev ? {
                    ...prev,
                    agreeVotes: side === "agree" ? prev.agreeVotes + 1 : prev.agreeVotes,
                    disagreeVotes: side === "disagree" ? prev.disagreeVotes + 1 : prev.disagreeVotes,
                } : null);
            }
        } catch (e) { console.error(e); }
    };

    const handleSubmitArg = async (debateId: string) => {
        if (!argText.trim() || submitting) return;
        setSubmitting(true);
        try {
            await fetch("/api/debates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "argue", id: debateId, side: argSide, author: argAuthor, text: argText }),
            });
            setArgText("");
            fetchDetail(debateId);
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const handleLike = async (debateId: string, argumentId: string) => {
        try {
            await fetch("/api/debates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "like", id: debateId, argumentId }),
            });
            fetchDetail(debateId);
        } catch (e) { console.error(e); }
    };

    const handleShareTwitter = (debate: Debate) => {
        const url = encodeURIComponent(window.location.origin + "/debates");
        const total = debate.agreeVotes + debate.disagreeVotes || 1;
        const agreePct = Math.round((debate.agreeVotes / total) * 100);
        const text = encodeURIComponent(`🔥 ${debate.title}\n\n✅ ${agreePct}% Agree • ❌ ${100 - agreePct}% Disagree\n\nCast your vote on The Touchline Dribble!`);
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    };

    const handleShareWhatsApp = (debate: Debate) => {
        const url = window.location.origin + "/debates";
        const total = debate.agreeVotes + debate.disagreeVotes || 1;
        const agreePct = Math.round((debate.agreeVotes / total) * 100);
        const text = `🔥 ${debate.title}\n\n✅ ${agreePct}% Agree • ❌ ${100 - agreePct}% Disagree\n\nCast your vote 👉 ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const handleShareResultCard = async (debate: Debate) => {
        setSharingId(debate.id);
        // Give time for the hidden result card to render
        await new Promise(r => setTimeout(r, 200));
        try {
            const html2canvas = (await import("html2canvas")).default;
            if (!resultCardRef.current) return;
            const canvas = await html2canvas(resultCardRef.current, {
                backgroundColor: null,
                scale: 2,
            });
            const link = document.createElement("a");
            link.download = `pitchside-debate-${debate.id}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (e) {
            console.error("Failed to generate result card:", e);
        }
        setSharingId(null);
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">
            <SEO
                title="Debate Corner"
                description="Hot takes. Bold opinions. Your vote matters. Join the football debate on The Touchline Dribble."
                type="website"
                url="https://pitchside-orcin.vercel.app/debates"
            />
            <div className="sticky top-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <h1 className="text-sm font-bold text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" /> Debate Corner
                    </h1>
                    <div className="w-16" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">🔥 Debate Corner</h1>
                    <p className="text-gray-400 text-sm">Hot takes. Bold opinions. Live vote tracking.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
                        <p className="text-gray-500 text-sm">Loading debates...</p>
                    </div>
                ) : debates.length === 0 ? (
                    <div className="text-center py-16">
                        <Flame className="w-12 h-12 mx-auto text-gray-700 mb-3" />
                        <p className="text-gray-400 text-sm font-medium">No debates yet</p>
                        <p className="text-gray-600 text-xs mt-1">Hot takes will appear here soon!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {debates.map((debate) => {
                            const isExpanded = expandedId === debate.id;
                            const hasVoted = votedIds.has(debate.id);
                            const isClosed = isDebateClosed(debate);

                            return (
                                <div
                                    key={debate.id}
                                    className="rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 overflow-hidden transition-all"
                                >
                                    {/* Debate header */}
                                    <div className="p-5 sm:p-6">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center flex-shrink-0">
                                                <Flame className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">{debate.category}</span>
                                                        <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 pr-2">{debate.title}</h3>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => handleShareWhatsApp(debate)}
                                                                className="text-gray-500 hover:text-[#25D366] transition bg-white/5 p-1.5 rounded-lg"
                                                                title="Share on WhatsApp"
                                                            >
                                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleShareTwitter(debate)}
                                                                className="text-gray-500 hover:text-[#1DA1F2] transition bg-white/5 p-1.5 rounded-lg"
                                                                title="Share to Twitter"
                                                            >
                                                                <Share2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleShareResultCard(debate)}
                                                                className="text-gray-500 hover:text-emerald-400 transition bg-white/5 p-1.5 rounded-lg"
                                                                title="Download Result Card"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <CountdownBadge debate={debate} />
                                                    </div>
                                                </div>
                                                {debate.description && <p className="text-sm text-gray-500 mt-2">{debate.description}</p>}
                                            </div>
                                        </div>

                                        {/* Expand for arguments */}
                                        <button
                                            onClick={() => handleExpand(debate.id)}
                                            className="flex items-center justify-center gap-1.5 w-full mt-3 mb-4 py-2 text-[12px] text-gray-500 hover:text-gray-300 transition font-medium"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {debate.totalArguments} argument{debate.totalArguments !== 1 ? "s" : ""}
                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>

                                        {/* Vote bar */}
                                        <VoteBar agree={debate.agreeVotes} disagree={debate.disagreeVotes} />

                                        {/* Vote buttons */}
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => handleVote(debate.id, "agree")}
                                                disabled={hasVoted || isClosed}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-sm transition ${hasVoted
                                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-black cursor-not-allowed"
                                                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                                    }`}
                                            >
                                                <ThumbsUp className="w-4 h-4" /> {isClosed ? "Closed" : hasVoted ? "Voted" : "I Agree"}
                                            </button>
                                            <button
                                                onClick={() => handleVote(debate.id, "disagree")}
                                                disabled={hasVoted || isClosed}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-sm transition ${hasVoted
                                                        ? "bg-red-500/10 text-red-500 border border-red-500/30 font-black cursor-not-allowed"
                                                        : "bg-red-600 hover:bg-red-500 text-white"
                                                    }`}
                                            >
                                                <ThumbsDown className="w-4 h-4" /> {isClosed ? "Closed" : hasVoted ? "Voted" : "I Disagree"}
                                            </button>
                                        </div>

                                        {/* Vote Swing Chart (only in expanded view) */}
                                        {isExpanded && expandedDebate?.id === debate.id && expandedDebate.voteHistory && (
                                            <VoteSwingChart voteHistory={expandedDebate.voteHistory} />
                                        )}
                                    </div>

                                    {/* Arguments section */}
                                    {isExpanded && (
                                        <div className="border-t border-white/5 bg-white/[0.01]">
                                            {!isClosed ? (
                                                <>
                                                    {/* Submit argument */}
                                                    <div className="p-4 border-b border-white/5 bg-black/20">
                                                        <div className="flex gap-2 mb-3">
                                                            <button
                                                                onClick={() => setArgSide("agree")}
                                                                className={`px-3 py-1 text-[11px] rounded-full font-semibold transition ${argSide === "agree" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-gray-500 border border-transparent hover:bg-white/10"
                                                                    }`}
                                                            >
                                                                👍 For
                                                            </button>
                                                            <button
                                                                onClick={() => setArgSide("disagree")}
                                                                className={`px-3 py-1 text-[11px] rounded-full font-semibold transition ${argSide === "disagree" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-gray-500 border border-transparent hover:bg-white/10"
                                                                    }`}
                                                            >
                                                                👎 Against
                                                            </button>
                                                            <input
                                                                type="text"
                                                                value={argAuthor}
                                                                onChange={(e) => setArgAuthor(e.target.value)}
                                                                placeholder="Your name (optional)"
                                                                className="flex-1 bg-transparent text-[11px] text-gray-400 border-b border-white/10 focus:border-emerald-500/30 focus:outline-none px-2 py-1 ml-2"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={argText}
                                                                onChange={(e) => setArgText(e.target.value)}
                                                                onKeyDown={(e) => e.key === "Enter" && handleSubmitArg(debate.id)}
                                                                placeholder="Make your argument..."
                                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                                                                maxLength={500}
                                                            />
                                                            <button
                                                                onClick={() => handleSubmitArg(debate.id)}
                                                                disabled={submitting || !argText.trim()}
                                                                className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all disabled:opacity-40 disabled:shadow-none"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-4 border-b border-white/5 bg-red-500/5 text-center">
                                                    <p className="text-xs text-red-400/80 font-medium">Voting and arguments are closed for this debate.</p>
                                                </div>
                                            )}

                                            {/* Arguments list */}
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {!expandedDebate ? (
                                                    <div className="p-6 text-center">
                                                        <Loader2 className="w-5 h-5 animate-spin text-gray-600 mx-auto" />
                                                    </div>
                                                ) : (expandedDebate.arguments || []).length === 0 ? (
                                                    <div className="p-6 text-center text-gray-600 text-sm">
                                                        No arguments yet. Be the first to weigh in!
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-white/5">
                                                        {(expandedDebate.arguments || [])
                                                            .sort((a, b) => b.likes - a.likes)
                                                            .map((arg) => (
                                                                <div key={arg.id} className="px-4 py-3 flex gap-3">
                                                                    <div className={`w-1 rounded-full flex-shrink-0 ${arg.side === "agree" ? "bg-emerald-500" : "bg-red-500"}`} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-xs font-semibold text-gray-300">{arg.author}</span>
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${arg.side === "agree" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                                                                }`}>
                                                                                {arg.side === "agree" ? "For" : "Against"}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-400 leading-relaxed">{arg.text}</p>
                                                                        <button
                                                                            onClick={() => handleLike(debate.id, arg.id)}
                                                                            className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-600 hover:text-red-400 transition"
                                                                        >
                                                                            <Heart className="w-3 h-3" /> {arg.likes}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Hidden result card for html2canvas capture */}
            {sharingId && debates.find(d => d.id === sharingId) && (
                <DebateResultCard debate={debates.find(d => d.id === sharingId)!} cardRef={resultCardRef} />
            )}
        </div>
    );
}
