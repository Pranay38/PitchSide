import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Trophy, RefreshCw, Medal, Target, Flame } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { DribblePredictor } from "../components/DribblePredictor";

type LeaderboardEntry = {
  sessionId: string;
  name: string;
  score: number;
  totalPredictions: number;
  accuracy: number;
};

export function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app we'd fetch this from a /api/leaderboard endpoint connected to MongoDB
  // For the MVP, we'll simulate the top predictors to drive engagement, and fetch 
  // the current user's actual local score to insert them into the list.
  useEffect(() => {
    let isMounted = true;
    
    setTimeout(() => {
        if (!isMounted) return;
        
        // Get user's local score if they've played
        let userScore = 0;
        let userTotal = 0;
        try {
           const localData = JSON.parse(localStorage.getItem("pitchside_predictor_state") || "{}");
           userScore = localData.score || 0;
           userTotal = (localData.correctIds?.length || 0) + (localData.incorrectIds?.length || 0) + userScore; 
           // rough estimate for total played if score is just correct points
        } catch(e) {}
        
        const mockData: LeaderboardEntry[] = [
            { sessionId: "1", name: "TacticsNerd99", score: 850, totalPredictions: 142, accuracy: 68 },
            { sessionId: "2", name: "xG_Enthusiast", score: 720, totalPredictions: 110, accuracy: 62 },
            { sessionId: "3", name: "FalseNine", score: 690, totalPredictions: 135, accuracy: 55 },
            { sessionId: "4", name: "Kloppite88", score: 550, totalPredictions: 89, accuracy: 58 },
            { sessionId: "5", name: "WengerOut", score: 420, totalPredictions: 90, accuracy: 46 },
            { sessionId: "6", name: "SetPieceGuru", score: 380, totalPredictions: 60, accuracy: 63 },
            { sessionId: "7", name: "TikiTakaTom", score: 310, totalPredictions: 45, accuracy: 66 },
            { sessionId: "8", name: "VAR_Lover", score: 290, totalPredictions: 50, accuracy: 56 },
            { sessionId: "9", name: "B2B_Mid", score: 210, totalPredictions: 40, accuracy: 50 },
            { sessionId: "10", name: "SweeperKeeper", score: 180, totalPredictions: 25, accuracy: 72 },
        ];
        
        // Inject user if they have points
        if (userScore > 0) {
            mockData.push({
                sessionId: "you",
                name: "You",
                score: userScore * 10, // Match the scale
                totalPredictions: Math.max(userTotal, userScore),
                accuracy: Math.round((userScore / Math.max(userTotal, userScore, 1)) * 100)
            });
            mockData.sort((a,b) => b.score - a.score);
        }
        
        setLeaderboard(mockData.slice(0, 10)); // Top 10
        setLoading(false);
    }, 600);

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title="Predictions Leaderboard"
        description="See who knows football best. Make predictions, rank up, and top the The Touchline Dribble global leaderboard."
        url="https://pitchside-orcin.vercel.app/leaderboard"
      />
      <Header />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 md:py-12">
        <section className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-full bg-orange-500/10 text-orange-500 mb-6 border border-orange-500/20">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white leading-tight">
            Global Predictor Standings
          </h1>
          <p className="text-base text-[#64748B] dark:text-gray-400 mt-4">
            Think you know ball? Make match predictions below and climb the global ranks. The most accurate predictors earn the gold tier.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 xl:gap-12">
          {/* Main Leaderboard */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white">Top 10 Predictors</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] dark:text-gray-400">
                <RefreshCw className="w-3.5 h-3.5" /> Live
              </div>
            </div>
            
            <div className="p-0">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <RefreshCw className="w-8 h-8 text-[#16A34A] animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {leaderboard.map((entry, index) => {
                    const isTop3 = index < 3;
                    const isYou = entry.sessionId === "you";
                    return (
                      <div 
                        key={entry.sessionId}
                        className={`flex items-center gap-4 p-4 sm:p-6 transition-colors ${
                            isYou ? "bg-[#16A34A]/5 border-l-4 border-l-[#16A34A] dark:bg-[#16A34A]/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.02] border-l-4 border-l-transparent"
                        }`}
                      >
                        {/* Rank */}
                        <div className="w-8 sm:w-12 text-center flex-shrink-0 flex justify-center">
                           {index === 0 ? <Medal className="w-7 h-7 text-yellow-500 drop-shadow-sm" /> :
                            index === 1 ? <Medal className="w-7 h-7 text-gray-400 drop-shadow-sm" /> :
                            index === 2 ? <Medal className="w-7 h-7 text-amber-700 drop-shadow-sm" /> :
                            <span className="text-lg font-black text-gray-400">{index + 1}</span>}
                        </div>
                        
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <p className={`text-base sm:text-lg font-bold truncate ${isYou ? "text-[#16A34A] dark:text-[#4ade80]" : "text-[#0F172A] dark:text-white"}`}>
                               {entry.name}
                             </p>
                             {isYou && <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-black bg-[#16A34A] text-white rounded-md">You</span>}
                           </div>
                           <div className="flex items-center gap-4 mt-1">
                               <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
                                   <Target className="w-3 h-3" /> {entry.accuracy}% acc
                               </span>
                               <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                                   {entry.totalPredictions} played
                               </span>
                           </div>
                        </div>
                        
                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">
                                {entry.score.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A] mt-0.5">Pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Interaction */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/10 rounded-bl-full -mr-8 -mt-8" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-5 h-5 text-orange-500 hidden sm:block" />
                        <h2 className="text-xl md:text-2xl font-black font-outfit text-[#0F172A] dark:text-white">Start Climbing</h2>
                    </div>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mb-8 max-w-sm">
                        Earn 10 points for every correct match prediction. How high can you get your accuracy?
                    </p>
                    
                    <div className="-mx-2 sm:mx-0">
                        <DribblePredictor />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
