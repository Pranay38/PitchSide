import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type WidgetTab = "live" | "table" | "scorers";

interface LeagueConfig {
    name: string;
    flag: string;
    scoreaxisId: number; // ScoreAxis competition ID
}

const LEAGUES: LeagueConfig[] = [
    { name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", scoreaxisId: 1 },
    { name: "La Liga", flag: "🇪🇸", scoreaxisId: 3 },
    { name: "Serie A", flag: "🇮🇹", scoreaxisId: 4 },
    { name: "Bundesliga", flag: "🇩🇪", scoreaxisId: 2 },
    { name: "Ligue 1", flag: "🇫🇷", scoreaxisId: 16 },
    { name: "Champions League", flag: "🏆", scoreaxisId: 42 },
];

function buildWidgetUrl(tab: WidgetTab, leagueId: number): string {
    // ScoreAxis widget embed URLs
    const base = "https://www.scoreaxis.com/widget";
    switch (tab) {
        case "live":
            return `${base}/live-match/index.html?competitionId=${leagueId}&showHeader=0&showFooter=0&themeColor=%2310B981&font=2&bodyBackground=%230F172A&textColor=%23E2E8F0`;
        case "table":
            return `${base}/league-table/index.html?competitionId=${leagueId}&showHeader=0&showFooter=0&themeColor=%2310B981&font=2&bodyBackground=%230F172A&textColor=%23E2E8F0`;
        case "scorers":
            return `${base}/league-top-players/index.html?competitionId=${leagueId}&showHeader=0&showFooter=0&themeColor=%2310B981&font=2&bodyBackground=%230F172A&textColor=%23E2E8F0&topCategory=goals`;
    }
}

export function LiveScoresWidget() {
    const [activeTab, setActiveTab] = useState<WidgetTab>("live");
    const [selectedLeague, setSelectedLeague] = useState(0); // index into LEAGUES
    const [expanded, setExpanded] = useState(true);
    const [iframeKey, setIframeKey] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const league = LEAGUES[selectedLeague];
    const widgetUrl = buildWidgetUrl(activeTab, league.scoreaxisId);

    // Force iframe reload when tab or league changes
    useEffect(() => {
        setIframeKey((k) => k + 1);
    }, [activeTab, selectedLeague]);

    const tabBtn = (tab: WidgetTab, label: string, emoji: string) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 text-[12px] font-bold rounded-xl transition-all ${activeTab === tab
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
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
                className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent cursor-pointer select-none"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        Live Scores & Stats
                        <span className="ml-2 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                    </h3>
                    {expanded ? <ChevronUp className="w-4 h-4 text-[#94A3B8]" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8]" />}
                </div>
                {!expanded && (
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                        {league.flag} {league.name} — Tap to expand
                    </p>
                )}
            </div>

            {expanded && (
                <>
                    {/* Tabs */}
                    <div className="p-3 bg-gray-50/50 dark:bg-[#0B1120]/50 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex gap-1.5 p-1 bg-gray-200/50 dark:bg-[#1E293B] rounded-xl">
                            {tabBtn("live", "Live Matches", "🔴")}
                            {tabBtn("table", "League Table", "📊")}
                            {tabBtn("scorers", "Top Scorers", "⚽")}
                        </div>
                    </div>

                    {/* League Selector */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex gap-1.5 flex-wrap">
                        {LEAGUES.map((l, i) => (
                            <button
                                key={l.name}
                                onClick={() => setSelectedLeague(i)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${selectedLeague === i
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {l.flag} {l.name}
                            </button>
                        ))}
                    </div>

                    {/* ScoreAxis Widget Iframe */}
                    <div className="relative w-full bg-[#0F172A]" style={{ minHeight: 500 }}>
                        {/* Loading overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" id="widget-loader">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs text-[#94A3B8] font-medium">Loading {league.name}...</span>
                            </div>
                        </div>
                        <iframe
                            key={iframeKey}
                            ref={iframeRef}
                            src={widgetUrl}
                            title={`${activeTab} - ${league.name}`}
                            className="w-full border-0 relative z-20"
                            style={{ height: 500 }}
                            onLoad={(e) => {
                                // Hide loader
                                const loader = (e.currentTarget.parentElement?.querySelector("#widget-loader") as HTMLElement);
                                if (loader) loader.style.display = "none";
                            }}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                            loading="lazy"
                        />
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/80 dark:bg-[#0B1120]/80 p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-[9px] text-[#94A3B8]">
                            Powered by ScoreAxis • Data updates automatically
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
