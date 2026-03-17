import { useState } from "react";
import { toast } from "sonner";

interface ReactionCounts {
    fire: number;
    mindblown: number;
    thumbsdown: number;
    target: number;
    cold: number;
}

interface ReactionUIProps {
    itemId: string;
    itemType: "post" | "story";
    initialReactions?: Partial<ReactionCounts>;
}

const REACTIONS = [
    { key: "fire", emoji: "🔥", label: "Fire" },
    { key: "mindblown", emoji: "🤯", label: "Mindblown" },
    { key: "target", emoji: "🎯", label: "Spot On" },
    { key: "cold", emoji: "🥶", label: "Stone Cold" },
    { key: "thumbsdown", emoji: "👎", label: "Poor" }
] as const;

export function ReactionUI({ itemId, itemType, initialReactions }: ReactionUIProps) {
    const [counts, setCounts] = useState<ReactionCounts>({
        fire: initialReactions?.fire || 0,
        mindblown: initialReactions?.mindblown || 0,
        thumbsdown: initialReactions?.thumbsdown || 0,
        target: initialReactions?.target || 0,
        cold: initialReactions?.cold || 0
    });

    const storageKey = `reacted_${itemId}`;
    const [hasReacted, setHasReacted] = useState<boolean>(() => {
        return !!localStorage.getItem(storageKey);
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReact = async (reactionKey: keyof ReactionCounts) => {
        if (hasReacted || isSubmitting) return;

        setIsSubmitting(true);
        // Optimistic UI update
        setCounts(prev => ({
            ...prev,
            [reactionKey]: prev[reactionKey] + 1
        }));
        setHasReacted(true);
        localStorage.setItem(storageKey, reactionKey);

        try {
            const res = await fetch("/api/react", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId,
                    type: itemType,
                    reaction: reactionKey
                })
            });

            if (!res.ok) {
                throw new Error("Failed to save reaction");
            }

            const data = await res.json();
            if (data.success && data.reactions) {
                // Sync with server source of truth
                setCounts({
                    fire: data.reactions.fire || 0,
                    mindblown: data.reactions.mindblown || 0,
                    thumbsdown: data.reactions.thumbsdown || 0,
                    target: data.reactions.target || 0,
                    cold: data.reactions.cold || 0
                });
            }
        } catch (error) {
            console.error("Error saving reaction:", error);
            // Revert optimistic update
            setCounts(prev => ({
                ...prev,
                [reactionKey]: Math.max(0, prev[reactionKey] - 1)
            }));
            setHasReacted(false);
            localStorage.removeItem(storageKey);
            toast.error("Failed to add reaction");
        } finally {
            setIsSubmitting(false);
        }
    };

    const userReaction = localStorage.getItem(storageKey);

    return (
        <div className="py-8 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                {hasReacted ? "Thanks for reacting!" : "What did you think?"}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                {REACTIONS.map(({ key, emoji, label }) => {
                    const count = counts[key as keyof ReactionCounts];
                    const isSelected = userReaction === key;
                    
                    return (
                        <button
                            key={key}
                            onClick={() => handleReact(key as keyof ReactionCounts)}
                            disabled={hasReacted || isSubmitting}
                            className={`flex flex-col items-center gap-1 group transition-all duration-300 ${hasReacted && !isSelected ? 'opacity-50 grayscale' : 'opacity-100'}`}
                            title={label}
                        >
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl text-2xl sm:text-3xl transition-transform duration-300
                                ${isSelected 
                                    ? 'bg-sky-100 dark:bg-sky-900/30 scale-110 shadow-sm border border-sky-200 dark:border-sky-800' 
                                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110 border border-transparent'
                                }`}
                            >
                                <span className={isSelected ? 'animate-bounce-short' : 'group-hover:animate-wave'}>{emoji}</span>
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>
                                {count > 0 ? count : ''}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
