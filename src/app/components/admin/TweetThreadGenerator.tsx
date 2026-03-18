import React, { useState, useCallback } from "react";
import { Copy, Check, RefreshCw, ExternalLink, Loader2, MessageSquare, AlertTriangle } from "lucide-react";

function charClass(len: number): string {
    if (len >= 260) return "text-red-500 font-bold";
    if (len >= 240) return "text-amber-500 font-semibold";
    return "text-gray-400";
}

function charLabel(len: number): string {
    if (len > 280) return `${len - 280} chars over limit`;
    if (len >= 260) return `${280 - len} left — tight!`;
    if (len >= 240) return `${280 - len} left`;
    return `${len}/280`;
}

function intentUrl(text: string): string {
    return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function TweetThreadGenerator() {
    const [article, setArticle]   = useState("");
    const [tweets, setTweets]     = useState<string[]>([]);
    const [loading, setLoading]   = useState(false);
    const [err, setErr]           = useState("");
    const [copiedAll, setCopied]  = useState(false);

    const generate = useCallback(async () => {
        if (!article.trim() || loading) return;
        setLoading(true);
        setErr("");
        setTweets([]);
        try {
            const res = await fetch("/api/sys?action=ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "tweet-thread", article }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || "Generation failed");
            if (!Array.isArray(body.data)) throw new Error("Unexpected response format");
            setTweets(body.data);
        } catch (e: any) {
            setErr(e.message);
        }
        setLoading(false);
    }, [article, loading]);

    const updateTweet = useCallback((idx: number, val: string) => {
        setTweets(prev => prev.map((t, i) => i === idx ? val : t));
    }, []);

    const copyAll = useCallback(() => {
        const formatted = tweets
            .map((t, i) => `${i + 1}/${tweets.length}\n${t}`)
            .join("\n\n———\n\n");
        navigator.clipboard.writeText(formatted);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }, [tweets]);

    return (
        <div className="w-full" style={{ fontFamily: "var(--font-sans, system-ui)" }}>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                    Tweet Thread Generator
                </h2>
                <p className="text-sm mt-3 text-gray-500 dark:text-gray-400">
                    Paste an article and generate a ready-to-post X/Twitter thread. Each tweet is editable inline.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left: Input */}
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                        <div className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
                            Source Article
                        </div>
                        <textarea
                            value={article}
                            onChange={e => setArticle(e.target.value)}
                            disabled={loading}
                            placeholder="Paste the article text here..."
                            className="w-full h-48 text-sm bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg p-4 outline-none focus:border-blue-500/50 resize-y transition-opacity"
                            style={{ opacity: loading ? 0.5 : 1 }}
                        />
                        <button
                            onClick={generate}
                            disabled={loading || !article.trim()}
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating thread...</> : <>
                                <MessageSquare className="w-4 h-4" /> Generate Thread
                            </>}
                        </button>
                        {err && <p className="text-red-500 text-xs mt-3 font-medium">{err}</p>}
                    </div>

                    {/* Tips */}
                    {tweets.length === 0 && !loading && (
                        <div className="text-xs text-gray-400 dark:text-gray-600 space-y-1 px-1">
                            <p>💡 The AI generates 5-8 tweets with a hook opener and CTA closer.</p>
                            <p>💡 Each tweet card is directly editable — click to fix wording.</p>
                            <p>💡 Use "Post to X ↗" to open each tweet in X's composer.</p>
                        </div>
                    )}
                </div>

                {/* Right: Thread output */}
                {tweets.length > 0 && (
                    <div className="space-y-4">
                        {/* Thread header */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Thread — {tweets.length} tweets
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={copyAll}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {copiedAll ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy All</>}
                                </button>
                            </div>
                        </div>

                        {/* Tweet cards */}
                        <div className="space-y-3">
                            {tweets.map((tweet, i) => {
                                const len = tweet.length;
                                const over = len > 280;
                                return (
                                    <div
                                        key={i}
                                        className={`bg-white dark:bg-[#1E293B] border rounded-xl p-4 transition-colors ${
                                            over
                                                ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                                                : "border-gray-200 dark:border-gray-800"
                                        }`}
                                    >
                                        {/* Card header */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                {i + 1}/{tweets.length}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs tabular-nums ${charClass(len)}`}>
                                                    {charLabel(len)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Editable tweet */}
                                        <textarea
                                            value={tweet}
                                            onChange={e => updateTweet(i, e.target.value)}
                                            rows={Math.max(2, Math.ceil(tweet.length / 60))}
                                            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none resize-none leading-relaxed"
                                            style={{ border: "none" }}
                                        />

                                        {/* Over-limit warning */}
                                        {over && (
                                            <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs font-medium">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                {len - 280} characters over the 280 limit
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <a
                                                href={intentUrl(tweet)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-semibold hover:opacity-80 transition-opacity"
                                            >
                                                Post to X <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Regenerate */}
                        <button
                            onClick={generate}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            Regenerate Thread
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
