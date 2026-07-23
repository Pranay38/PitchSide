"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Users, ChevronDown, ChevronUp } from "lucide-react";
import { getDeviceId } from "../lib/deviceId";

interface PlayerRating {
  name: string;
  position: string;
  authorRating: number;
  imageUrl?: string;
}

interface FanVoteData {
  totalScore: number;
  voteCount: number;
}

interface ArmchairRatingsPanelProps {
  postId: string;
  ratings: PlayerRating[];
}

function getRatingColor(rating: number): string {
  if (rating >= 8) return "text-emerald-400";
  if (rating >= 6.5) return "text-lime-400";
  if (rating >= 5) return "text-amber-400";
  if (rating >= 3) return "text-orange-400";
  return "text-red-400";
}

function getRatingBg(rating: number): string {
  if (rating >= 8) return "bg-emerald-500/15 border-emerald-500/30";
  if (rating >= 6.5) return "bg-lime-500/15 border-lime-500/30";
  if (rating >= 5) return "bg-amber-500/15 border-amber-500/30";
  if (rating >= 3) return "bg-orange-500/15 border-orange-500/30";
  return "bg-red-500/15 border-red-500/30";
}

function getRatingLabel(rating: number): string {
  if (rating >= 9) return "MOTM Contender";
  if (rating >= 8) return "Excellent";
  if (rating >= 7) return "Good";
  if (rating >= 6) return "Decent";
  if (rating >= 5) return "Average";
  if (rating >= 4) return "Below Par";
  if (rating >= 3) return "Poor";
  return "Disasterclass";
}

export function ArmchairRatingsPanel({ postId, ratings }: ArmchairRatingsPanelProps) {
  const [fanVotes, setFanVotes] = useState<Record<string, FanVoteData>>({});
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [totalFanVoters, setTotalFanVoters] = useState(0);

  // Fetch existing fan votes on mount
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const deviceId = getDeviceId();
        const res = await fetch(
          `/api/armchair-ratings?postId=${encodeURIComponent(postId)}&deviceId=${encodeURIComponent(deviceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.fanVotes) setFanVotes(data.fanVotes);
          if (data.userRatings) {
            setUserRatings(data.userRatings);
            setHasSubmitted(true);
          }
          if (data.totalVoters !== undefined) setTotalFanVoters(data.totalVoters);
        }
      } catch {
        // Component works without API
      }
    };
    fetchVotes();
  }, [postId]);

  const handleRatingSelect = useCallback((playerName: string, rating: number) => {
    if (hasSubmitted) return;
    setUserRatings((prev) => ({ ...prev, [playerName]: rating }));
  }, [hasSubmitted]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || hasSubmitted) return;
    const ratedPlayers = Object.keys(userRatings);
    if (ratedPlayers.length === 0) return;

    setIsSubmitting(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch("/api/armchair-ratings-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          deviceId,
          ratings: userRatings,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fanVotes) setFanVotes(data.fanVotes);
        if (data.totalVoters !== undefined) setTotalFanVoters(data.totalVoters);
        setHasSubmitted(true);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, userRatings, isSubmitting, hasSubmitted]);

  if (!ratings || ratings.length === 0) return null;

  const ratedCount = Object.keys(userRatings).length;
  const allRated = ratedCount === ratings.length;

  return (
    <div className="mt-12 rounded-[2rem] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f172a] overflow-hidden shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-[#0f172a] border-b border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-left">
            <h3 className="font-outfit font-black text-lg text-slate-900 dark:text-white">
              Armchair Ratings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Author's ratings vs. the fans — rate every player yourself
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalFanVoters > 0 && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
              {totalFanVoters} fan{totalFanVoters !== 1 ? "s" : ""} rated
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="p-4 sm:p-6 space-y-3">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_100px] gap-4 px-4 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Player</span>
            <span className="text-center">Author</span>
            <span className="text-center">Fans</span>
          </div>

          {ratings.map((player) => {
            const fanData = fanVotes[player.name];
            const fanAvg = fanData && fanData.voteCount > 0
              ? (fanData.totalScore / fanData.voteCount)
              : null;
            const userRating = userRatings[player.name];
            const diff = fanAvg !== null ? fanAvg - player.authorRating : null;

            return (
              <div
                key={player.name}
                className="rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-slate-50/50 dark:bg-slate-900/30 p-4 transition-all hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="sm:grid sm:grid-cols-[1fr_100px_100px] sm:gap-4 sm:items-center">
                  {/* Player info */}
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    {player.imageUrl ? (
                      <img
                        src={player.imageUrl}
                        alt={player.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-800">
                        <span className="text-sm font-bold text-slate-500">
                          {player.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-outfit font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {player.name}
                      </p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                        {player.position}
                      </p>
                    </div>
                  </div>

                  {/* Author rating */}
                  <div className="flex sm:justify-center mb-3 sm:mb-0">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${getRatingBg(player.authorRating)}`}>
                      <span className={`font-outfit font-black text-lg ${getRatingColor(player.authorRating)}`}>
                        {player.authorRating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">/10</span>
                    </div>
                  </div>

                  {/* Fan average / voting */}
                  <div className="flex sm:justify-center">
                    {hasSubmitted && fanAvg !== null ? (
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${getRatingBg(fanAvg)}`}>
                          <span className={`font-outfit font-black text-lg ${getRatingColor(fanAvg)}`}>
                            {fanAvg.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">/10</span>
                        </div>
                        {diff !== null && Math.abs(diff) >= 0.5 && (
                          <p className={`text-[10px] font-bold mt-1 ${diff > 0 ? "text-emerald-500" : "text-red-400"}`}>
                            Fans say {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                          </p>
                        )}
                      </div>
                    ) : hasSubmitted ? (
                      <span className="text-xs text-slate-400 italic">No votes yet</span>
                    ) : null}
                  </div>
                </div>

                {/* Fan voting row (only when not submitted) */}
                {!hasSubmitted && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Your rating:</span>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleRatingSelect(player.name, num)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            userRating === num
                              ? "bg-amber-500 text-white shadow-sm scale-110"
                              : userRating && userRating !== num
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/20 hover:text-amber-600"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      {userRating && (
                        <span className={`ml-2 text-xs font-semibold ${getRatingColor(userRating)}`}>
                          {getRatingLabel(userRating)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit button */}
          {!hasSubmitted && (
            <div className="pt-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {ratedCount === 0
                  ? "Tap a number to rate each player"
                  : `${ratedCount}/${ratings.length} rated`}
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={ratedCount === 0 || isSubmitting}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                  ratedCount > 0
                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting
                  ? "Submitting..."
                  : allRated
                  ? "Submit All Ratings"
                  : `Submit ${ratedCount} Rating${ratedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {/* Post-submit summary */}
          {hasSubmitted && (
            <div className="pt-3 text-center">
              <p className="text-sm font-semibold text-emerald-500">
                ✅ Your ratings are in! See how you compare with the author above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
