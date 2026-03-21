export interface POTSContender {
    id: string;
    name: string;
    club: string;
    image: string;
    votes: number;
    stats: { label: string; value: string | number }[];
    verdict: string;
    highlights: string[];
}

export interface POTSSettings {
    enabled: boolean;
    title: string;
    description: string;
    contenders: POTSContender[];
}

export function createDefaultPOTSSettings(): POTSSettings {
    return {
        enabled: false,
        title: "Player of the Season 2026",
        description: "Vote for your Player of the Season. Compare the top contenders, read our verdict, and cast your vote below.",
        contenders: []
    };
}

export function normalizePOTSSettings(input?: Partial<POTSSettings> | null): POTSSettings {
    const defaults = createDefaultPOTSSettings();
    return {
        enabled: !!input?.enabled,
        title: String(input?.title || defaults.title).trim(),
        description: String(input?.description || defaults.description).trim(),
        contenders: normalizeContenders(input?.contenders)
    };
}

function normalizeContenders(input?: any[] | null): POTSContender[] {
    if (!Array.isArray(input)) return [];
    return input.map(item => ({
        id: String(item?.id || Math.random().toString(36).substring(7)),
        name: String(item?.name || "").trim(),
        club: String(item?.club || "").trim(),
        image: String(item?.image || "").trim(),
        votes: Number(item?.votes) || 0,
        stats: Array.isArray(item?.stats) ? item.stats.map((s: any) => ({
            label: String(s?.label || "").trim(),
            value: String(s?.value || "").trim()
        })) : [],
        verdict: String(item?.verdict || "").trim(),
        highlights: Array.isArray(item?.highlights) ? item.highlights.map((h: any) => String(h || "").trim()) : []
    })).filter(c => c.name);
}
