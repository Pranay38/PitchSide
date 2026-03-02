import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink, ThumbsUp, MessageCircle, Award } from "lucide-react";

/* ── Types ── */
interface RedditComment {
    id: string;
    author: string;
    body: string;
    score: number;
    awards: number;
    permalink: string;
    created: string;
    flair: string;
}

interface RedditPost {
    id: string;
    title: string;
    score: number;
    numComments: number;
    permalink: string;
    created: string;
    flair: string;
    author: string;
}

interface SentimentData {
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

type FanTab = "reactions" | "twitter" | "sentiment";

/* ── X/Twitter Hashtag Timelines ── */
const TWITTER_FEEDS = [
    { label: "#EPL", query: "#PremierLeague", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { label: "#UCL", query: "#UCL", emoji: "🏆" },
    { label: "#LaLiga", query: "#LaLiga", emoji: "🇪🇸" },
    { label: "#SerieA", query: "#SerieA", emoji: "🇮🇹" },
    { label: "#Bundesliga", query: "#Bundesliga", emoji: "🇩🇪" },
    { label: "#TransferNews", query: "#TransferNews", emoji: "🔔" },
];

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    if (!date) return "";
    const mins = Math.floor((now - date) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}

function formatScore(score: number): string {
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return `${score}`;
}

function truncateBody(body: string, maxLen = 200): string {
    const cleaned = body.replace(/\n{2,}/g, "\n").trim();
    if (cleaned.length <= maxLen) return cleaned;
    return cleaned.slice(0, maxLen).trimEnd() + "…";
}

/* ── Sentiment Bar ── */
function SentimentBar({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
    return (
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
            {positive > 0 && (
                <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 flex items-center justify-center"
                    style={{ width: `${positive}%` }}
                >
                    {positive > 15 && <span className="text-[8px] font-bold text-white">{positive}%</span>}
                </div>
            )}
            {neutral > 0 && (
                <div
                    className="bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600 transition-all duration-700 flex items-center justify-center"
                    style={{ width: `${neutral}%` }}
                >
                    {neutral > 15 && <span className="text-[8px] font-bold text-gray-600 dark:text-gray-300">{neutral}%</span>}
                </div>
            )}
            {negative > 0 && (
                <div
                    className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700 flex items-center justify-center"
                    style={{ width: `${negative}%` }}
                >
                    {negative > 15 && <span className="text-[8px] font-bold text-white">{negative}%</span>}
                </div>
            )}
        </div>
    );
}

/* ── Main Component ── */
export function FanPulse() {
    const [activeTab, setActiveTab] = useState<FanTab>("reactions");
    const [expanded, setExpanded] = useState(true);
    const [loading, setLoading] = useState(false);

    // Reactions state
    const [hotPosts, setHotPosts] = useState<RedditPost[]>([]);
    const [topComments, setTopComments] = useState<RedditComment[]>([]);
    const [threadTitle, setThreadTitle] = useState("");
    const [threadLink, setThreadLink] = useState("");
    const [showComments, setShowComments] = useState(false);

    // Sentiment state
    const [sentiment, setSentiment] = useState<SentimentData | null>(null);

    // Twitter state
    const [selectedFeed, setSelectedFeed] = useState(0);
    const twitterRef = useRef<HTMLDivElement>(null);

    const fetchReactions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/fan-pulse?mode=reactions&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setHotPosts(data.hotPosts || []);
                setTopComments(data.topComments || []);
                setThreadTitle(data.threadTitle || "");
                setThreadLink(data.threadPermalink || "");
            }
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    const fetchSentiment = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/fan-pulse?mode=sentiment&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setSentiment(data);
            }
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    // Load Twitter widget
    useEffect(() => {
        if (activeTab !== "twitter" || !expanded) return;
        const feed = TWITTER_FEEDS[selectedFeed];
        if (!twitterRef.current) return;

        twitterRef.current.innerHTML = `
            <a class="twitter-timeline"
               href="https://twitter.com/search?q=${encodeURIComponent(feed.query + " lang:en")}"
               data-theme="dark"
               data-chrome="noheader nofooter noborders transparent"
               data-tweet-limit="8"
               data-height="480">
                Loading ${feed.label}...
            </a>
        `;

        const existing = document.querySelector('script[src*="platform.twitter.com"]');
        if (existing) {
            (window as any).twttr?.widgets?.load?.(twitterRef.current);
        } else {
            const script = document.createElement("script");
            script.src = "https://platform.twitter.com/widgets.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, [activeTab, selectedFeed, expanded]);

    useEffect(() => {
        if (!expanded) return;
        if (activeTab === "reactions") fetchReactions();
        else if (activeTab === "sentiment") fetchSentiment();
    }, [activeTab, expanded, fetchReactions, fetchSentiment]);

    const tabBtn = (tab: FanTab, label: string, emoji: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 text-[12px] font-bold rounded-xl transition-all ${activeTab === tab
                    ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                    : "text-[#64748B] hover:bg-gray-100 dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                }`}
        >
            <span>{emoji}</span>
            {label}
        </button>
    );

    return (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent cursor-pointer select-none"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-xl">🗣️</span>
                        Fan Pulse
                        <span className="ml-2 text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        {expanded && (
                            <button
                                onClick={(e) => { e.stopPropagation(); activeTab === "reactions" ? fetchReactions() : fetchSentiment(); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-[#94A3B8] ${loading ? "animate-spin" : ""}`} />
                            </button>
                        )}
                        {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                    </div>
                </div>
                {!expanded && <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Fan reactions, X timelines & sentiment analysis</p>}
            </div>

            {expanded && (
                <>
                    {/* Tabs */}
                    <div className="p-3 bg-gray-50/50 dark:bg-[#0B1120]/50 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex gap-1.5 p-1 bg-gray-200/50 dark:bg-[#1E293B] rounded-xl">
                            {tabBtn("reactions", "Fan Reactions", "🗣️")}
                            {tabBtn("twitter", "X / Twitter", "𝕏")}
                            {tabBtn("sentiment", "Sentiment", "📊")}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-[560px] overflow-y-auto">
                        {/* ── REACTIONS TAB ── */}
                        {activeTab === "reactions" && (
                            loading && hotPosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <RefreshCw className="w-6 h-6 animate-spin text-violet-500 mb-2" />
                                    <span className="text-xs text-[#94A3B8]">Loading fan reactions...</span>
                                </div>
                            ) : (
                                <div>
                                    {/* Hot Posts */}
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {hotPosts.map((post) => (
                                            <a
                                                key={post.id}
                                                href={post.permalink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        {post.flair && (
                                                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 mb-1">
                                                                {post.flair}
                                                            </span>
                                                        )}
                                                        <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                            {post.title}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                                                                <ThumbsUp className="w-3 h-3" /> {formatScore(post.score)}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                                                                <MessageCircle className="w-3 h-3" /> {post.numComments}
                                                            </span>
                                                            <span className="text-[10px] text-[#94A3B8]">u/{post.author}</span>
                                                            <span className="text-[10px] text-[#94A3B8]">{timeAgo(post.created)}</span>
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>

                                    {/* Top Comments Section */}
                                    {topComments.length > 0 && (
                                        <div className="border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                onClick={() => setShowComments(!showComments)}
                                                className="w-full px-4 py-2.5 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent dark:from-orange-500/10 hover:from-orange-500/10 dark:hover:from-orange-500/15 transition-colors"
                                            >
                                                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                                                    🔥 Top Fan Comments — {threadTitle.slice(0, 50)}{threadTitle.length > 50 ? "…" : ""}
                                                </span>
                                                {showComments ? <ChevronUp className="w-3.5 h-3.5 text-orange-500" /> : <ChevronDown className="w-3.5 h-3.5 text-orange-500" />}
                                            </button>

                                            {showComments && (
                                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {topComments.map((comment) => (
                                                        <a
                                                            key={comment.id}
                                                            href={comment.permalink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block px-4 py-3 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {/* Vote score */}
                                                                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 min-w-[36px]">
                                                                    <span className="text-[12px] font-black text-orange-500">{formatScore(comment.score)}</span>
                                                                    <ThumbsUp className="w-3 h-3 text-orange-400" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">u/{comment.author}</span>
                                                                        {comment.flair && (
                                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[#64748B]">{comment.flair}</span>
                                                                        )}
                                                                        {comment.awards > 0 && (
                                                                            <span className="flex items-center gap-0.5 text-[9px] text-amber-500">
                                                                                <Award className="w-3 h-3" /> {comment.awards}
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[9px] text-[#94A3B8]">{timeAgo(comment.created)}</span>
                                                                    </div>
                                                                    <p className="text-[12px] text-[#334155] dark:text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                                                                        {truncateBody(comment.body)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    ))}
                                                    {threadLink && (
                                                        <a
                                                            href={threadLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block px-4 py-2.5 text-center text-[11px] font-bold text-orange-500 hover:text-orange-400 transition-colors"
                                                        >
                                                            View full thread on Reddit ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        )}

                        {/* ── X/TWITTER TAB ── */}
                        {activeTab === "twitter" && (
                            <div>
                                {/* Feed selector */}
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 flex-wrap">
                                    {TWITTER_FEEDS.map((f, i) => (
                                        <button
                                            key={f.label}
                                            onClick={() => setSelectedFeed(i)}
                                            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${selectedFeed === i
                                                    ? "bg-violet-500 text-white shadow-sm"
                                                    : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-gray-700"
                                                }`}
                                        >
                                            {f.emoji} {f.label}
                                        </button>
                                    ))}
                                </div>
                                <div ref={twitterRef} className="min-h-[480px] p-4 bg-[#0F172A]">
                                    <div className="flex flex-col items-center justify-center h-[460px] gap-3">
                                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-lg">𝕏</div>
                                        <span className="text-xs text-[#94A3B8] font-medium">Loading {TWITTER_FEEDS[selectedFeed].label} timeline...</span>
                                        <p className="text-[10px] text-[#64748B] text-center max-w-[250px]">
                                            If the timeline doesn't load, X may be blocking embeds. Use the direct link below.
                                        </p>
                                        <a
                                            href={`https://x.com/search?q=${encodeURIComponent(TWITTER_FEEDS[selectedFeed].query)}&f=live`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors mt-2"
                                        >
                                            Open {TWITTER_FEEDS[selectedFeed].label} on X ↗
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SENTIMENT TAB ── */}
                        {activeTab === "sentiment" && (
                            loading && !sentiment ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <RefreshCw className="w-6 h-6 animate-spin text-violet-500 mb-2" />
                                    <span className="text-xs text-[#94A3B8]">Analyzing fan sentiment...</span>
                                </div>
                            ) : sentiment ? (
                                <div className="p-5 space-y-6">
                                    {/* Mood Header */}
                                    <div className="text-center">
                                        <span className="text-5xl">{sentiment.moodEmoji}</span>
                                        <h4 className="text-lg font-black text-[#0F172A] dark:text-white mt-2">{sentiment.mood}</h4>
                                        <p className="text-[11px] text-[#94A3B8] mt-1">
                                            Based on {sentiment.total} comments across r/soccer
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
                                            <h5 className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2">Analyzed Threads</h5>
                                            <div className="space-y-1.5">
                                                {sentiment.analyzedThreads.map((t, i) => (
                                                    <p key={i} className="text-[11px] text-[#334155] dark:text-[#CBD5E1] leading-snug flex items-start gap-2">
                                                        <span className="text-violet-500 mt-0.5 flex-shrink-0">•</span>
                                                        {t.length > 80 ? t.slice(0, 80) + "…" : t}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sample Quotes */}
                                    {(sentiment.topPositive.length > 0 || sentiment.topNegative.length > 0) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {sentiment.topPositive.length > 0 && (
                                                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
                                                    <h5 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">😊 POSITIVE VOICES</h5>
                                                    {sentiment.topPositive.map((q, i) => (
                                                        <p key={i} className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug mb-1.5 italic">
                                                            "{q}"
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {sentiment.topNegative.length > 0 && (
                                                <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-800/30">
                                                    <h5 className="text-[10px] font-bold text-red-600 dark:text-red-400 mb-2">😤 CRITICAL VOICES</h5>
                                                    {sentiment.topNegative.map((q, i) => (
                                                        <p key={i} className="text-[11px] text-red-800 dark:text-red-300 leading-snug mb-1.5 italic">
                                                            "{q}"
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <p className="text-sm text-[#64748B]">Could not analyze sentiment</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/80 dark:bg-[#0B1120]/80 p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <p className="text-[9px] text-[#94A3B8]">
                            Powered by Reddit r/soccer • X/Twitter official widgets
                        </p>
                        <a
                            href="https://www.reddit.com/r/soccer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-violet-500 hover:text-violet-400 transition-colors"
                        >
                            r/soccer ↗
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
