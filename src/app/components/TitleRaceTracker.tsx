import React from "react";
import { useTitleRace, type TitleRaceData } from "../hooks/useTitleRace";
import { Link } from "react-router";

// Utility to format ISO date to GW notation or general date
function formatUpdatedTimestamp(isoString?: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function TitleRaceTracker() {
    const { data, isLoading, error } = useTitleRace(60000); // 1 minute polling

    if (error) {
        return null;
    }

    if (isLoading || !data) {
        return (
            <div className="bg-[#09090B] rounded-2xl p-6 mb-8 border border-gray-800 animate-pulse w-full shadow-2xl overflow-hidden relative">
                <div className="h-8 w-1/3 bg-[#18181B] rounded mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-14 bg-[#18181B] rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#09090B] rounded-2xl border border-gray-800 overflow-hidden mb-8 shadow-[0_0_40px_rgba(200,255,0,0.03)] w-full">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
                .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}
            </style>
            
            <div className="p-5 sm:p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8FF00] opacity-[0.03] blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[#C8FF00] animate-pulse shadow-[0_0_8px_#C8FF00]"></div>
                        <span className="text-[#C8FF00] text-[10px] font-bold uppercase tracking-[0.2em]">Live Standings</span>
                    </div>
                    <h3 className="text-white text-3xl sm:text-4xl font-bebas leading-none">
                        The Run-in
                    </h3>
                </div>
                {data.updatedAt && (
                    <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        Last updated: <span className="text-gray-400">{formatUpdatedTimestamp(data.updatedAt)}</span>
                    </div>
                )}
            </div>
            
            <div className="w-full overflow-x-auto hide-scrollbar">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead>
                        <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800/50 bg-[#09090B]">
                            <th className="py-3 px-4 sm:px-6 font-semibold w-12 text-center border-r border-gray-800">Pos</th>
                            <th className="py-3 px-4 font-semibold border-r border-gray-800">Team</th>
                            <th className="py-3 px-2 font-semibold text-center border-r border-gray-800 w-12">P</th>
                            <th className="py-3 px-2 font-semibold text-center border-r border-gray-800 w-12">GD</th>
                            <th className="py-3 px-3 font-semibold text-center border-r border-gray-800 text-[#C8FF00]">Pts</th>
                            <th className="py-3 px-4 font-semibold border-r border-gray-800">Form</th>
                            <th className="py-3 px-4 font-semibold border-r border-gray-800">Remaining</th>
                            <th className="py-3 px-4 font-semibold">Verdict</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {data.teams.map((team, index) => (
                            <tr key={team.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-4 sm:px-6 text-center font-bebas text-xl text-gray-400 border-r border-gray-800">
                                    {index + 1}
                                </td>
                                <td className="py-3 px-4 border-r border-gray-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color || "#C8FF00" }}></div>
                                        <span className="font-bold text-white uppercase tracking-wide hidden sm:inline-block">{team.name}</span>
                                        <span className="font-bold text-white uppercase tracking-wide inline-block sm:hidden">{team.short || team.name.slice(0,3)}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-2 text-center text-gray-400 font-medium border-r border-gray-800">
                                    {team.played}
                                </td>
                                <td className="py-3 px-2 text-center text-gray-400 font-medium border-r border-gray-800">
                                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                                </td>
                                <td className="py-3 px-3 text-center border-r border-gray-800">
                                    <span className="font-bebas text-2xl text-[#C8FF00] drop-shadow-[0_0_12px_rgba(200,255,0,0.3)]">
                                        {team.pts}
                                    </span>
                                </td>
                                <td className="py-3 px-4 border-r border-gray-800">
                                    <div className="flex items-center gap-1">
                                        {team.form.map((result, i) => (
                                            <span 
                                                key={i} 
                                                className={`w-5 h-5 flex items-center justify-center rounded-[4px] text-[10px] font-bold ${
                                                    result === 'W' ? 'bg-[#16A34A] text-white' : 
                                                    result === 'D' ? 'bg-gray-700 text-white' : 
                                                    result === 'L' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400'
                                                }`}
                                            >
                                                {result}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-3 px-4 border-r border-gray-800">
                                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
                                        {team.remaining.map((fix, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`flex-shrink-0 flex flex-col items-center justify-center w-[38px] h-[38px] rounded-lg border border-opacity-30 ${
                                                    fix.diff === 3 ? 'bg-red-500/10 border-red-500 text-red-500' : 
                                                    fix.diff === 2 ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 
                                                    'bg-green-500/10 border-green-500 text-green-500'
                                                }`}
                                                title={`Difficulty: ${fix.diff}`}
                                            >
                                                <span className="text-[10px] font-bold tracking-tighter uppercase leading-none">{fix.opp}</span>
                                                <span className="text-[8px] opacity-70 font-semibold leading-none mt-[2px]">{fix.h ? 'H' : 'A'}</span>
                                            </div>
                                        ))}
                                        {team.remaining.length === 0 && <span className="text-[10px] text-gray-500 uppercase tracking-wider">No remaining fixtures</span>}
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-xs font-semibold text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-700/50 block w-max">
                                        {team.verdict}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="px-5 sm:px-6 py-4 bg-[#0F172A] border-t border-gray-800 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-gray-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>Easier</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span>Moderate</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Hard</span>
                </div>
                <Link to="/transfers" className="text-[#C8FF00] hover:underline flex items-center gap-1">
                    See Transfer Impact <span>→</span>
                </Link>
            </div>
        </div>
    );
}
