"use client";

import { useState, useEffect } from "react";
import { Flame, Snowflake, ThumbsUp, ThumbsDown } from "lucide-react";

interface HotTakeHeatIndexProps {
    postId: string;
    takeId: string; // unique ID for this specific take within the post
    statement: string; // the bold claim being voted on
    className?: string;
}

type Vote = "agree" | "disagree";

function storageKey(postId: string, takeId: string) {
    return `pitchside_hottake_${postId}_${takeId}`;
}

const LABELS = [
    { min: 0, max: 19, text: "Stone Cold", icon: "🧊", color: "text-blue-400" },
    { min: 20, max: 39, text: "Lukewarm Take", icon: "🌤️", color: "text-sky-400" },
    { min: 40, max: 59, text: "Contested", icon: "⚡", color: "text-amber-500" },
    { min: 60, max: 79, text: "Spicy!", icon: "🌶️", color: "text-orange-500" },
    { min: 80, max: 100, text: "BOILING 🔥", icon: "🔥", color: "text-red-500" },
];

function getLabel(agreePercent: number) {
    return LABELS.find((l) => agreePercent >= l.min && agreePercent <= l.max) || LABELS[2];
}

export function HotTakeHeatIndex({
    postId,
    takeId,
    statement,
    className = "",
}: HotTakeHeatIndexProps) {
    const [votes, setVotes] = useState({ agree: 0, disagree: 0 });
    const [userVote, setUserVote] = useState<Vote | null>(null);
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem(storageKey(postId, takeId));
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setVotes(parsed.votes);
                setUserVote(parsed.userVote);
                setRevealed(true);
            } catch {
                // ignore
            }
        }
    }, [postId, takeId]);

    const total = votes.agree + votes.disagree;
    const agreePercent = total > 0 ? Math.round((votes.agree / total) * 100) : 50;
    const label = getLabel(agreePercent);

    const handleVote = (vote: Vote) => {
        if (userVote !== null) return;

        const next = {
            agree: votes.agree + (vote === "agree" ? 1 : 0),
            disagree: votes.disagree + (vote === "disagree" ? 1 : 0),
        };

        setVotes(next);
        setUserVote(vote);
        setRevealed(true);
        localStorage.setItem(
            storageKey(postId, takeId),
            JSON.stringify({ votes: next, userVote: vote })
        );
    };

    const thermometerPercent = agreePercent;

    return (
        <div
            className={`${className} relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E293B]/60 shadow-sm`}
        >
            {/* Ambient glow based on temperature */}
            <div
                className="absolute inset-0 pointer-events-none transition-all duration-1000"
                style={{
                    background: revealed
                        ? agreePercent >= 60
                            ? `radial-gradient(ellipse at top right, rgba(239,68,68,0.08) 0%, transparent 70%)`
                            : `radial-gradient(ellipse at top left, rgba(96,165,250,0.08) 0%, transparent 70%)`
                        : "none",
                }}
            />

            <div className="relative p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-500">
                        Hot Take Heat Index
                    </span>
                </div>

                {/* Statement */}
                <p className="text-lg font-black text-[#0F172A] dark:text-white leading-snug mb-6">
                    "{statement}"
                </p>

                {/* Thermometer */}
                {revealed ? (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-blue-400">
                                <Snowflake className="w-4 h-4" />
                                <span className="text-xs font-bold">Freezing</span>
                            </div>
                            <div className={`text-sm font-black ${label.color} flex items-center gap-1`}>
                                {label.icon} {label.text}
                            </div>
                            <div className="flex items-center gap-1.5 text-red-400">
                                <span className="text-xs font-bold">Boiling</span>
                                <Flame className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Gradient bar */}
                        <div className="relative h-4 rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-500 overflow-hidden">
                            {/* Position indicator */}
                            <div
                                className="absolute top-0 h-full w-1 bg-white shadow-lg rounded-full transition-all duration-1000 ease-out"
                                style={{ left: `calc(${thermometerPercent}% - 2px)` }}
                            />
                        </div>

                        {/* Vote counts */}
                        <div className="flex items-center justify-between mt-3">
                            <span className={`text-xs font-bold ${userVote === "agree" ? "text-[#16A34A]" : "text-gray-500"}`}>
                                {agreePercent}% Agree ({votes.agree})
                            </span>
                            <span className={`text-xs font-bold ${userVote === "disagree" ? "text-red-400" : "text-gray-500"}`}>
                                {100 - agreePercent}% Disagree ({votes.disagree})
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 flex items-center justify-center h-4 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-400 font-semibold">
                        Vote to reveal the heat
                    </div>
                )}

                {/* Vote buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleVote("agree")}
                        disabled={userVote !== null}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                            userVote === "agree"
                                ? "bg-[#16A34A]/10 border-[#16A34A] text-[#16A34A]"
                                : userVote !== null
                                ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#16A34A] hover:text-[#16A34A] hover:bg-[#16A34A]/5"
                        }`}
                    >
                        <ThumbsUp className="w-4 h-4" />
                        {userVote === "agree" ? "Agreed ✓" : "Agree"}
                    </button>
                    <button
                        onClick={() => handleVote("disagree")}
                        disabled={userVote !== null}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                            userVote === "disagree"
                                ? "bg-red-500/10 border-red-400 text-red-400"
                                : userVote !== null
                                ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-400 hover:bg-red-500/5"
                        }`}
                    >
                        <ThumbsDown className="w-4 h-4" />
                        {userVote === "disagree" ? "Disagreed ✓" : "Disagree"}
                    </button>
                </div>

                {userVote && (
                    <p className="text-center text-[10px] text-gray-400 font-semibold mt-3">
                        Heat locked in — {total} {total === 1 ? "vote" : "votes"} cast
                    </p>
                )}
            </div>
        </div>
    );
}
