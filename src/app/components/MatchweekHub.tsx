import { useState, useEffect } from "react";
import { Clock, Activity, CalendarDays } from "lucide-react";

export interface MatchFixture {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: "LIVE" | "FT" | "PRE-MATCH" | string;
    matchTime: string;
}

const MOCK_FIXTURES: MatchFixture[] = [
    {
        id: "1",
        homeTeam: "Arsenal",
        awayTeam: "Liverpool",
        homeScore: 2,
        awayScore: 1,
        status: "LIVE",
        matchTime: "89\"",
    },
    {
        id: "2",
        homeTeam: "Newcastle",
        awayTeam: "Aston Villa",
        homeScore: 1,
        awayScore: 1,
        status: "LIVE",
        matchTime: "45+2\"",
    },
    {
        id: "3",
        homeTeam: "Man City",
        awayTeam: "Chelsea",
        homeScore: 3,
        awayScore: 0,
        status: "FT",
        matchTime: "FT",
    },
    {
        id: "4",
        homeTeam: "Tottenham",
        awayTeam: "Man United",
        homeScore: null,
        awayScore: null,
        status: "PRE-MATCH",
        matchTime: "17:30",
    },
    {
        id: "5",
        homeTeam: "Brighton",
        awayTeam: "West Ham",
        homeScore: null,
        awayScore: null,
        status: "PRE-MATCH",
        matchTime: "Sun 14:00",
    },
];

/**
 * Hook to manage data fetching logic.
 * Easily swappable with a real fetch() call to a JSON API later.
 */
function useMatchData() {
    const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchMatches = async () => {
            try {
                // Swap the below block with your real API call:
                // const response = await fetch('/api/matches');
                // const data = await response.json();

                // Simulating network delay
                await new Promise((resolve) => setTimeout(resolve, 800));
                const data = MOCK_FIXTURES;

                if (isMounted) {
                    setFixtures(data);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to fetch matches:", error);
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMatches();

        // Example of polling for live scores every 60 seconds
        const intervalId = setInterval(fetchMatches, 60000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return { fixtures, isLoading };
}

export function MatchweekHub() {
    const { fixtures, isLoading } = useMatchData();

    if (isLoading) {
        return (
            <div className="w-full py-4 bg-slate-900 border-y border-slate-800">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
                    <div className="flex gap-4 overflow-hidden opacity-50">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="min-w-[200px] h-20 bg-slate-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-900 border-y border-slate-800/80 shadow-inner">
            <div className="max-w-[1280px] mx-auto">

                {/* Header Ribbon */}
                <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-slate-800/30 border-b border-slate-800">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Matchweek Hub</h2>
                </div>

                {/* Horizontal Scroll Container */}
                <div className="overflow-x-auto scrollbar-hide flex items-stretch py-3 px-4 sm:px-6 gap-3 snap-x snap-mandatory hide-scroll-bar">
                    {fixtures.map((match) => {
                        const isLive = match.status === "LIVE";
                        const isFinished = match.status === "FT";
                        const isUpcoming = match.status === "PRE-MATCH" || match.status === "UPCOMING";

                        return (
                            <div
                                key={match.id}
                                className="flex-shrink-0 w-[240px] bg-slate-800/60 rounded-xl border border-slate-700/50 p-3.5 flex flex-col justify-between snap-start hover:bg-slate-800 transition-colors"
                            >
                                {/* Match Status Header */}
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-1.5">
                                        {isLive && (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        )}
                                        {!isLive && <Clock className="w-3 h-3 text-slate-500" />}
                                        <span
                                            className={`text-[10px] font-bold uppercase tracking-wider ${isLive ? "text-emerald-400" : isFinished ? "text-slate-500" : "text-sky-400"
                                                }`}
                                        >
                                            {isLive ? match.matchTime : isUpcoming ? match.matchTime : "Full Time"}
                                        </span>
                                    </div>
                                </div>

                                {/* Teams & Scores */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-semibold truncate ${isFinished ? 'text-slate-400' : 'text-slate-100'}`}>
                                            {match.homeTeam}
                                        </span>
                                        <span className={`text-sm font-bold ml-2 ${isLive ? 'text-white' : isFinished ? 'text-slate-500' : 'text-slate-100'}`}>
                                            {match.homeScore !== null ? match.homeScore : "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-semibold truncate ${isFinished ? 'text-slate-400' : 'text-slate-100'}`}>
                                            {match.awayTeam}
                                        </span>
                                        <span className={`text-sm font-bold ml-2 ${isLive ? 'text-white' : isFinished ? 'text-slate-500' : 'text-slate-100'}`}>
                                            {match.awayScore !== null ? match.awayScore : "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* Basic Hide Scrollbar CSS Injection for clean look */}
            <style>{`
        .hide-scroll-bar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scroll-bar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
}
