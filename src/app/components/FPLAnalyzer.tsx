import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Percent, Star, Loader2, RefreshCw } from "lucide-react";

interface FPLPlayer {
    id: number;
    name: string;
    web_name: string;
    team: string;
    position: string;
    cost: string;
    points: number;
    selected_by_percent: number;
    form: number;
    value: number;
    minutes: number;
    goals: number;
    assists: number;
    clean_sheets: number;
}

interface FPLData {
    topPerformers: FPLPlayer[];
    bestValue: FPLPlayer[];
    differentials: FPLPlayer[];
}

type TabType = 'top' | 'value' | 'diff';

export function FPLAnalyzer() {
    const [data, setData] = useState<FPLData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>('top');

    const fetchFPLData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/fpl");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                setError("Could not load FPL data");
            }
        } catch {
            setError("Failed to fetch FPL data");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchFPLData();
    }, [fetchFPLData]);

    const renderTabButton = (tab: TabType, label: string, Icon: any) => {
        const isActive = activeTab === tab;
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-center gap-1.5 flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors ${isActive
                        ? "bg-[#8B5CF6] text-white shadow-sm"
                        : "text-[#64748B] hover:bg-gray-100 dark:text-[#94A3B8] dark:hover:bg-[#1E293B]"
                    }`}
            >
                <Icon className="w-3.5 h-3.5" />
                {label}
            </button>
        );
    };

    const posColor = (pos: string) => {
        switch (pos) {
            case "GKP": return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
            case "DEF": return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30";
            case "MID": return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
            case "FWD": return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    return (
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#8B5CF6]/10 to-transparent">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-xl">🦁</span> FPL Analyzer
                    </h3>
                    <button onClick={fetchFPLData} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 text-[#94A3B8] ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Live data from official Fantasy Premier League</p>
            </div>

            {/* Tabs */}
            <div className="p-3 bg-gray-50/50 dark:bg-[#0B1120]/50 border-b border-gray-100 dark:border-gray-800">
                <div className="flex gap-1.5 p-1 bg-gray-200/50 dark:bg-[#1E293B] rounded-xl">
                    {renderTabButton('top', 'Top Pts', Star)}
                    {renderTabButton('value', 'Best Value', TrendingUp)}
                    {renderTabButton('diff', 'Differentials', Percent)}
                </div>
            </div>

            {/* Content list */}
            <div className="max-h-[460px] overflow-y-auto">
                {loading && !data ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-[#8B5CF6] mb-3" />
                        <span className="text-xs font-medium text-[#64748B]">Analyzing FPL Data...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 px-4">
                        <p className="text-sm text-[#ef4444] font-medium">{error}</p>
                    </div>
                ) : data ? (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {(activeTab === 'top' ? data.topPerformers : activeTab === 'value' ? data.bestValue : data.differentials).map((item, idx) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors flex items-center gap-3">
                                {/* Rank */}
                                <div className="w-5 text-center flex-shrink-0">
                                    <span className="text-xs font-bold text-[#94A3B8]">{idx + 1}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[13px] font-bold text-[#0F172A] dark:text-white truncate">
                                        {item.web_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${posColor(item.position)}`}>
                                            {item.position}
                                        </span>
                                        <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                                            {item.team}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats Right side */}
                                <div className="text-right flex-shrink-0 flex flex-col items-end justify-center">
                                    {activeTab === 'top' && (
                                        <>
                                            <span className="text-sm font-black text-[#8B5CF6]">{item.points} <span className="text-[9px] font-bold text-[#94A3B8]">pts</span></span>
                                            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">£{item.cost}m</span>
                                        </>
                                    )}
                                    {activeTab === 'value' && (
                                        <>
                                            <span className="text-sm font-black text-[#10B981]">{item.value.toFixed(1)} <span className="text-[9px] font-bold text-[#94A3B8]">pts/£</span></span>
                                            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">£{item.cost}m • {item.points} pts</span>
                                        </>
                                    )}
                                    {activeTab === 'diff' && (
                                        <>
                                            <span className="text-sm font-black text-[#F59E0B]">{item.selected_by_percent}% <span className="text-[9px] font-bold text-[#94A3B8]">owned</span></span>
                                            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">Form: {item.form} • £{item.cost}m</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
            {/* Footer */}
            <div className="bg-gray-50/80 dark:bg-[#0B1120]/80 p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-[10px] text-[#94A3B8]">Prices and ownership update daily</p>
            </div>
        </div>
    );
}
