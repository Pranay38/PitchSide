import { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/router-compat";
import { Flame, ThumbsUp, ThumbsDown, Vote, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { VotingGatewayModal } from "./VotingGatewayModal";

interface Debate {
    id: string;
    title: string;
    description: string;
    category: string;
    agreeVotes: number;
    disagreeVotes: number;
    totalArguments: number;
    active: boolean;
    endsAt?: string;
}

export function DebateWidget() {
    const [activeDebate, setActiveDebate] = useState<Debate | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Gateway State
    const [showGateway, setShowGateway] = useState(false);
    const [pendingVote, setPendingVote] = useState<"agree" | "disagree" | null>(null);
    
    // Check local storage for votes
    const getVotedState = (id: string) => localStorage.getItem(`voted_debate_${id}`);
    const [votedSide, setVotedSide] = useState<string | null>(null);

    const fetchDebates = useCallback(async () => {
        try {
            const res = await fetch("/api/debates");
            if (res.ok) {
                const data: Debate[] = await res.json();
                // Find the newest active debate that hasn't expired
                const active = data.find(d => {
                    if (!d.active) return false;
                    if (d.endsAt && new Date(d.endsAt).getTime() < Date.now()) return false;
                    return true;
                });
                
                if (active) {
                    setActiveDebate(active);
                    setVotedSide(getVotedState(active.id));
                }
            }
        } catch (e) {
            console.error("Failed to fetch debates widget:", e);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDebates();
    }, [fetchDebates]);

    const handleVote = async (side: "agree" | "disagree", bypassGateway = false) => {
        if (!activeDebate || votedSide || submitting) return;
        
        if (!bypassGateway) {
            const storedEmail = localStorage.getItem("pitchside_subscriber_email");
            if (!storedEmail) {
                setPendingVote(side);
                setShowGateway(true);
                return;
            }
        }

        setSubmitting(true);
        
        try {
            const res = await fetch("/api/debates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "vote", id: activeDebate.id, side })
            });
            
            if (res.ok) {
                localStorage.setItem(`voted_debate_${activeDebate.id}`, side);
                setVotedSide(side);
                setActiveDebate(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        agreeVotes: side === "agree" ? prev.agreeVotes + 1 : prev.agreeVotes,
                        disagreeVotes: side === "disagree" ? prev.disagreeVotes + 1 : prev.disagreeVotes
                    };
                });
            }
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="rounded-[2rem] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] p-6 shadow-sm flex items-center justify-center min-h-[250px]">
                <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
            </div>
        );
    }

    if (!activeDebate) return null;

    const total = activeDebate.agreeVotes + activeDebate.disagreeVotes || 1;
    const agreePct = Math.round((activeDebate.agreeVotes / total) * 100);
    const disagreePct = 100 - agreePct;

    return (
        <>
        <div className="rounded-[2rem] border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white dark:from-[#0F172A] to-gray-50 dark:to-[#0B1120] p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full -z-0"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-sm uppercase tracking-widest">
                    <Flame className="w-4 h-4 fill-current animate-pulse" />
                    Debate Arena
                </div>
                {votedSide && (
                    <span className="text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A] px-2 py-1 rounded-full uppercase">
                        Voted
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white mb-2 leading-tight">
                    {activeDebate.title}
                </h3>
                {activeDebate.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 line-clamp-2">
                        {activeDebate.description}
                    </p>
                )}

                {votedSide ? (
                    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        {/* Vote Results Bar */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className={votedSide === "agree" ? "text-emerald-500 flex items-center gap-1" : "text-gray-500"}>
                                    Agree {agreePct}% {votedSide === "agree" && <Vote className="w-3 h-3" />}
                                </span>
                                <span className={votedSide === "disagree" ? "text-red-500 flex items-center gap-1" : "text-gray-500"}>
                                    {votedSide === "disagree" && <Vote className="w-3 h-3" />} Disagree {disagreePct}%
                                </span>
                            </div>
                            <div className="flex h-3 rounded-full overflow-hidden gap-1 bg-gray-100 dark:bg-gray-800 border-2 border-transparent">
                                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${agreePct}%` }} />
                                <div className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out" style={{ width: `${disagreePct}%` }} />
                            </div>
                            <p className="text-[10px] text-center text-gray-500 font-medium pt-1 uppercase tracking-wider">
                                {total} total votes
                            </p>
                        </div>
                        
                        <Link 
                            to="/debates"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] hover:opacity-90 transition rounded-xl text-sm font-bold shadow-md hover:shadow-lg"
                        >
                            Enter Debate Corner <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleVote("agree")}
                            disabled={submitting}
                            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-white dark:bg-[#1E293B] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-gray-200 dark:border-gray-700 hover:border-emerald-500/30 rounded-xl text-sm font-bold text-[#0F172A] dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-all disabled:opacity-50 group shadow-sm hover:shadow-emerald-500/20"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ThumbsUp className="w-4 h-4" />
                            </div>
                            Agree
                        </button>
                        <button
                            onClick={() => handleVote("disagree")}
                            disabled={submitting}
                            className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-white dark:bg-[#1E293B] hover:bg-red-50 dark:hover:bg-red-500/10 border border-gray-200 dark:border-gray-700 hover:border-red-500/30 rounded-xl text-sm font-bold text-[#0F172A] dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-50 group shadow-sm hover:shadow-red-500/20"
                        >
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ThumbsDown className="w-4 h-4" />
                            </div>
                            Disagree
                        </button>
                    </div>
                )}
                
                {!votedSide && (
                    <div className="flex justify-between items-center mt-5">
                       <p className="text-xs text-gray-500 font-medium">
                           {activeDebate.totalArguments} comments in arena
                       </p>
                       <Link to="/debates" className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                           See debate details <ExternalLink className="w-3 h-3" />
                       </Link>
                    </div>
                )}
            </div>
        </div>
        <VotingGatewayModal 
            isOpen={showGateway} 
            onClose={() => { setShowGateway(false); setPendingVote(null); }}
            onComplete={(email) => {
                setShowGateway(false);
                if (pendingVote) handleVote(pendingVote, true);
            }}
            featureName="cast your vote"
        />
        </>
    );
}
