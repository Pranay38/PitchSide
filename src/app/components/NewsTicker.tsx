import { useState, useEffect, useCallback, useRef } from "react";
import { Newspaper, ExternalLink, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";

interface NewsItem {
    title: string;
    link: string;
    source: string;
    sourceIcon: string;
    pubDate: string;
    description: string;
    imageUrl: string | null;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    if (!date) return "";
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function NewsTicker() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(true);
    const [visibleCount, setVisibleCount] = useState(8);
    const tickerRef = useRef<HTMLDivElement>(null);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // Include cache buster
            const res = await fetch(`/api/news?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setNews(data.news || []);
            } else {
                setError("Could not load news");
            }
        } catch {
            setError("Failed to fetch news");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchNews();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchNews, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNews]);

    const showMore = () => setVisibleCount(v => Math.min(v + 8, news.length));
    const visibleNews = news.slice(0, visibleCount);

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-amber-500/5 to-transparent dark:from-amber-500/10 cursor-pointer select-none"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-amber-500" />
                        Breaking News
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); fetchNews(); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Refresh news"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-[#94A3B8] ${loading ? "animate-spin" : ""}`} />
                        </button>
                        {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                    </div>
                </div>
                {!expanded && news.length > 0 && (
                    <p className="text-[11px] text-[#94A3B8] mt-1 truncate">{news[0].sourceIcon} {news[0].title}</p>
                )}
            </div>

            {/* News List */}
            {expanded && (
                <div ref={tickerRef} className="max-h-[600px] overflow-y-auto">
                    {loading && news.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <RefreshCw className="w-5 h-5 animate-spin text-amber-500 mb-2" />
                            <span className="text-xs text-[#94A3B8]">Fetching latest news...</span>
                        </div>
                    ) : error && news.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <Newspaper className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm text-[#64748B]">{error}</p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {visibleNews.map((item, i) => (
                                    <a
                                        key={`${item.source}-${i}`}
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                                    >
                                        {/* Thumbnail */}
                                        {item.imageUrl && (
                                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                <img
                                                    src={item.imageUrl}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={e => (e.currentTarget.parentElement!.style.display = "none")}
                                                />
                                            </div>
                                        )}
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[13px] font-semibold text-[#0F172A] dark:text-white leading-snug line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                                    {item.sourceIcon} {item.source}
                                                </span>
                                                <span className="text-[10px] text-[#94A3B8]">{timeAgo(item.pubDate)}</span>
                                                <ExternalLink className="w-3 h-3 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                            {visibleCount < news.length && (
                                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={showMore}
                                        className="w-full text-center text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                    >
                                        Show more ({news.length - visibleCount} remaining)
                                    </button>
                                </div>
                            )}
                            {/* Source attribution */}
                            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0F172A]/30">
                                <p className="text-[9px] text-[#94A3B8] text-center">
                                    News from BBC Sport · The Guardian · ESPN · Sky Sports
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
