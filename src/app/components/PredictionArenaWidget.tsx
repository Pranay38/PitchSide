"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@/lib/router-compat";
import { Zap, ChevronRight, Swords, Loader2, Check } from "lucide-react";
import { getDeviceId } from "../lib/deviceId";
import { VotingGatewayModal } from "./VotingGatewayModal";

interface TeamInfo {
  name: string;
  short: string;
  bgClass: string;
  textClass: string;
  logoUrl?: string;
}

interface PredictionArenaWidgetProps {
  matchId?: string;
  title?: string;
  subtitle?: string;
  date?: string;
  teamA?: TeamInfo;
  teamB?: TeamInfo;
  options?: string[];
}

export function PredictionArenaWidget({
  matchId = "default-match",
  title = "Weekend Blockbuster",
  subtitle = "Champions League QF",
  date = "Today, 20:00 GMT",
  teamA = { name: "Arsenal", short: "A", bgClass: "bg-red-600", textClass: "text-white", logoUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" },
  teamB = { name: "Atlético", short: "AM", bgClass: "bg-blue-900", textClass: "text-white", logoUrl: "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg" },
  options = ["Arsenal", "Draw", "Atlético"],
}: PredictionArenaWidgetProps) {
  const [predicted, setPredicted] = useState<string | null>(null);
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gateway State
  const [showGateway, setShowGateway] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<string | null>(null);

  // Fetch existing prediction on mount
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const deviceId = getDeviceId();
        const res = await fetch(
          `/api/predictions?matchId=${encodeURIComponent(matchId)}&deviceId=${encodeURIComponent(deviceId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.userPrediction) setPredicted(data.userPrediction);
          if (data.percentages) setPercentages(data.percentages);
          if (data.totalVotes) setTotalVotes(data.totalVotes);
        }
      } catch {
        // Silently fail
      }
    };
    fetchPrediction();
  }, [matchId]);

  const handlePredict = useCallback(async (option: string, bypassGateway = false) => {
    if (predicted || isSubmitting) return;

    if (!bypassGateway) {
        const storedEmail = localStorage.getItem("pitchside_subscriber_email");
        if (!storedEmail) {
            setPendingPrediction(option);
            setShowGateway(true);
            return;
        }
    }

    setIsSubmitting(true);
    setPredicted(option); // Optimistic

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          prediction: option,
          deviceId: getDeviceId(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.percentages) setPercentages(data.percentages);
        if (data.totalVotes) setTotalVotes(data.totalVotes);
        if (data.userPrediction) setPredicted(data.userPrediction);
      }
    } catch {
      // Keep optimistic update
    } finally {
      setIsSubmitting(false);
    }
  }, [predicted, isSubmitting, matchId]);

  // Get colors for distribution bar segments
  const barColors = [teamA.bgClass.replace("bg-", ""), "gray-400", teamB.bgClass.replace("bg-", "")];
  const colorMap: Record<string, string> = {
    [options[0]]: "bg-red-600",
    [options[1]]: "bg-gray-400",
    [options[2]]: "bg-blue-900",
  };

    return (
        <>
        <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 md:p-8 relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#16A34A]/5 transition-all duration-300">
            {/* Background elements */}
            <div className="absolute -top-12 -right-12 p-8 opacity-[0.02] dark:opacity-[0.04] pointer-events-none transform rotate-12 scale-150">
                <Swords className="w-64 h-64 text-[#16A34A]" />
            </div>

            <div className="relative z-10 text-center mb-8">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2 flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Prediction Arena
                </p>
                <h3 className="font-outfit text-2xl md:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">{title}</h3>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs font-bold text-gray-400 dark:text-gray-500">
                    <span>{subtitle}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <span>{date}</span>
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-center gap-4 md:gap-8 mb-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-lg shadow-gray-200/50 dark:shadow-black/50 border-4 border-white dark:border-[#0F172A] overflow-hidden bg-white relative group">
                        {teamA.logoUrl ? (
                            <img src={teamA.logoUrl} alt={teamA.name} className="w-full h-full object-contain p-3 md:p-4 group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <span className={`w-full h-full flex items-center justify-center font-black text-2xl ${teamA.bgClass} ${teamA.textClass}`}>{teamA.short}</span>
                        )}
                    </div>
                    <span className="font-outfit font-bold text-sm md:text-base text-[#0F172A] dark:text-white">{teamA.name}</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full">VS</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-lg shadow-gray-200/50 dark:shadow-black/50 border-4 border-white dark:border-[#0F172A] overflow-hidden bg-white relative group">
                        {teamB.logoUrl ? (
                            <img src={teamB.logoUrl} alt={teamB.name} className="w-full h-full object-contain p-3 md:p-4 group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <span className={`w-full h-full flex items-center justify-center font-black text-2xl ${teamB.bgClass} ${teamB.textClass}`}>{teamB.short}</span>
                        )}
                    </div>
                    <span className="font-outfit font-bold text-sm md:text-base text-[#0F172A] dark:text-white">{teamB.name}</span>
                </div>
            </div>

            <div className="relative z-10 max-w-md mx-auto">
                {!predicted ? (
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                        {options.map((opt, i) => (
                            <button
                                key={opt}
                                onClick={() => handlePredict(opt)}
                                disabled={isSubmitting}
                                className={`py-3 px-2 rounded-xl font-bold transition-all duration-300 text-xs md:text-sm shadow-sm disabled:opacity-50 hover:-translate-y-1 ${
                                    i === 0 ? "bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A]/20 border border-[#16A34A]/20" :
                                    i === 2 ? "bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 border border-blue-600/20" :
                                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                                }`}
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : opt}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[#16A34A] font-bold text-xs md:text-sm flex items-center gap-1.5">
                                <Check className="w-4 h-4" />
                                Prediction locked in: {predicted}
                            </p>
                            {totalVotes > 0 && (
                                <span className="text-[10px] font-bold text-gray-400 tabular-nums uppercase tracking-wider">
                                    {totalVotes} {totalVotes === 1 ? "Vote" : "Votes"}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex h-3 rounded-full overflow-hidden shadow-inner bg-gray-200 dark:bg-gray-700">
                            {options.map((opt, i) => {
                                const pct = percentages[opt] || 0;
                                if (pct === 0) return null;
                                const bgStyle = i === 0 ? "bg-[#16A34A]" : i === 2 ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-500";
                                return (
                                    <div
                                        key={opt}
                                        className={`${bgStyle} transition-all duration-1000 ease-out`}
                                        style={{ width: `${pct}%` }}
                                        title={`${opt}: ${pct}%`}
                                    />
                                );
                            })}
                        </div>
                        
                        <div className="flex justify-between text-[11px] mt-2 font-bold tabular-nums">
                            {options.map((opt, i) => {
                                const isSelected = predicted === opt;
                                const colorStyle = isSelected 
                                    ? (i === 0 ? "text-[#16A34A]" : i === 2 ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-200") 
                                    : "text-gray-400 dark:text-gray-500";
                                return (
                                    <span key={opt} className={colorStyle}>
                                        {percentages[opt] || 0}%
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link to="/debates" className="inline-flex items-center justify-center text-[11px] font-bold text-gray-400 hover:text-[#16A34A] transition-colors gap-1 uppercase tracking-widest">
                        See all predictions <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
        <VotingGatewayModal 
            isOpen={showGateway} 
            onClose={() => { setShowGateway(false); setPendingPrediction(null); }}
            onComplete={(email) => {
                setShowGateway(false);
                if (pendingPrediction) handlePredict(pendingPrediction, true);
            }}
            featureName="make your prediction"
        />
        </>
    );
}
