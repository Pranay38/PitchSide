import { useState, useEffect } from "react";
import { MessageSquareQuote, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";

export interface RumorMill {
    text: string;
    sentimentScore: number;
    punchyLine?: string;
}

interface RumorMillWidgetProps {
    data: RumorMill;
}

export function RumorMillWidget({ data }: RumorMillWidgetProps) {
    const [punchyLine, setPunchyLine] = useState<string | null>(null);
    const [loadingLine, setLoadingLine] = useState(false);

    useEffect(() => {
        if (!data?.text) return;
        if (data.punchyLine) {
            setPunchyLine(data.punchyLine);
            return;
        }

        // Check sessionStorage first to avoid repeated API calls
        // Replace btoa which crashes on non-Latin1 characters (emojis, curly quotes)
        const safeHash = data.text.slice(0, 50).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cacheKey = `rumour-ai-${safeHash}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            setPunchyLine(cached);
            return;
        }

        setLoadingLine(true);

        fetch("/api/ai-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "rumour-rater",
                text: data.text, // Pass raw rumor text for AI analysis
            }),
        })
            .then(res => res.json())
            .then(json => {
                if (json.data) {
                    const line = json.data.trim();
                    setPunchyLine(line);
                    sessionStorage.setItem(cacheKey, line);
                } else {
                    setPunchyLine("Hot take unavailable right now, but the fans are buzzing! Expect movement soon.");
                }
            })
            .catch(() => { 
                const fallback = "Here we go! This is exactly the kind of aggressive rebuilding the fans were told to expect this summer.";
                setPunchyLine(fallback);
            })
            .finally(() => setLoadingLine(false));
    }, [data?.text]);

    if (!data) return null;

    // Sentiment 0-100. < 40 is negative, 40-60 is neutral, > 60 is positive.
    const getSentimentText = (score: number) => {
        if (score > 60) return "Fans Love It";
        if (score < 40) return "Fans Hate It";
        return "Divided Opinion";
    };

    const getSentimentColor = (score: number) => {
        if (score > 60) return "text-green-500";
        if (score < 40) return "text-red-500";
        return "text-yellow-500";
    };

    const getGradientColor = (score: number) => {
        if (score > 60) return "from-green-500 to-green-400";
        if (score < 40) return "from-red-500 to-rose-400";
        return "from-yellow-500 to-amber-400";
    };

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquareQuote className="w-5 h-5 text-blue-500" />
                <h3 className="text-base uppercase tracking-wider font-black font-outfit text-[#0F172A] dark:text-white">
                    Rumor of the Day
                </h3>
            </div>

            <div className="relative z-10">
                {/* Quote Block */}
                <blockquote className="text-lg font-serif italic text-gray-800 dark:text-gray-200 border-l-4 border-blue-500 pl-4 py-1 mb-4">
                    "{data.text}"
                </blockquote>

                {/* AI Punchy Line */}
                {loadingLine && (
                    <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20 animate-pulse">
                        <Sparkles className="w-4 h-4 text-purple-500 animate-spin" />
                        <span className="text-xs font-medium text-purple-500 dark:text-purple-400">Analysing this rumour...</span>
                    </div>
                )}

                {punchyLine && !loadingLine && (
                    <div className="mb-4 px-4 py-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 dark:text-purple-400">Hot Take</span>
                        </div>
                        <p className="text-sm font-medium italic text-purple-700 dark:text-purple-300 leading-relaxed">
                            "{punchyLine}"
                        </p>
                    </div>
                )}

                {/* Sentiment Analysis Meter */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Social Sentiment
                        </span>
                        <span className={`text-xs font-bold ${getSentimentColor(data.sentimentScore)} flex items-center gap-1`}>
                            {data.sentimentScore > 50 ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                            {getSentimentText(data.sentimentScore)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400 font-medium">Hate</span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                            {/* 0-100 meter, origin left */}
                            <div
                                className={`h-full bg-gradient-to-r rounded-full transition-all duration-1000 ${getGradientColor(data.sentimentScore)}`}
                                style={{ width: `${data.sentimentScore}%` }}
                            />
                        </div>
                        <span className="text-xs text-green-500 font-medium">Love</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
