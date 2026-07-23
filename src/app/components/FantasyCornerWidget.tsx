import { Wand2, Clock } from "lucide-react";
import type { FantasyCorner } from "../lib/siteSettingsStorage";

export function FantasyCornerWidget({ data }: { data: FantasyCorner }) {
  if (!data?.enabled) return null;

  return (
    <div className="tinted-panel rounded-3xl p-6 border border-gray-100 dark:border-gray-800/50 bg-gradient-to-br from-white to-purple-50 dark:from-[var(--card)] dark:to-purple-900/10 shadow-sm relative overflow-hidden group h-full">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <Wand2 className="w-24 h-24 text-purple-500" />
      </div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
          <Wand2 className="w-5 h-5" />
          <span>FPL Corner • GW{data.gameweek}</span>
        </div>
        {data.deadline && (
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
            <Clock className="w-3 h-3" />
            <span>{data.deadline}</span>
          </div>
        )}
      </div>

      <div className="space-y-4 relative z-10">
        {/* Captain Pick */}
        <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-100 dark:border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Captain (C)</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{data.captainPick.club}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            {data.captainPick.imageUrl ? (
              <img src={data.captainPick.imageUrl} alt={data.captainPick.name} className="w-10 h-10 rounded-full object-cover border border-purple-200 dark:border-purple-500/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">{data.captainPick.name.charAt(0) || "C"}</span>
              </div>
            )}
            <span className="font-outfit font-black text-lg text-slate-900 dark:text-white leading-tight">{data.captainPick.name || "TBD"}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{data.captainPick.reason || "Waiting for the press conferences..."}</p>
        </div>

        {/* Differential Pick */}
        <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Differential</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{data.differentialPick.club}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            {data.differentialPick.imageUrl ? (
              <img src={data.differentialPick.imageUrl} alt={data.differentialPick.name} className="w-10 h-10 rounded-full object-cover border border-emerald-200 dark:border-emerald-500/30" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{data.differentialPick.name.charAt(0) || "D"}</span>
              </div>
            )}
            <span className="font-outfit font-black text-lg text-slate-900 dark:text-white leading-tight">{data.differentialPick.name || "TBD"}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{data.differentialPick.reason || "Searching for the perfect <5% owned gem..."}</p>
        </div>
      </div>
    </div>
  );
}
