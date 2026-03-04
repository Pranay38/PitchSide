import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import {
    ArrowLeft, Flame, ThumbsUp, ThumbsDown, Send, MessageSquare,
    Loader2, Heart, ChevronDown, ChevronUp, TrendingUp,
} from "lucide-react";

interface Argument {
    id: string;
    side: "agree" | "disagree";
    author: string;
    text: string;
    createdAt: string;
    likes: number;
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
    createdAt: string;
    active: boolean;
}

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

    const fetchDebates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/debates");
            if (res.ok) setDebates(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    const fetchDetail = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/debates?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setExpandedDebate(data);
                // Also update the debate in the list
                setDebates(prev => prev.map(d => d.id === id ? { ...d, agreeVotes: data.agreeVotes, disagreeVotes: data.disagreeVotes } : d));
            }
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchDebates(); }, [fetchDebates]);

    const handleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            setExpandedDebate(null);
        } else {
            setExpandedId(id);
            fetchDetail(id);
        }
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

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">
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
                    <p className="text-gray-400 text-sm">Hot takes. Bold opinions. Your vote matters.</p>
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
                                            <div className="flex-1">
                                                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">{debate.category}</span>
                                                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{debate.title}</h3>
                                                {debate.description && <p className="text-sm text-gray-500 mt-1">{debate.description}</p>}
                                            </div>
                                        </div>

                                        {/* Vote bar */}
                                        <VoteBar agree={debate.agreeVotes} disagree={debate.disagreeVotes} />

                                        {/* Vote buttons */}
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => handleVote(debate.id, "agree")}
                                                disabled={hasVoted}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${hasVoted
                                                        ? "bg-white/5 text-gray-600 cursor-not-allowed"
                                                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                                    }`}
                                            >
                                                <ThumbsUp className="w-4 h-4" /> Agree
                                            </button>
                                            <button
                                                onClick={() => handleVote(debate.id, "disagree")}
                                                disabled={hasVoted}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${hasVoted
                                                        ? "bg-white/5 text-gray-600 cursor-not-allowed"
                                                        : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                                    }`}
                                            >
                                                <ThumbsDown className="w-4 h-4" /> Disagree
                                            </button>
                                        </div>

                                        {/* Expand for arguments */}
                                        <button
                                            onClick={() => handleExpand(debate.id)}
                                            className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 text-[12px] text-gray-500 hover:text-gray-300 transition font-medium"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {debate.totalArguments} argument{debate.totalArguments !== 1 ? "s" : ""}
                                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    </div>

                                    {/* Arguments section */}
                                    {isExpanded && (
                                        <div className="border-t border-white/5 bg-white/[0.01]">
                                            {/* Submit argument */}
                                            <div className="p-4 border-b border-white/5">
                                                <div className="flex gap-2 mb-2">
                                                    <button
                                                        onClick={() => setArgSide("agree")}
                                                        className={`px-3 py-1 text-[11px] rounded-full font-semibold transition ${argSide === "agree" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-gray-500"
                                                            }`}
                                                    >
                                                        👍 For
                                                    </button>
                                                    <button
                                                        onClick={() => setArgSide("disagree")}
                                                        className={`px-3 py-1 text-[11px] rounded-full font-semibold transition ${argSide === "disagree" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-gray-500"
                                                            }`}
                                                    >
                                                        👎 Against
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={argAuthor}
                                                        onChange={(e) => setArgAuthor(e.target.value)}
                                                        placeholder="Your name (optional)"
                                                        className="flex-1 bg-transparent text-[11px] text-gray-400 border-b border-white/10 focus:border-emerald-500/30 focus:outline-none px-2 py-1"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={argText}
                                                        onChange={(e) => setArgText(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && handleSubmitArg(debate.id)}
                                                        placeholder="Make your argument..."
                                                        className="flex-1 bg-white/5 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                                                        maxLength={500}
                                                    />
                                                    <button
                                                        onClick={() => handleSubmitArg(debate.id)}
                                                        disabled={submitting || !argText.trim()}
                                                        className="px-4 py-2.5 bg-emerald-500/15 text-emerald-400 rounded-lg text-sm font-semibold hover:bg-emerald-500/25 transition disabled:opacity-40"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

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
        </div>
    );
}
