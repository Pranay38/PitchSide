import { useEffect, useState } from "react";
import { Trophy, MapPin, Calendar } from "lucide-react";

interface Scorer {
  name: string;
  minute: string | number;
}

interface StatRow {
  label: string;
  home: string | number;
  away: string | number;
}

interface PlayerRating {
  name: string;
  rating: number;
  position?: string;
}

export interface MatchCardData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeScorers: Scorer[];
  awayScorers: Scorer[];
  competition: string;
  matchDate: string;
  venue: string;
  stats: StatRow[];
  homePlayers: PlayerRating[];
  awayPlayers: PlayerRating[];
}

/** Standalone MatchCard that fetches its own data by ID */
export function MatchCardEmbed({ matchId }: { matchId: string }) {
  const [data, setData] = useState<MatchCardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/match-cards?id=${matchId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true));
  }, [matchId]);

  if (error) return <div className="text-sm text-gray-500 italic p-4">Match card not available.</div>;
  if (!data) return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8 animate-pulse bg-gray-50 dark:bg-[#1E293B]/30">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mb-4" />
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
    </div>
  );

  return <MatchCard data={data} />;
}

/** Pure render component — no fetching, just render the data */
export function MatchCard({ data }: { data: MatchCardData }) {
  const { homeTeam, awayTeam, homeScore, awayScore, homeScorers, awayScorers, competition, matchDate, venue, stats, homePlayers, awayPlayers } = data;

  const getRatingColor = (r: number) => {
    if (r >= 8) return "bg-[#16A34A] text-white";
    if (r >= 7) return "bg-emerald-400/20 text-[#16A34A]";
    if (r >= 6) return "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400";
    return "bg-red-400/20 text-red-500";
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch { return d; }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#0F172A] shadow-lg my-6 not-prose">
      {/* Header: Competition + Meta */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-6 py-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-[#16A34A]" />
          <span className="font-bold uppercase tracking-wider text-white/80">{competition || "Match"}</span>
        </div>
        <div className="flex items-center gap-4">
          {venue && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{venue}</span>
          )}
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(matchDate)}</span>
        </div>
      </div>

      {/* Score Section */}
      <div className="px-6 py-6 bg-gradient-to-b from-[#0F172A] to-[#1E293B]">
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {/* Home */}
          <div className="text-center flex-1">
            <p className="text-lg sm:text-xl font-black text-white">{homeTeam}</p>
            {homeScorers.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {homeScorers.map((s, i) => (
                  <p key={i} className="text-xs text-gray-400">{s.name} {s.minute}'</p>
                ))}
              </div>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center gap-3">
            <span className="text-4xl sm:text-5xl font-black text-white">{homeScore}</span>
            <span className="text-2xl text-gray-600">-</span>
            <span className="text-4xl sm:text-5xl font-black text-white">{awayScore}</span>
          </div>

          {/* Away */}
          <div className="text-center flex-1">
            <p className="text-lg sm:text-xl font-black text-white">{awayTeam}</p>
            {awayScorers.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {awayScorers.map((s, i) => (
                  <p key={i} className="text-xs text-gray-400">{s.name} {s.minute}'</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats.length > 0 && (
        <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#16A34A] mb-4">Match Stats</h4>
          <div className="space-y-3">
            {stats.map((stat, i) => {
              const homeNum = parseFloat(String(stat.home)) || 0;
              const awayNum = parseFloat(String(stat.away)) || 0;
              const total = homeNum + awayNum || 1;
              const homePercent = (homeNum / total) * 100;

              return (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold text-[#0F172A] dark:text-white mb-1">
                    <span>{stat.home}</span>
                    <span className="text-xs text-gray-500 font-semibold">{stat.label}</span>
                    <span>{stat.away}</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div className="bg-[#16A34A] rounded-l-full transition-all" style={{ width: `${homePercent}%` }} />
                    <div className="bg-gray-400 dark:bg-gray-600 rounded-r-full transition-all" style={{ width: `${100 - homePercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Player Ratings */}
      {(homePlayers.length > 0 || awayPlayers.length > 0) && (
        <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#16A34A] mb-4">Player Ratings</h4>
          <div className="grid grid-cols-2 gap-8">
            {/* Home */}
            <div>
              <p className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 uppercase tracking-wider">{homeTeam}</p>
              <div className="space-y-1.5">
                {homePlayers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.position && <span className="text-[10px] text-gray-400 w-6 text-right font-mono">{p.position}</span>}
                      <span className="text-sm text-[#0F172A] dark:text-gray-200">{p.name}</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${getRatingColor(p.rating)}`}>
                      {p.rating.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Away */}
            <div>
              <p className="text-xs font-bold text-[#0F172A] dark:text-white mb-3 uppercase tracking-wider">{awayTeam}</p>
              <div className="space-y-1.5">
                {awayPlayers.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.position && <span className="text-[10px] text-gray-400 w-6 text-right font-mono">{p.position}</span>}
                      <span className="text-sm text-[#0F172A] dark:text-gray-200">{p.name}</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${getRatingColor(p.rating)}`}>
                      {p.rating.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer branding */}
      <div className="px-6 py-2.5 bg-gray-50 dark:bg-[#0B1120] text-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">The Touchline Dribble</span>
      </div>
    </div>
  );
}
