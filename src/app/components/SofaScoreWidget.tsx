import { type WidgetConfig } from "../data/sofascoreData";

interface SofaScoreWidgetProps {
    /** Legacy: raw SofaScore page URL */
    url?: string;
    /** New: structured widget config */
    widgetConfig?: WidgetConfig;
}

/**
 * Renders a SofaScore embed widget.
 * Based on the exact working robust snippet provided by the user.
 */
export function SofaScoreWidget({ url, widgetConfig }: SofaScoreWidgetProps) {
    // 1. Handle Legacy URLs (Pre-widgetConfig)
    if (!widgetConfig && url) {
        // Simple heuristic for height
        let type = "match";
        if (url.includes("/team/")) type = "team";
        else if (url.includes("/player/")) type = "player";
        else if (url.includes("/standings/")) type = "standings";

        const legacyHeights: Record<string, number> = {
            match: 500, standings: 640, player: 420, team: 400,
        };

        // If it's not a widget URL, we won't try to embed it into a widget directly via iframe, just return null or a link.
        // But assuming most legacy URLs are widget urls:
        const embedUrl = url.includes("widgets.sofascore.com")
            ? url
            : `https://widgets.sofascore.com/embed/event/${url.split('/').pop()}`; // Best guess fallback

        return (
            <iframe
                src={embedUrl.includes("?") ? embedUrl : `${embedUrl}?widgetTheme=dark`}
                width="100%"
                height={legacyHeights[type]?.toString() || "500"}
                frameBorder="0"
                scrolling="no"
                loading="lazy"
                style={{ borderRadius: "12px", display: "block", marginTop: "2rem", marginBottom: "2rem" }}
            />
        );
    }

    if (!widgetConfig) return null;

    // 2. Structured Widget Config (User's Snippet Implementation)
    const base = "https://widgets.sofascore.com/embed";
    const { type, id, seasonId, eventUrl } = widgetConfig;

    // Resolve exactly which ID to use
    let finalId: string | number | undefined = id;
    if (type === "match" && eventUrl) {
        const match = eventUrl.match(/\/(\d+)$/);
        if (match) finalId = match[1];
    }
    const tId = widgetConfig.tournamentId || id;

    const urls: Record<string, string> = {
        match: `${base}/event/${finalId}`,
        standings: `${base}/unique-tournament/${tId}/season/${seasonId}/standings/table`,
        player: `${base}/player/${id}`,
        team: `${base}/team/${id}`,
    };

    const defaultHeights: Record<string, number> = {
        match: 500, standings: 640, player: 420, team: 400,
    };

    const params = new URLSearchParams({
        widgetTheme: "dark",
        timezone: "Asia/Kolkata",
        culture: "en-US",
        color: "16A34A"
    });

    if (!urls[type]) return null;

    return (
        <iframe
            src={`${urls[type]}?${params.toString()}`}
            width="100%"
            height={defaultHeights[type] || 500}
            frameBorder="0"
            scrolling="no"
            loading="lazy"
            style={{ borderRadius: "12px", display: "block", marginTop: "2rem", marginBottom: "2rem" }}
        />
    );
}
