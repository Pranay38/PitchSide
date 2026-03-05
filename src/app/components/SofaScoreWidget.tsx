import { useState } from "react";
import { ExternalLink, Activity } from "lucide-react";
import {
    type SofaScoreWidgetType,
    type WidgetConfig,
    buildWidgetEmbedUrl,
    getWidgetHeight,
} from "../data/sofascoreData";

interface SofaScoreWidgetProps {
    /** Legacy: raw SofaScore page URL */
    url?: string;
    /** New: structured widget config */
    widgetConfig?: WidgetConfig;
}

/** Map widget types to display labels */
const WIDGET_LABELS: Record<SofaScoreWidgetType, string> = {
    match: "Live Match",
    standings: "League Standings",
    team: "Team Overview",
    player: "Player Stats",
};

/**
 * Renders a SofaScore embed widget.
 * Supports both legacy URLs and structured widget configs.
 */
export function SofaScoreWidget({ url, widgetConfig }: SofaScoreWidgetProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Resolve the embed URL
    let embedUrl: string | null = null;
    let widgetType: SofaScoreWidgetType = "match";
    let originalUrl = url || "";

    if (widgetConfig) {
        // New structured widget config
        embedUrl = buildWidgetEmbedUrl(widgetConfig);
        widgetType = widgetConfig.type;
    } else if (url) {
        // Legacy URL support — try to detect if it's already a widget URL
        if (url.includes("widgets.sofascore.com")) {
            embedUrl = url;
            // Detect type from URL
            if (url.includes("/team/")) widgetType = "team";
            else if (url.includes("/player/")) widgetType = "player";
            else if (url.includes("/standings/")) widgetType = "standings";
            else widgetType = "match";
        } else if (url.includes("sofascore.com")) {
            // Regular SofaScore page URL — embed as-is with hash
            embedUrl = url.includes("#") ? url : `${url}#id:1,tab:details`;
        }
    }

    const height = getWidgetHeight(widgetType);
    const label = WIDGET_LABELS[widgetType];

    // Error or invalid URL fallback
    if (!embedUrl || error) {
        return (
            <a
                href={originalUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#1B3A5C] to-[#0D2137] hover:from-[#1F4470] hover:to-[#112A45] border border-white/10 transition-all duration-300 group shadow-lg hover:shadow-xl"
            >
                <div className="w-12 h-12 rounded-xl bg-[#F85D4E]/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-6 h-6 text-[#F85D4E]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm mb-0.5 group-hover:text-[#F85D4E] transition-colors">
                        View on SofaScore
                    </p>
                    <p className="text-white/50 text-xs truncate">{originalUrl || "Widget unavailable"}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
            </a>
        );
    }

    return (
        <div className="my-8 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-[#1E293B]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#1B3A5C] to-[#0D2137]">
                <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-[#F85D4E]" />
                    <span className="text-white font-bold text-sm tracking-wide">
                        {label} Widget
                    </span>
                </div>
                {originalUrl && (
                    <a
                        href={originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium transition-colors"
                    >
                        Open in SofaScore
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>

            {/* Iframe */}
            <div className="relative" style={{ minHeight: height }}>
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-[#0F172A]">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[#F85D4E] border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-gray-400 font-medium">Loading widget...</span>
                        </div>
                    </div>
                )}
                <iframe
                    src={embedUrl}
                    title={`SofaScore ${label}`}
                    className="w-full border-none"
                    style={{ height }}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                />
            </div>
        </div>
    );
}
