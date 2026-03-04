import { Flame, TrendingUp } from "lucide-react";

export interface ManagerPressure {
    name: string;
    pressureScore: number;
}

interface ManagerPressureWidgetProps {
    data: ManagerPressure[];
}

export function ManagerPressureWidget({ data }: ManagerPressureWidgetProps) {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-5 text-white shadow-xl border border-white/5 relative overflow-hidden group">
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-colors duration-500" />

            <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                <h3 className="text-base uppercase tracking-wider font-black font-outfit">The Hot Seat</h3>
            </div>

            <p className="text-xs text-gray-400 mb-5 border-b border-white/10 pb-3">
                Media pressure index tracking the managers most likely to face the sack based on recent news sentiment.
            </p>

            <div className="flex flex-col gap-4 relative z-10">
                {data.map((manager, index) => (
                    <div key={manager.name} className="flex items-center gap-3">
                        <div className="w-6 text-center text-sm font-bold text-red-400">
                            #{index + 1}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-semibold truncate pr-2">{manager.name}</span>
                                <span className="text-xs font-mono text-red-300">{manager.pressureScore}%</span>
                            </div>

                            {/* Pressure Bar */}
                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full"
                                    style={{ width: `${manager.pressureScore}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Trending Up</span>
                <span>Updated Daily</span>
            </div>
        </div>
    );
}
