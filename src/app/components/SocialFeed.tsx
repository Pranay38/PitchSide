import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FeedSource {
    name: string;
    handle: string;
    icon: string;
    url: string;
}

const FEEDS: FeedSource[] = [
    { name: "Premier League", handle: "@premierleague", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", url: "https://twitter.com/premierleague" },
    { name: "Champions League", handle: "@ChampionsLeague", icon: "🏆", url: "https://twitter.com/ChampionsLeague" },
    { name: "La Liga", handle: "@LaLigaEN", icon: "🇪🇸", url: "https://twitter.com/LaLigaEN" },
    { name: "Serie A", handle: "@SerieA_EN", icon: "🇮🇹", url: "https://twitter.com/SerieA_EN" },
    { name: "Bundesliga", handle: "@Bundesliga_EN", icon: "🇩🇪", url: "https://twitter.com/Bundesliga_EN" },
    { name: "Fabrizio Romano", handle: "@FabrizioRomano", icon: "🔔", url: "https://twitter.com/FabrizioRomano" },
    { name: "r/soccer", handle: "Reddit", icon: "🟠", url: "https://www.reddit.com/r/soccer" },
];

export function SocialFeed() {
    const [selectedFeed, setSelectedFeed] = useState(0);
    const [expanded, setExpanded] = useState(true);
    const timelineRef = useRef<HTMLDivElement>(null);

    const feed = FEEDS[selectedFeed];

    // Load/reload Twitter embed widget script
    useEffect(() => {
        if (!expanded) return;

        // For Twitter feeds, dynamically load the Twitter widget js
        if (feed.url.includes("twitter.com")) {
            // Clear old content
            if (timelineRef.current) {
                timelineRef.current.innerHTML = `
                    <a class="twitter-timeline"
                       href="${feed.url}"
                       data-theme="dark"
                       data-chrome="noheader nofooter noborders transparent"
                       data-tweet-limit="5"
                       data-width="100%"
                       data-height="500">
                        Loading ${feed.name}...
                    </a>
                `;
            }

            // Load or re-trigger Twitter widget script
            const existingScript = document.querySelector('script[src*="platform.twitter.com"]');
            if (existingScript) {
                // Re-render if script already loaded
                (window as any).twttr?.widgets?.load?.(timelineRef.current);
            } else {
                const script = document.createElement("script");
                script.src = "https://platform.twitter.com/widgets.js";
                script.async = true;
                script.charset = "utf-8";
                document.body.appendChild(script);
            }
        }
    }, [selectedFeed, expanded, feed]);

    const isReddit = feed.url.includes("reddit.com");

    return (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent cursor-pointer select-none"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-xl">📱</span>
                        Social Media Feeds
                        <span className="ml-2 text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                    </h3>
                    {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                </div>
                {!expanded && (
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        {feed.icon} Following {feed.name}
                    </p>
                )}
            </div>

            {expanded && (
                <>
                    {/* Feed Selector */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 flex-wrap">
                        {FEEDS.map((f, i) => (
                            <button
                                key={f.name}
                                onClick={() => setSelectedFeed(i)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${selectedFeed === i
                                        ? "bg-sky-500 text-white shadow-sm"
                                        : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {f.icon} {f.name}
                            </button>
                        ))}
                    </div>

                    {/* Feed Content */}
                    <div className="relative w-full bg-[#0F172A]" style={{ minHeight: 500 }}>
                        {isReddit ? (
                            <iframe
                                src="https://www.redditmedia.com/r/soccer/hot/?ref=share&ref_source=embed&utm_medium=widgets&utm_source=embedv2&utm_term=23&utm_name=post_embed&embed=true&theme=dark"
                                title="r/soccer"
                                className="w-full border-0"
                                style={{ height: 500 }}
                                sandbox="allow-scripts allow-same-origin allow-popups"
                                loading="lazy"
                            />
                        ) : (
                            <div
                                ref={timelineRef}
                                className="w-full overflow-auto p-4"
                                style={{ height: 500 }}
                            >
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-[#94A3B8] font-medium">Loading {feed.name}...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/80 dark:bg-[#0B1120]/80 p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <p className="text-[9px] text-[#94A3B8]">
                            Social feeds update in real-time
                        </p>
                        <a
                            href={feed.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-sky-500 hover:text-sky-400 transition-colors"
                        >
                            Open {feed.handle} ↗
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
