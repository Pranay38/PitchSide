"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import type { TransferWatchEntry } from "../lib/transferWatch";
import { formatTransferWatchAmount, getTransferTierLabel } from "../lib/transferWatch";
import { getClubByName } from "../data/clubs";

interface TransferTickerProps {
    entries: TransferWatchEntry[];
}

export function TransferTicker({ entries }: TransferTickerProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !entries || entries.length === 0) return null;
    // Duplicate items to ensure smooth infinite scrolling
    const scrollItems = [...entries, ...entries, ...entries, ...entries];

    const getTierColors = (tier: number | null) => {
        switch (tier) {
            case 1: return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
            case 2: return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case 5: return "text-amber-400 bg-amber-400/10 border-amber-400/20";
            default: return "text-rose-400 bg-rose-400/10 border-rose-400/20";
        }
    };

    return (
        <div className="w-full bg-[#0B1120] border-y border-white/5 text-white overflow-hidden flex items-center h-12 shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative font-sans select-none z-10 backdrop-blur-md">
            
            {/* Live Indicator / Label (Glassmorphic) */}
            <div className="h-full flex items-center justify-center px-5 font-black tracking-widest text-[11px] uppercase z-20 shrink-0 shadow-[8px_0_16px_rgba(11,17,32,0.9)] bg-gradient-to-r from-[#0B1120] to-[#0B1120]/90 border-r border-white/5">
                <span className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Live Transfers
                    </span>
                </span>
            </div>

            {/* Scrolling Ticker Area */}
            <div className="flex-1 relative overflow-hidden h-full">
                {/* Fade transparent overlays */}
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0B1120] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0B1120] to-transparent z-10 pointer-events-none" />

                <div className="flex items-center h-full animate-marquee whitespace-nowrap will-change-transform pt-0.5">
                    {scrollItems.map((item, i) => {
                        const fromClubInfo = item.fromClub ? getClubByName(item.fromClub) : null;
                        const toClubInfo = getClubByName(item.club);

                        return (
                        <div key={`${item.id}-${i}`} className="flex items-center shrink-0 px-6 group border-r border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors duration-300 h-full">
                            
                            {item.status === "confirmed" ? (
                                /* Confirmed Transfer Style */
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center px-2 py-0.5 rounded border border-[#38BDF8]/30 bg-[#38BDF8]/10 text-[#38BDF8] text-[9px] font-black uppercase tracking-wider">
                                        CONFIRMED
                                    </span>
                                    
                                    {item.playerImageUrl && (
                                        <img src={item.playerImageUrl} alt={item.player} className="w-5 h-5 rounded-full object-cover border border-white/20 ml-1 bg-[#0F172A]" />
                                    )}
                                    <span className="text-white font-bold text-[13px] tracking-tight">{item.player}</span>
                                    
                                    <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                                        {item.fromClub && (
                                            <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                                                {fromClubInfo?.logo && <img src={fromClubInfo.logo} alt={item.fromClub} className="w-4 h-4 object-contain" />}
                                                {item.fromClub}
                                            </span>
                                        )}
                                        <Activity className="w-3.5 h-3.5 text-gray-600" />
                                        <span className="flex items-center gap-1.5 text-gray-200">
                                            {toClubInfo?.logo && <img src={toClubInfo.logo} alt={item.club} className="w-4 h-4 object-contain" />}
                                            {item.club}
                                        </span>
                                    </div>
                                    
                                    <span className="text-[#FBBF24] text-[11px] font-black tracking-wide ml-1">
                                        {(item.feeMillions === 0 && item.feeMode !== 'free' && item.feeMode !== 'not-disclosed') ? "Not disclosed" : formatTransferWatchAmount(item)}
                                    </span>

                                    {item.punchyLine && (
                                        <span className="text-gray-500 text-[11px] italic ml-2 border-l border-white/10 pl-3">
                                            {item.punchyLine}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                /* Rumor Style */
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 flex items-center gap-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider shadow-sm ${getTierColors(item.tier)}`}>
                                        <span className="opacity-70 font-semibold">RUMOUR</span> 
                                        <span className="w-[1px] h-2.5 bg-current opacity-30"></span>
                                        {getTransferTierLabel(item.tier)}
                                    </span>
                                    
                                    {item.playerImageUrl && (
                                        <img src={item.playerImageUrl} alt={item.player} className="w-5 h-5 rounded-full object-cover border border-white/20 ml-1 bg-[#0F172A]" />
                                    )}
                                    <span className="text-white font-bold text-[13px] tracking-tight">{item.player}</span>
                                    
                                    <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
                                        {item.fromClub && (
                                            <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                                                {fromClubInfo?.logo && <img src={fromClubInfo.logo} alt={item.fromClub} className="w-4 h-4 object-contain" />}
                                                {item.fromClub}
                                            </span>
                                        )}
                                        <span className="text-gray-600 transition-colors group-hover:text-white/40">➔</span>
                                        <span className="flex items-center gap-1.5 text-gray-300">
                                            {toClubInfo?.logo && <img src={toClubInfo.logo} alt={item.club} className="w-4 h-4 object-contain" />}
                                            {item.club}
                                        </span>
                                    </div>

                                    <span className="text-gray-400 text-[11px] font-semibold ml-1 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                        {(item.feeMillions === 0 && item.feeMode !== 'free' && item.feeMode !== 'not-disclosed') ? "Not disclosed" : formatTransferWatchAmount(item)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-marquee {
                    /* Speed adjusted to give time to read the premium layout */
                    animation: marquee 60s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); } 
                }
            ` }} />
        </div>
    );
}
