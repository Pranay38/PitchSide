import { History, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export interface OnThisDayEvent {
    year: string;
    event: string;
}

interface OnThisDayWidgetProps {
    data: OnThisDayEvent;
}

export function OnThisDayWidget({ data }: OnThisDayWidgetProps) {
    if (!data) return null;

    const today = new Date();

    return (
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:glow-green transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-accent-theme" />
                <h3 className="text-base uppercase tracking-wider font-black font-outfit text-[#0F172A] dark:text-white">
                    On This Day
                </h3>
            </div>

            <div className="flex items-start gap-3 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 min-w-[60px] border border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{format(today, "MMM")}</span>
                    <span className="text-xl font-black text-accent-theme leading-none my-1">{format(today, "dd")}</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{data.year}</span>
                </div>

                <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {data.event}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5 justify-end ext-[11px] text-gray-500">
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Football History</span>
            </div>
        </div>
    );
}
