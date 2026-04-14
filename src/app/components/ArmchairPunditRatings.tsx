"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Users } from "lucide-react";

export interface PlayerRating {
    name: string;
    position: string;
    authorRating: number; // Author's fixed rating out of 10
    imageUrl?: string;
}

interface ArmchairPunditRatingsProps {
    postId: string;
    players: PlayerRating[];
    className?: string;
}

interface CrowdData {
    totalVotes: number;
    sumRating: number;
    userRating: number | null;
}

// localStorage key per player per post
function storageKey(postId: string, playerName: string) {
    return `pitchside_rating_${postId}_${encodeURIComponent(playerName)}`;
}

function getRatingColor(rating: number) {
    if (rating >= 8) return "text-emerald-500";
    if (rating >= 6) return "text-amber-500";
    return "text-red-400";
}

function StarRater({
    value,
    onChange,
    disabled,
}: {
    value: number | null;
    onChange: (v: number) => void;
    disabled: boolean;
}) {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => {
                const index = i + 1;
                const filled = hovered !== null ? index <= hovered : value !== null && index <= value;
                return (
                    <button
                        key={index}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && onChange(index)}
                        onMouseEnter={() => !disabled && setHovered(index)}
                        onMouseLeave={() => setHovered(null)}
                        className={`transition-all ${disabled ? "cursor-default" : "cursor-pointer hover:scale-125"}`}
                        aria-label={`Rate ${index} out of 10`}
                    >
                        <Star
                            className={`w-3.5 h-3.5 transition-colors ${filled ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-700"}`}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export function ArmchairPunditRatings({
    postId,
    players,
    className = "",
}: ArmchairPunditRatingsProps) {
    const [crowdData, setCrowdData] = useState<Record<string, CrowdData>>({});

    // Load crowd data from localStorage on mount
    useEffect(() => {
        const initial: Record<string, CrowdData> = {};
        for (const player of players) {
            const raw = localStorage.getItem(storageKey(postId, player.name));
            if (raw) {
                try {
                    initial[player.name] = JSON.parse(raw);
                } catch {
                    initial[player.name] = { totalVotes: 0, sumRating: 0, userRating: null };
                }
            } else {
                initial[player.name] = { totalVotes: 0, sumRating: 0, userRating: null };
            }
        }
        setCrowdData(initial);
    }, [postId, players]);

    const handleRate = useCallback(
        (playerName: string, rating: number) => {
            setCrowdData((prev) => {
                const existing = prev[playerName] || { totalVotes: 0, sumRating: 0, userRating: null };
                if (existing.userRating !== null) return prev; // already voted

                const next = {
                    totalVotes: existing.totalVotes + 1,
                    sumRating: existing.sumRating + rating,
                    userRating: rating,
                };
                localStorage.setItem(storageKey(postId, playerName), JSON.stringify(next));
                return { ...prev, [playerName]: next };
            });
        },
        [postId]
    );

    return (
        <div className={`${className} rounded-[2rem] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B]/60 overflow-hidden shadow-sm`}>
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#0F172A] dark:text-white">
                        Armchair Pundit Ratings
                    </h3>
                </div>
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Rate the players
                </span>
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-2 border-b border-gray-100 dark:border-gray-800/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Player</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#16A34A] w-20 text-center">Author</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 w-20 text-center">Crowd</span>
            </div>

            {/* Player rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {players.map((player) => {
                    const data = crowdData[player.name];
                    const crowdAvg =
                        data && data.totalVotes > 0
                            ? Math.round((data.sumRating / data.totalVotes) * 10) / 10
                            : null;
                    const hasVoted = data?.userRating !== null && data?.userRating !== undefined;

                    return (
                        <div key={player.name} className="px-6 py-4">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                                {/* Player info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    {player.imageUrl ? (
                                        <img
                                            src={player.imageUrl}
                                            alt={player.name}
                                            className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-gray-700 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center">
                                            <span className="text-sm font-black text-gray-400">
                                                {player.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                                            {player.name}
                                        </p>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                            {player.position}
                                        </p>
                                    </div>
                                </div>

                                {/* Author rating */}
                                <div className="w-20 flex flex-col items-center gap-1">
                                    <span className={`text-2xl font-black font-outfit ${getRatingColor(player.authorRating)}`}>
                                        {player.authorRating}
                                    </span>
                                    <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        <div
                                            className="h-full bg-[#16A34A] rounded-full transition-all duration-700"
                                            style={{ width: `${player.authorRating * 10}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Crowd rating */}
                                <div className="w-20 flex flex-col items-center gap-1">
                                    {crowdAvg !== null ? (
                                        <>
                                            <span className={`text-2xl font-black font-outfit ${getRatingColor(crowdAvg)}`}>
                                                {crowdAvg}
                                            </span>
                                            <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                                    style={{ width: `${crowdAvg * 10}%` }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-semibold">—</span>
                                    )}
                                </div>
                            </div>

                            {/* Star rater */}
                            <div className="mt-3 flex items-center gap-3">
                                <StarRater
                                    value={data?.userRating ?? null}
                                    onChange={(v) => handleRate(player.name, v)}
                                    disabled={hasVoted}
                                />
                                {hasVoted ? (
                                    <span className="text-[10px] font-semibold text-gray-400">
                                        You rated {data.userRating}/10 · {data.totalVotes} vote{data.totalVotes !== 1 ? "s" : ""}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-semibold text-gray-400">
                                        Tap to rate
                                    </span>
                                )}
                            </div>

                            {/* Divergence indicator */}
                            {crowdAvg !== null && (
                                <div className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                                    Math.abs(crowdAvg - player.authorRating) >= 2
                                        ? "text-rose-500"
                                        : "text-gray-400"
                                }`}>
                                    {Math.abs(crowdAvg - player.authorRating) >= 2
                                        ? `⚡ Crowd split — ${crowdAvg > player.authorRating ? "crowd rates higher" : "author rates higher"}`
                                        : ""}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
