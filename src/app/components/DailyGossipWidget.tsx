import { useState, useEffect } from "react";
import { MessageCircle, RefreshCw, Flame, ExternalLink, MessageSquare } from "lucide-react";

interface SentimentData {
    mode: "sentiment";
    positive: number;
    negative: number;
    neutral: number;
    total: number;
    topPositive: string[];
    topNegative: string[];
    mood: string;
    moodEmoji: string;
    analyzedThreads: string[];
}

function SentimentBar({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
    return (
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div style={{ width: `${positive}%` }} className="bg-emerald-500 h-full transition-all duration-1000" />
            <div style={{ width: `${neutral}%` }} className="bg-gray-400 h-full transition-all duration-1000" />
            <div style={{ width: `${negative}%` }} className="bg-red-500 h-full transition-all duration-1000" />
        </div>
    );
}

export function DailyGossipWidget() {
    const [sentiment, setSentiment] = useState<SentimentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function fetchSentiment() {
            try {
                const res = await fetch("/api/sys?action=fan-pulse&mode=sentiment");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (mounted) {
                    setSentiment(data);
                    setLoading(false);
                }
            } catch {
                if (mounted) setLoading(false);
            }
        }

        fetchSentiment();
        return () => { mounted = false; };
    }, []);

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:glow-violet transition-all duration-300 pointer-events-auto">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-violet-500" />
                    <h3 className="text-base uppercase tracking-wider font-black font-outfit text-[#0F172A] dark:text-white">
                        Fan Pulse
                    </h3>
                </div>
                <a
                    href="https://www.reddit.com/r/soccer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                    title="Open r/soccer"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <RefreshCw className="w-5 h-5 animate-spin text-violet-500 mb-2" />
                    <span className="text-xs text-[#94A3B8]">Analyzing fan sentiment...</span>
                </div>
            ) : sentiment ? (
                <div className="space-y-5">
                    {/* Mood Header */}
                    <div className="text-center">
                        <span className="text-5xl">{sentiment.moodEmoji}</span>
                        <h4 className="text-lg font-black text-[#0F172A] dark:text-white mt-1">{sentiment.mood}</h4>
                        <p className="text-[11px] text-[#94A3B8] mt-1">
                            Based on {sentiment.total} comments across top threads
                        </p>
                    </div>

                    {/* Sentiment Bar */}
                    <div>
                        <SentimentBar positive={sentiment.positive} negative={sentiment.negative} neutral={sentiment.neutral} />
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">😊 Positive {sentiment.positive}%</span>
                            <span className="text-[10px] font-bold text-gray-400">😐 Neutral {sentiment.neutral}%</span>
                            <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">😤 Negative {sentiment.negative}%</span>
                        </div>
                    </div>

                    {/* Analyzed Threads */}
                    {sentiment.analyzedThreads.length > 0 && (
                        <div>
                            <h5 className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" /> Hot Threads
                            </h5>
                            <div className="space-y-1.5">
                                {sentiment.analyzedThreads.map((t, i) => (
                                    <p key={i} className="text-[11px] text-[#334155] dark:text-[#CBD5E1] leading-snug flex items-start gap-2">
                                        <MessageSquare className="w-3 h-3 text-violet-500 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">{t}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-sm text-[#64748B]">Could not analyze sentiment.</p>
                </div>
            )}
        </div>
    );
}
