import { type WidgetConfig } from "../data/sofascoreData";

interface SofaScoreWidgetProps {
    /** Legacy: raw SofaScore page URL */
    url?: string;
    /** New: structured widget config */
    widgetConfig?: WidgetConfig;
}

/**
 * Extracts a numeric SofaScore ID from various URL formats.
 * e.g., ".../rgbsLgb#id:11352601" -> "11352601"
 * e.g., ".../event/11352601" -> "11352601"
 */
function extractSofaScoreId(url: string | undefined): string {
    if (!url) return "";

    // 1. Try to find #id:{number} (standard for modern SofaScore match pages)
    const hashMatch = url.match(/#id:(\d+)/);
    if (hashMatch) return hashMatch[1];

    // 2. Try to find a numeric string immediately following a slash
    const slashMatch = url.match(/\/(\d+)(?:[#?]|$)/);
    if (slashMatch) return slashMatch[1];

    // 3. Fallback (might be an alphanumeric slug, which will 404, but it's a best effort)
    return url.split('/').pop()?.split(/[#?]/)[0] || "";
}

/**
 * Renders a SofaScore embed widget.
 * Based on the exact working robust snippet provided by the user.
 */
export function SofaScoreWidget({ url, widgetConfig }: SofaScoreWidgetProps) {
    const base = "https://widgets.sofascore.com/embed";

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

        const isWidgetEmbed = url.includes("widgets.sofascore.com");
        const embedUrl = isWidgetEmbed
            ? url
            : `${base}/event/${extractSofaScoreId(url)}`; // Extract real ID

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
    const { type, id, seasonId, eventUrl } = widgetConfig;

    // Resolve exactly which ID to use
    let finalId: string | number | undefined = id;
    if (type === "match" && eventUrl) {
        // Use our robust extractor for eventUrls from the builder
        const extractedId = extractSofaScoreId(eventUrl);
        if (extractedId) finalId = extractedId;
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
            height={defaultHeights[type]?.toString() || "500"}
            frameBorder="0"
            scrolling="no"
            loading="lazy"
            style={{ borderRadius: "12px", display: "block", marginTop: "2rem", marginBottom: "2rem" }}
        />
    );
}
