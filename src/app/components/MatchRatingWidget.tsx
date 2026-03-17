import { useState, useEffect } from "react";
import { Star, BarChart3, CheckCircle2, User } from "lucide-react";

interface MatchRatingPlayer {
    id: string;
    name: string;
    imageUrl: string;
    totalScore: number;
    voteCount: number;
}

interface MatchRatingSession {
    _id: string;
    title: string;
    isActive: boolean;
    players: MatchRatingPlayer[];
}

export function MatchRatingWidget() {
    const [session, setSession] = useState<MatchRatingSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [hasVoted, setHasVoted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch("/api/match-ratings?active=true");
                if (res.ok) {
                    const data = await res.json();
                    if (data && data._id) {
                        setSession(data);
                        // Check local storage to see if user already voted
                        const votedSessions = JSON.parse(localStorage.getItem("votedMatchRatings") || "[]");
                        if (votedSessions.includes(data._id)) {
                            setHasVoted(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load match rating session", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, []);

    const handleRatingChange = (playerId: string, value: number) => {
        setRatings(prev => ({
            ...prev,
            [playerId]: value
        }));
    };

    const handleSubmit = async () => {
        if (!session) return;
        
        // Ensure all players are rated before submission, or you can allow partial. Let's require all.
        const missingRatings = session.players.some(p => !ratings[p.id]);
        if (missingRatings) {
            alert("Please rate all players before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const ratingsArray = Object.entries(ratings).map(([playerId, rating]) => ({
                playerId,
                rating
            }));

            const res = await fetch(`/api/match-ratings/${session._id}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ratings: ratingsArray })
            });

            if (res.ok) {
                const updatedSession = await res.json();
                setSession(updatedSession);
                setHasVoted(true);
                
                // Save to local storage
                const votedSessions = JSON.parse(localStorage.getItem("votedMatchRatings") || "[]");
                localStorage.setItem("votedMatchRatings", JSON.stringify([...votedSessions, session._id]));
            }
        } catch (err) {
            console.error("Failed to submit ratings", err);
            alert("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;
    if (!session) return null; // Don't show anything if no active session

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 shadow-sm my-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-[#16A34A]/10 rounded-2xl">
                    <BarChart3 className="w-6 h-6 text-[#16A34A]" />
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] dark:text-white">
                        {session.title}
                    </h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        How did the players perform? Have your say.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {session.players.map(player => {
                    const currentRating = ratings[player.id] || 0;
                    const average = player.voteCount > 0 ? (player.totalScore / player.voteCount).toFixed(1) : "N/A";

                    return (
                        <div key={player.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0F172A]/50">
                            {/* Player Info */}
                            <div className="flex items-center gap-4 md:w-1/3">
                                {player.imageUrl ? (
                                    <img src={player.imageUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700" loading="lazy" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                <span className="font-bold text-[#0F172A] dark:text-white">{player.name}</span>
                            </div>

                            {/* Rating Control or Result */}
                            <div className="flex-1 flex flex-col justify-center">
                                {!hasVoted ? (
                                    <div className="flex items-center gap-4 w-full">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={currentRating || 5}
                                            onChange={(e) => handleRatingChange(player.id, parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#16A34A]"
                                        />
                                        <div className="w-10 text-center font-bold text-[#16A34A] text-lg">
                                            {currentRating > 0 ? currentRating : "-"}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#16A34A] to-[#22c55e] transition-all duration-1000 ease-out"
                                                style={{ width: `${(parseFloat(average) / 10) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex flex-col items-end w-16">
                                            <span className="font-black text-xl text-[#0F172A] dark:text-white flex items-center gap-1">
                                                {average} <Star className="w-4 h-4 fill-[#16A34A] text-[#16A34A]" />
                                            </span>
                                            <span className="text-[10px] text-[#64748B] dark:text-gray-400">avg rating</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {!hasVoted && (
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-3.5 bg-[#16A34A] text-white rounded-xl font-bold text-sm hover:bg-[#15803d] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting ? "Submitting..." : "Submit Ratings"}
                    </button>
                </div>
            )}
            
            {hasVoted && (
                <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center gap-3 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">Thanks for voting! Your ratings have been added to the community average.</p>
                </div>
            )}
        </div>
    );
}
