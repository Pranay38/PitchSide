import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getDeviceId } from "../lib/deviceId";

interface ReactionCounts {
    screamer: number;
    howler: number;
    offside: number;
    worldie: number;
    tekkers: number;
    shithouse: number;
    bottled: number;
}

interface ReactionUIProps {
    itemId: string;
    itemType: "post" | "story";
    initialReactions?: Partial<ReactionCounts>;
}

const REACTIONS = [
    { key: "screamer", emoji: "🚀", label: "Screamer", color: "#EF4444" },
    { key: "worldie", emoji: "🌍", label: "Worldie", color: "#8B5CF6" },
    { key: "tekkers", emoji: "🪄", label: "Tekkers", color: "#06B6D4" },
    { key: "howler", emoji: "🤡", label: "Howler", color: "#F59E0B" },
    { key: "shithouse", emoji: "😈", label: "Shithouse", color: "#10B981" },
    { key: "offside", emoji: "🚩", label: "Offside", color: "#64748B" },
    { key: "bottled", emoji: "🍾", label: "Bottled It", color: "#EC4899" },
] as const;

const REACTION_KEYS: (keyof ReactionCounts)[] = REACTIONS.map(r => r.key as keyof ReactionCounts);

const DEFAULT_COUNTS: ReactionCounts = {
    screamer: 0, howler: 0, offside: 0, worldie: 0,
    tekkers: 0, shithouse: 0, bottled: 0,
};

export function ReactionUI({ itemId, itemType, initialReactions }: ReactionUIProps) {
    const [counts, setCounts] = useState<ReactionCounts>(() => {
        const c = { ...DEFAULT_COUNTS };
        if (initialReactions) {
            for (const k of REACTION_KEYS) {
                if (initialReactions[k]) c[k] = initialReactions[k]!;
            }
        }
        return c;
    });

    const [userReaction, setUserReaction] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [animatingKey, setAnimatingKey] = useState<string | null>(null);

    // Fetch up-to-date reactions and the current user's vote
    useEffect(() => {
        const fetchReactions = async () => {
            try {
                // Ensure cookie is generated
                getDeviceId();
                const res = await fetch(`/api/react?itemId=${itemId}&type=${itemType}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.reactions) {
                        const synced = { ...DEFAULT_COUNTS };
                        for (const k of REACTION_KEYS) {
                            if (data.reactions[k]) synced[k] = data.reactions[k];
                        }
                        setCounts(synced);
                    }
                    if (data.userReaction) {
                        setUserReaction(data.userReaction);
                    }
                }
            } catch {
                // Silently fail, stick to initial data
            }
        };
        fetchReactions();
    }, [itemId, itemType]);

    const hasReacted = userReaction !== null;

    const handleReact = async (reactionKey: keyof ReactionCounts) => {
        if (hasReacted || isSubmitting) return;

        setIsSubmitting(true);
        setAnimatingKey(reactionKey);

        // Optimistic UI update
        setCounts(prev => ({ ...prev, [reactionKey]: prev[reactionKey] + 1 }));
        setUserReaction(reactionKey);

        try {
            const res = await fetch("/api/react", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId, type: itemType, reaction: reactionKey, deviceId: getDeviceId() }),
            });

            if (!res.ok) throw new Error("Failed to save reaction");

            const data = await res.json();
            if (data.success && data.reactions) {
                const synced = { ...DEFAULT_COUNTS };
                for (const k of REACTION_KEYS) {
                    if (data.reactions[k]) synced[k] = data.reactions[k];
                }
                setCounts(synced);
                if (data.userReaction) setUserReaction(data.userReaction);
            }
        } catch {
            // Revert optimistic update
            setCounts(prev => ({ ...prev, [reactionKey]: Math.max(0, prev[reactionKey] - 1) }));
            setUserReaction(null);
            toast.error("Failed to add reaction");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setAnimatingKey(null), 600);
        }
    };

    const totalReactions = REACTION_KEYS.reduce((sum, k) => sum + counts[k], 0);

    return (
        <div className="py-8 border-t border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="text-center mb-5">
                <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 mb-1">
                    {hasReacted ? "You've had your say!" : "Rate this article"}
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-600">
                    {hasReacted ? "One vote per article" : "Tap your verdict — one chance only"}
                </p>
            </div>

            {/* Reaction Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
                {REACTIONS.map(({ key, emoji, label, color }) => {
                    const count = counts[key as keyof ReactionCounts];
                    const isSelected = userReaction === key;
                    const isAnimating = animatingKey === key;

                    return (
                        <button
                            key={key}
                            onClick={() => handleReact(key as keyof ReactionCounts)}
                            disabled={hasReacted || isSubmitting}
                            className="flex flex-col items-center gap-1.5 group transition-all duration-300"
                            title={label}
                        >
                            <div
                                className={`relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl text-2xl sm:text-3xl transition-all duration-300 ${
                                    isSelected
                                        ? "scale-110 shadow-lg ring-2"
                                        : hasReacted
                                        ? "opacity-40 grayscale"
                                        : "bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 border border-gray-100 dark:border-gray-700"
                                }`}
                                style={isSelected ? {
                                    backgroundColor: `${color}15`,
                                    borderColor: `${color}40`,
                                    "--tw-ring-color": color,
                                    boxShadow: `0 4px 20px ${color}30`,
                                } as React.CSSProperties : {}}
                            >
                                <span className={`${
                                    isAnimating ? "animate-bounce" : isSelected ? "" : "group-hover:scale-125 transition-transform"
                                }`}>
                                    {emoji}
                                </span>

                                {/* Pop effect on selection */}
                                {isAnimating && (
                                    <span
                                        className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                isSelected ? "" : "text-gray-400 dark:text-gray-500"
                            }`} style={isSelected ? { color } : {}}>
                                {label}
                            </span>

                            {/* Count */}
                            <span className={`text-[11px] font-bold tabular-nums ${
                                isSelected ? "text-gray-700 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"
                            }`}>
                                {count > 0 ? count : "·"}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Aggregate Reaction Bar */}
            {totalReactions > 0 && (
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {REACTIONS.map(({ key, color }) => {
                            const pct = (counts[key as keyof ReactionCounts] / totalReactions) * 100;
                            if (pct === 0) return null;
                            return (
                                <div
                                    key={key}
                                    className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                    title={`${REACTIONS.find(r => r.key === key)?.label}: ${Math.round(pct)}%`}
                                />
                            );
                        })}
                    </div>
                    <p className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-600 mt-2 tabular-nums">
                        {totalReactions} reaction{totalReactions !== 1 ? "s" : ""}
                    </p>
                </div>
            )}
        </div>
    );
}
