import { useEffect, useState } from "react";
import { ArrowUpDown } from "lucide-react";

interface Fixture {
    id: string;
    opponent: string;
    isHome: boolean;
    difficulty: 1 | 2 | 3 | 4 | 5;
}

interface RunInTeamData {
    id: string;
    teamName: string;
    logoHash: string;
    currentPoints: number;
    goalDifference: number;
    fixtures: Fixture[];
    rank: number;
}

interface RunInConfig {
    title: string;
    description: string;
    teams: RunInTeamData[];
}

export function RunInTracker() {
    const [config, setConfig] = useState<RunInConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/run-in");
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.teams && data.teams.length > 0) {
                        data.teams.sort((a: RunInTeamData, b: RunInTeamData) => a.rank - b.rank);
                        setConfig(data);
                    }
                }
            } catch (err) {
                console.error("Failed to load Run-In Tracker", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 mb-8 border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!config) return null;

    const getDifficultyColor = (diff: number) => {
        switch (diff) {
            case 1: return "bg-emerald-500 text-white border-emerald-600";
            case 2: return "bg-green-400 text-white border-green-500";
            case 3: return "bg-yellow-400 text-yellow-900 border-yellow-500";
            case 4: return "bg-orange-400 text-white border-orange-500";
            case 5: return "bg-red-500 text-white border-red-600";
            default: return "bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-8 shadow-sm">
            <div className="p-4 bg-gradient-to-r from-[#16A34A] to-[#15803d]">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5 text-white/80" />
                    {config.title || "The Run-In"}
                </h3>
                {config.description && (
                    <p className="text-white/80 text-xs mt-1">{config.description}</p>
                )}
            </div>
            
            <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-xs text-[#64748B] dark:text-gray-400 border-b border-gray-100 dark:border-gray-800/50">
                            <th className="pb-2 font-medium w-8 text-center border-r border-gray-100 dark:border-gray-800">#</th>
                            <th className="pb-2 pl-3 font-medium border-r border-gray-100 dark:border-gray-800">Team</th>
                            <th className="pb-2 text-center font-medium w-12 border-r border-gray-100 dark:border-gray-800">Pts</th>
                            <th className="pb-2 text-center font-medium border-r border-gray-100 dark:border-gray-800">GD</th>
                            <th className="pb-2 pl-3 font-medium">Remaining Fixtures</th>
                        </tr>
                    </thead>
                    <tbody>
                        {config.teams.map((team, index) => (
                            <tr key={team.id} className="border-b border-gray-50 dark:border-gray-800/30 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                <td className="py-3 text-center font-bold text-[#0F172A] dark:text-white border-r border-gray-100 dark:border-gray-800">
                                    {team.rank || index + 1}
                                </td>
                                <td className="py-3 pl-3 font-semibold text-[#0F172A] dark:text-white whitespace-nowrap border-r border-gray-100 dark:border-gray-800">
                                    {team.teamName}
                                </td>
                                <td className="py-3 text-center font-bold text-[#16A34A] dark:text-[#4ade80] border-r border-gray-100 dark:border-gray-800">
                                    {team.currentPoints}
                                </td>
                                <td className="py-3 text-center text-xs text-[#64748B] dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                                    {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                                </td>
                                <td className="py-3 pl-3">
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                                        {team.fixtures.map(fixture => (
                                            <div 
                                                key={fixture.id} 
                                                className={`flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-lg text-[10px] font-bold tracking-tighter uppercase border border-b-2 ${getDifficultyColor(fixture.difficulty)}`}
                                                title={`${fixture.opponent} (${fixture.isHome ? 'Home' : 'Away'}) - Difficulty: ${fixture.difficulty}/5`}
                                            >
                                                <span>{fixture.opponent}</span>
                                                <span className="text-[8px] opacity-90 font-medium">{fixture.isHome ? '(H)' : '(A)'}</span>
                                            </div>
                                        ))}
                                        {team.fixtures.length === 0 && (
                                            <span className="text-xs text-gray-400 italic">No fixtures</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>Very Easy</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400"></span>Easy</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400"></span>Mod</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400"></span>Hard</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>Very Hard</span>
            </div>
        </div>
    );
}
