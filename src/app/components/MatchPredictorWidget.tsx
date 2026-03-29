import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Trophy, Check, Loader2, Target } from "lucide-react";

interface Fixture {
  _id: string;
  gameweek: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: string;
  actualHomeScore: number | null;
  actualAwayScore: number | null;
}

interface Pick {
  _id?: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned?: number;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
}

export function MatchPredictorWidget() {
  const { user } = useUser();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameweek, setGameweek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let url = "/api/predictions";
    if (user) {
      url += `?userId=${user.id}`;
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setGameweek(data.gameweek);
        setFixtures(data.fixtures || []);
        setLeaderboard(data.leaderboard || []);
        
        const initialPicks: Record<string, Pick> = {};
        if (data.userPicks) {
          data.userPicks.forEach((p: Pick) => {
            initialPicks[p.fixtureId] = p;
          });
        }
        setPicks(initialPicks);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load predictions", err);
        setLoading(false);
      });
  }, [user]);

  const updatePick = (fixtureId: string, team: "home" | "away", delta: number) => {
    setPicks((prev) => {
      const current = prev[fixtureId] || { fixtureId, homeScore: 0, awayScore: 0 };
      const nextScore = Math.max(0, (team === "home" ? current.homeScore : current.awayScore) + delta);
      return {
        ...prev,
        [fixtureId]: {
          ...current,
          ...(team === "home" ? { homeScore: nextScore } : { awayScore: nextScore }),
        },
      };
    });
    setSaved(false);
  };

  const submitPicks = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    
    const payload = Object.values(picks);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.username || "Fan",
          picks: payload,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
        <Loader2 className="h-6 w-6 animate-spin text-[#16A34A]" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading gameweek fixtures...</p>
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 dark:border-gray-800 dark:bg-[#0F172A]">
        <h3 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white">Gameweek Predictor</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">No active fixtures available for predictions right now.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* ─── Fixtures & Prediction UI ─── */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-[#0F172A]/[0.02] dark:border-gray-800 dark:bg-[#0F172A] md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A] opacity-5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative">
          <div>
            <h3 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">Predict the Scores</h3>
            <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">Gameweek {gameweek} • 3 pts for perfect score, 1 pt for result</p>
          </div>
          <div className="w-12 h-12 bg-[#16A34A]/10 text-[#16A34A] rounded-full flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-4 relative">
          {fixtures.map((fixture) => {
            const pick = picks[fixture._id] || { homeScore: 0, awayScore: 0 };
            const isFinished = fixture.status === "completed" || fixture.status === "finished";

            return (
              <div key={fixture._id} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-[#1E293B]/30 hover:bg-gray-50 dark:hover:bg-[#1E293B]/60 transition-colors">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Home Team */}
                  <div className="flex-1 flex items-center justify-end sm:justify-end gap-4 w-full sm:w-auto">
                    <span className="font-bold text-[#0F172A] dark:text-white uppercase tracking-wider text-sm">{fixture.homeTeam}</span>
                  </div>

                  {/* Score Editor */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      disabled={isFinished || !user}
                      onClick={() => updatePick(fixture._id, "home", -1)}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold tabular-nums flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      -
                    </button>
                    <div className="w-20 text-center font-black text-2xl font-outfit text-[#0F172A] dark:text-white tabular-nums tracking-widest">
                      {pick.homeScore}<span className="text-[#16A34A] mx-1 animate-pulse">:</span>{pick.awayScore}
                    </div>
                    <button 
                      disabled={isFinished || !user}
                      onClick={() => updatePick(fixture._id, "away", 1)}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold tabular-nums flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex items-center justify-start sm:justify-start gap-4 w-full sm:w-auto">
                    <span className="font-bold text-[#0F172A] dark:text-white uppercase tracking-wider text-sm">{fixture.awayTeam}</span>
                  </div>
                </div>

                {isFinished && (
                  <div className="mt-3 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Full Time: {fixture.actualHomeScore} - {fixture.actualAwayScore}
                    {pick.pointsEarned !== undefined && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-[#16A34A]/10 text-[#16A34A]">
                        +{pick.pointsEarned} pts
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end relative">
          {!user ? (
            <p className="text-sm font-bold text-gray-500">Sign in to save predictions</p>
          ) : (
            <button
              onClick={submitPicks}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all ${
                saved ? "bg-black dark:bg-gray-700" : "bg-[#16A34A] hover:bg-[#15803d]"
              }`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
              {saved ? "Predictions Locked" : "Lock Predictions"}
            </button>
          )}
        </div>
      </div>

      {/* ─── Leaderboard ─── */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-[#0F172A]/[0.02] dark:border-gray-800 dark:bg-[#0F172A] md:p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white">Top Tipsters</h3>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-gray-500">No points on the board yet. Secure your spot!</p>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, idx) => (
              <div key={entry.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-5 text-sm font-black text-center ${
                    idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-gray-300 dark:text-gray-700"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`text-sm font-bold ${entry.userId === user?.id ? "text-[#16A34A]" : "text-[#0F172A] dark:text-gray-200"}`}>
                    {entry.username.split(' ')[0]} {entry.userId === user?.id && "(You)"}
                  </span>
                </div>
                <span className="text-sm font-black text-[#0F172A] dark:text-white tabular-nums">
                  {entry.totalPoints} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
