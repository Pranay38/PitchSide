"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRightLeft } from "lucide-react";

interface TickerItem {
    type: "transfer" | "rumor";
    player?: string;
    move?: string;
    fee?: string;
    performance?: string;
    window?: string;
    text?: string;
    link?: string;
    tm_url?: string;
}

export function TransferTicker() {
    const [items, setItems] = useState<TickerItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTicker = useCallback(async () => {
        try {
            const res = await fetch(`/api/transfers?t=${Date.now()}`);
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setItems(data);
            }
        } catch {
            // Keep previous items on transient fetch errors.
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTicker();
        const interval = setInterval(fetchTicker, 3 * 60 * 1000); // Refresh every 3 minutes
        return () => clearInterval(interval);
    }, [fetchTicker]);

    if (loading || items.length === 0) return null;

    // Duplicate items to create infinite scroll effect
    const scrollItems = [...items, ...items, ...items];

    return (
        <div className="w-full bg-[#0F172A] border-y border-gray-800 text-white overflow-hidden flex items-center h-10 select-none">
            {/* Left Badge */}
            <div className="bg-accent-theme h-full flex items-center justify-center px-4 font-black tracking-widest text-[11px] uppercase z-10 shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
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
                        <div key={i} className="flex items-center shrink-0 pr-8 group">
                            {item.type === "transfer" ? (
                                <>
                                    {item.tm_url ? (
                                        <a href={item.tm_url} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:text-white transition-colors font-bold text-xs underline decoration-transparent hover:decoration-[#38BDF8] underline-offset-4">
                                            {item.player}
                                        </a>
                                    ) : (
                                        <span className="text-[#38BDF8] font-bold text-xs">{item.player}</span>
                                    )}
                                    <span className="mx-2 text-gray-500 text-[10px]">|</span>
                                    <span className="text-gray-300 text-xs font-medium">{item.move}</span>
                                    <span className="mx-2 text-gray-500 text-[10px]">|</span>
                                    <span className="text-[#FBBF24] text-[11px] font-bold bg-[#FBBF24]/10 px-1.5 py-0.5 rounded">{item.fee}</span>
                                    <span className="mx-2 text-gray-600 text-xs">•</span>
                                    <span className="text-gray-400 text-[11px] italic transition-colors group-hover:text-white">{item.performance}</span>
                                </>
                            ) : (
                                <a href={item.link} target="_blank" rel="noreferrer" className="flex items-center">
                                    <span className="text-rose-500 font-black text-[10px] tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded mr-2 uppercase">Rumor</span>
                                    <span className="text-gray-300 text-xs hover:text-white hover:underline transition-colors">{item.text}</span>
                                </a>
                            )}
                            <span className="ml-8 text-accent-theme/50">♦</span>
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
