import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react";

interface FeedSource {
    id: string;
    name: string;
    handle: string;
    icon: string;
    profileUrl: string;
}

interface SocialItem {
    id: string;
    title: string;
    summary: string;
    link: string;
    pubDate: string;
    source: string;
    sourceIcon: string;
}

const FEED: FeedSource = {
    id: "r-soccer",
    name: "Fan Feed",
    handle: "Feed",
    icon: "⚽",
    profileUrl: "https://www.reddit.com/r/soccer",
};

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

export function SocialFeed() {
    const [expanded, setExpanded] = useState(true);
    const [items, setItems] = useState<SocialItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");

    const fetchFeed = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/news?source=${encodeURIComponent(FEED.id)}&t=${Date.now()}`);
            if (!response.ok) {
                throw new Error("Could not load feed.");
            }
            const payload = await response.json();
            setItems(payload.items || []);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } catch (fetchError: any) {
            setError(fetchError?.message || "Failed to load social feed.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!expanded) return;
        fetchFeed();
        const timer = setInterval(fetchFeed, 3 * 60 * 1000);
        return () => clearInterval(timer);
    }, [expanded, fetchFeed]);

    const visibleItems = useMemo(() => items.slice(0, 15), [items]);

    return (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div
                onClick={() => setExpanded((prev) => !prev)}
                className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent cursor-pointer select-none"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-xl">📱</span>
                        Fan Feed
                        <span className="ml-2 text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live
                        </span>
                    </h3>
                    <div className="flex items-center gap-2">
                        {expanded && (
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    fetchFeed();
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-[#94A3B8] ${loading ? "animate-spin" : ""}`} />
                            </button>
                        )}
                        {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                    </div>
                </div>
                {!expanded && (
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        {FEED.icon} Live fan updates
                    </p>
                )}
            </div>

            {expanded && (
                <>
                    <div className="max-h-[560px] overflow-y-auto">
                        {loading && items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mb-2" />
                                <span className="text-xs text-[#94A3B8] font-medium">Loading {FEED.name}...</span>
                            </div>
                        ) : error && items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <p className="text-sm font-semibold text-red-500">{error}</p>
                                <p className="text-xs text-[#94A3B8] mt-2">This widget pulls the latest fan updates in real time.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {visibleItems.map((item) => (
                                    <a
                                        key={item.id}
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white leading-snug line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                                    {item.title}
                                                </p>
                                                {item.summary && (
                                                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 line-clamp-2">{item.summary}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-[#94A3B8]">{timeAgo(item.pubDate)}</span>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-3 h-3 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50/80 dark:bg-[#0B1120]/80 p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <p className="text-[9px] text-[#94A3B8]">
                            {lastUpdated ? `Updated ${lastUpdated}` : ""}
                        </p>
                        <a
                            href={FEED.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-sky-500 hover:text-sky-400 transition-colors"
                        >
                            Open {FEED.handle} ↗
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
