import { MessageSquareQuote, ThumbsUp, ThumbsDown } from "lucide-react";

export interface RumorMill {
    text: string;
    sentimentScore: number;
}

interface RumorMillWidgetProps {
    data: RumorMill;
}

export function RumorMillWidget({ data }: RumorMillWidgetProps) {
    if (!data) return null;

    // Sentiment 0-100. < 40 is negative, 40-60 is neutral, > 60 is positive.
    const getSentimentText = (score: number) => {
        if (score > 60) return "Fans Love It";
        if (score < 40) return "Fans Hate It";
        return "Divided Opinion";
    };

    const getSentimentColor = (score: number) => {
        if (score > 60) return "text-accent-theme";
        if (score < 40) return "text-red-500";
        return "text-yellow-500";
    };

    const getGradientColor = (score: number) => {
        if (score > 60) return "from-accent-theme to-accent-light";
        if (score < 40) return "from-red-500 to-rose-400";
        return "from-yellow-500 to-amber-400";
    };

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquareQuote className="w-5 h-5 text-blue-500" />
                <h3 className="text-base uppercase tracking-wider font-black font-outfit text-[#0F172A] dark:text-white">
                    Rumor of the Day
                </h3>
            </div>

            <div className="relative z-10">
                {/* Quote Block */}
                <blockquote className="text-lg font-serif italic text-gray-800 dark:text-gray-200 border-l-4 border-blue-500 pl-4 py-1 mb-5">
                    "{data.text}"
                </blockquote>

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
                        <span className="text-xs text-accent-theme font-medium">Love</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
