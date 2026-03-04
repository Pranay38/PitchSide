import { Flame, TrendingUp, Share2, Check } from "lucide-react";
import { useState } from "react";

export interface ManagerPressure {
    name: string;
    pressureScore: number;
}

interface ManagerPressureWidgetProps {
    data: ManagerPressure[];
}

export function ManagerPressureWidget({ data }: ManagerPressureWidgetProps) {
    const [shared, setShared] = useState(false);

    if (!data || data.length === 0) return null;

    const handleShare = async () => {
        const top3 = data.slice(0, 3).map((m, i) => `${i + 1}️⃣ ${m.name} - ${m.pressureScore}%`).join("\n");
        const shareText = `🔥 Premier League Hot Seat 🔥\n${top3}\n\nCheck the full index at ${window.location.origin}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Premier League Hot Seat',
                    text: shareText,
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-5 text-white shadow-xl border border-white/5 relative overflow-hidden group">
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-colors duration-500" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                    <h3 className="text-base uppercase tracking-wider font-black font-outfit">The Hot Seat</h3>
                </div>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-colors"
                >
                    {shared ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5 text-gray-300" />}
                    {shared ? "Copied" : "Share"}
                </button>
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
