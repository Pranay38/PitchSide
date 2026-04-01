"use client";

import { ArrowRightLeft } from "lucide-react";
import type { TransferWatchEntry } from "../lib/transferWatch";
import { formatTransferWatchAmount, getTransferTierLabel } from "../lib/transferWatch";

interface TransferTickerProps {
    entries: TransferWatchEntry[];
}

export function TransferTicker({ entries }: TransferTickerProps) {
    if (!entries || entries.length === 0) return null;

    // Duplicate items to create infinite scroll effect
    const scrollItems = [...entries, ...entries, ...entries];

    return (
        <div className="w-full bg-[#0F172A] border-y border-gray-800 text-white overflow-hidden flex items-center h-10 select-none">
            {/* Left Badge */}
            <div className="bg-[#16A34A] h-full flex items-center justify-center px-4 font-black tracking-widest text-[11px] uppercase z-10 shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                <span className="flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Transfers
                </span>
            </div>

            {/* Scrolling Ticker */}
            <div className="flex-1 relative overflow-hidden h-full">
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0F172A] to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#0F172A] to-transparent z-10 pointer-events-none" />

                <div className="flex items-center h-full animate-marquee whitespace-nowrap will-change-transform">
                    {scrollItems.map((item, i) => (
                        <div key={`${item.id}-${i}`} className="flex items-center shrink-0 pr-8 group">
                            {item.status === "confirmed" ? (
                                <>
                                    <span className="text-[#38BDF8] font-bold text-xs">{item.player}</span>
                                    <span className="mx-2 text-gray-500 text-[10px]">|</span>
                                    <span className="text-gray-300 text-xs font-medium">{item.fromClub ? `${item.fromClub} -> ` : ""}{item.club}</span>
                                    <span className="mx-2 text-gray-500 text-[10px]">|</span>
                                    <span className="text-[#FBBF24] text-[11px] font-bold bg-[#FBBF24]/10 px-1.5 py-0.5 rounded">{formatTransferWatchAmount(item)}</span>
                                    {item.punchyLine && (
                                        <>
                                           <span className="mx-2 text-gray-600 text-xs">•</span>
                                           <span className="text-gray-400 text-[11px] italic transition-colors group-hover:text-white">{item.punchyLine}</span>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center">
                                    <span className="text-rose-500 font-black text-[10px] tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded mr-2 uppercase">{getTransferTierLabel(item.tier)}</span>
                                    <span className="text-gray-300 text-xs"><span className="font-bold text-white">{item.player}</span> to {item.club}</span>
                                    {item.feeMillions > 0 && <span className="ml-2 text-[#FBBF24] text-[11px] font-bold bg-[#FBBF24]/10 px-1.5 py-0.5 rounded mr-2">{formatTransferWatchAmount(item)}</span>}
                                </div>
                            )}
                            <span className="ml-8 text-[#16A34A]/50">♦</span>
                        </div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-marquee {
                    animation: marquee 45s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
            ` }} />
        </div>
    );
}
