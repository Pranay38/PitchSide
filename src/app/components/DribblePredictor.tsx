import { useState, useEffect } from "react";
import { Trophy, ChevronRight, Activity, CalendarClock, User, CheckCircle2 } from "lucide-react";
import { getGuestId, getGuestUsername, setGuestUsername } from "../lib/guestAuth";

interface Fixture {
  _id: string;
  gameweek: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: "upcoming" | "live" | "completed";
  actualHomeScore: number | null;
  actualAwayScore: number | null;
}

interface Pick {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned: number;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
}

export function DribblePredictor() {
  const [activeTab, setActiveTab] = useState<"predict" | "leaderboard">("predict");
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [userPicks, setUserPicks] = useState<Pick[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameweek, setGameweek] = useState<number | null>(null);
  
  const [picksState, setPicksState] = useState<Record<string, { home: number | '', away: number | '' }>>({});
  const [usernameInput, setUsernameInput] = useState("");
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const guestId = getGuestId();
  const guestUsername = getGuestUsername();

  const fetchPredictorData = async () => {
    try {
      const res = await fetch(`/api/predictions?userId=${guestId}`);
      if (!res.ok) return;
      const data = await res.json();
      
      setGameweek(data.gameweek);
      setFixtures(data.fixtures || []);
      setUserPicks(data.userPicks || []);
      setLeaderboard(data.leaderboard || []);

      // Populate local picks state from DB
      const initialPicks: Record<string, { home: number | '', away: number | '' }> = {};
      if (data.userPicks && data.userPicks.length > 0) {
        data.userPicks.forEach((p: any) => {
          initialPicks[p.fixtureId] = { home: p.homeScore, away: p.awayScore };
        });
      } else {
        (data.fixtures || []).forEach((f: Fixture) => {
            initialPicks[f._id] = { home: '', away: '' };
        });
      }
      setPicksState(initialPicks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictorData();
  }, []);

  const handleScoreChange = (fixtureId: string, team: "home" | "away", val: string) => {
    const num = val === '' ? '' : parseInt(val, 10);
    if (num !== '' && (isNaN(num) || num < 0 || num > 20)) return; // sanity bounds
    
    setPicksState((prev) => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        [team]: num,
      },
    }));
  };

  const attemptSubmit = () => {
    // Check if fully filled out
    const missing = fixtures.some(f => picksState[f._id]?.home === '' || picksState[f._id]?.away === '');
    if (missing) {
      alert("Please fill out all predictions before submitting!");
      return;
    }

    if (!guestUsername) {
      setShowUsernamePrompt(true);
    } else {
      submitToApi(guestUsername);
    }
  };

  const handleUsernameSubmit = () => {
    if (usernameInput.trim().length < 3) return;
    setGuestUsername(usernameInput.trim());
    setShowUsernamePrompt(false);
    submitToApi(usernameInput.trim());
  };

  const submitToApi = async (nameToUse: string) => {
    setSubmitting(true);
    const payload = {
      userId: guestId,
      username: nameToUse,
      picks: fixtures.map(f => ({
        fixtureId: f._id,
        homeScore: picksState[f._id].home as number,
        awayScore: picksState[f._id].away as number
      }))
    };

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit predictions. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-[400px] rounded-2xl w-full"></div>;
  }

  const allCompleted = userPicks.length > 0 && fixtures.length > 0 && userPicks.length === fixtures.length;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mb-6 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#16A34A] fill-[#16A34A]/20" />
        <h3 className="font-outfit font-black text-lg text-[#0F172A] dark:text-white uppercase tracking-tight">
          The Dribble Predictor
        </h3>
      </div>

      <div className="flex rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 p-1 mb-5">
        <button
          onClick={() => setActiveTab("predict")}
          className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
            activeTab === "predict"
              ? "bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {gameweek ? `GW ${gameweek} Picks` : "No Active GW"}
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
            activeTab === "leaderboard"
              ? "bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-sm"
              : "text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === "predict" && (
        <div className="flex-1 flex flex-col">
          {!fixtures.length ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <CalendarClock className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                No active fixtures to predict right now. Check back soon!
              </p>
            </div>
          ) : (
            <>
              {showUsernamePrompt ? (
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-center space-y-3">
                  <User className="w-6 h-6 text-[#16A34A] mx-auto" />
                  <h4 className="font-bold text-[#0F172A] dark:text-white text-sm">Join the Leaderboard</h4>
                  <p className="text-xs text-[#64748B] dark:text-gray-400">Enter a username to save your picks and track your points over the season.</p>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Username"
                    className="w-full text-center px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-slate-700"
                  />
                  <button 
                    onClick={handleUsernameSubmit}
                    disabled={usernameInput.length < 3}
                    className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    Save & Submit
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {fixtures.map((fixture) => {
                    const isUpcoming = fixture.status === "upcoming";
                    const pickHome = picksState[fixture._id]?.home ?? '';
                    const pickAway = picksState[fixture._id]?.away ?? '';

                    return (
                      <div key={fixture._id} className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          <span>{new Date(fixture.matchDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</span>
                          {fixture.status === "live" && <span className="text-red-500 flex items-center gap-1"><Activity className="w-3 h-3" /> Live</span>}
                        </div>
                        
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 text-right  font-bold text-sm text-[#0F172A] dark:text-white leading-tight">
                            {fixture.homeTeam}
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input 
                              type="number"
                              disabled={!isUpcoming}
                              value={pickHome}
                              onChange={(e) => handleScoreChange(fixture._id, "home", e.target.value)}
                              className="w-9 h-9 text-center bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg font-bold text-base text-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] focus:outline-none disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-slate-800"
                            />
                            <span className="text-gray-400 font-bold">-</span>
                            <input 
                              type="number"
                              disabled={!isUpcoming}
                              value={pickAway}
                              onChange={(e) => handleScoreChange(fixture._id, "away", e.target.value)}
                              className="w-9 h-9 text-center bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg font-bold text-base text-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] focus:outline-none disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-slate-800"
                            />
                          </div>

                          <div className="flex-1 text-left font-bold text-sm text-[#0F172A] dark:text-white leading-tight">
                            {fixture.awayTeam}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {!showUsernamePrompt && (
                <button
                  onClick={attemptSubmit}
                  disabled={submitting || success}
                  className={`mt-auto w-full font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm ${
                    success 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-[#0F172A] hover:bg-[#1E293B] dark:bg-slate-700 dark:hover:bg-slate-600 text-white"
                  }`}
                >
                  {submitting ? "Saving..." : success ? <><CheckCircle2 className="w-5 h-5" /> Saved picks!</> : allCompleted ? "Update Picks" : "Submit Picks"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="flex-1">
          {!leaderboard.length ? (
            <div className="text-center py-8 text-sm text-gray-500">No scores recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div key={entry.userId} className={`flex items-center justify-between p-3 rounded-xl border ${entry.userId === guestId ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800" : "bg-gray-50 border-gray-100 dark:bg-slate-800/40 dark:border-gray-800"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 text-center font-bold text-sm ${idx < 3 ? "text-amber-500" : "text-gray-400"}`}>{idx + 1}</span>
                    <span className={`font-bold text-sm ${entry.userId === guestId ? "text-green-700 dark:text-green-400" : "text-[#0F172A] dark:text-gray-200"}`}>
                      {entry.username} {entry.userId === guestId && "(You)"}
                    </span>
                  </div>
                  <span className="font-black text-[#16A34A]">{entry.totalPoints} <span className="text-xs font-semibold text-gray-400 uppercase">pts</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
