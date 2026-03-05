import { useState } from "react";
import { ExternalLink, Activity } from "lucide-react";

interface SofaScoreWidgetProps {
    url: string;
}

/**
 * Renders a SofaScore embed widget from a pasted URL.
 * Supports match pages, team pages, player pages, and tournament pages.
 * Falls back to a styled link card if the URL format isn't embeddable.
 */
export function SofaScoreWidget({ url }: SofaScoreWidgetProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Build an embed-friendly URL
    const getEmbedUrl = (raw: string): string | null => {
        try {
            const parsed = new URL(raw);
            if (!parsed.hostname.includes("sofascore.com")) return null;
            // SofaScore embed format: add /embed to the path
            // Example: https://www.sofascore.com/arsenal-manchester-united/tsbs
            // Embed:   https://www.sofascore.com/arsenal-manchester-united/tsbs#/embed
            return raw.includes("#") ? raw : `${raw}#id:1,tab:details`;
        } catch {
            return null;
        }
    };

    const embedUrl = getEmbedUrl(url);

    // If not a valid SofaScore URL, show a styled link card
    if (!embedUrl || error) {
        return (
            <a
                href={url}
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
                    <p className="text-white/50 text-xs truncate">{url}</p>
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
                        Live Match Widget
                    </span>
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium transition-colors"
                >
                    Open in SofaScore
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            {/* Iframe */}
            <div className="relative" style={{ minHeight: 400 }}>
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
                    title="SofaScore Widget"
                    className="w-full border-none"
                    style={{ height: 400 }}
                    onLoad={() => setLoaded(true)}
                    onError={() => setError(true)}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                />
            </div>
        </div>
    );
}
