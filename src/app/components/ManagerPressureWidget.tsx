import { Share2, Check, Twitter, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface ManagerPressure {
    name: string;
    pressureScore: number;
    recentResults?: Array<{
        opponent: string;
        result: string;
        score: string;
    }>;
}

interface ManagerPressureWidgetProps {
    data: ManagerPressure[];
}

export function ManagerPressureWidget({ data }: ManagerPressureWidgetProps) {
    const [shared, setShared] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [origin, setOrigin] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);

    // SSR-safe: read window.location.origin only on client
    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShareOpen(false);
            }
        }
        if (shareOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [shareOpen]);

    if (!data || data.length === 0) return null;

    const top3 = data.slice(0, 3).map((m, i) => `${i + 1}️⃣ ${m.name} - ${m.pressureScore}%`).join("\n");
    const shareText = `🧨 Manager Pressure Index 🧨\n${top3}\n\nLive tracking at ${origin}`;

    const shareToX = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        setShareOpen(false);
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setShared(true);
            setTimeout(() => setShared(false), 2000);
        } catch (error) {
            console.error("Error copy link:", error);
        }
        setShareOpen(false);
    };

    return (
        <div className="bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 md:p-8 font-sans w-full max-w-xl mx-auto relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#16A34A]/5 transition-all duration-300">
            {/* Decorative background element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#16A34A]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header section */}
            <section className="relative mb-8 border-b border-gray-100 dark:border-gray-800/60 pb-6 flex justify-between items-start z-10">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Tactical Intelligence
                    </p>
                    <h2 className="font-outfit text-3xl md:text-4xl font-black text-[#0F172A] dark:text-white tracking-tight">The Hot Seat</h2>
                </div>
                
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShareOpen(!shareOpen)}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800/50 text-[#64748B] hover:text-[#16A34A] hover:bg-[#16A34A]/10 transition-colors"
                        aria-label="Share Gauge"
                    >
                        {shared ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    {shareOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-700 rounded-xl p-1.5 z-[100] shadow-lg">
                            <button onClick={shareToX} className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-[#1DA1F2] rounded-lg transition-colors flex items-center justify-between">
                                Share on X <Twitter className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={copyLink} className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80 rounded-lg transition-colors flex items-center justify-between">
                                Copy Link <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <div className="space-y-8 relative z-10">
                {data.map((manager, index) => {
                    const isCritical = manager.pressureScore >= 80;
                    
                    return (
                        <article key={manager.name} className="relative group">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <h3 className="font-outfit font-bold text-xl text-[#0F172A] dark:text-white tracking-tight">{manager.name}</h3>
                                </div>
                                <div className="text-right flex items-baseline gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCritical ? 'text-red-500' : 'text-[#16A34A]'}`}>
                                        {isCritical ? 'Critical' : 'Elevated'}
                                    </span>
                                    <span className={`font-outfit text-3xl font-black tabular-nums leading-none ${isCritical ? 'text-red-500' : 'text-[#0F172A] dark:text-white'}`}>{manager.pressureScore}%</span>
                                </div>
                            </div>
                            
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isCritical ? 'bg-red-500' : 'bg-gradient-to-r from-[#16A34A] to-[#4ade80]'}`} 
                                    style={{ width: `${manager.pressureScore}%` }} 
                                />
                            </div>

                            {manager.recentResults && manager.recentResults.length > 0 && (
                                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 dark:border-gray-800/60 pt-3">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-black">FORM:</span>
                                    <div className="flex gap-2 font-mono text-[11px] font-bold">
                                        {manager.recentResults.map((match, idx) => (
                                            <span 
                                                key={idx} 
                                                title={`${match.opponent} ${match.score}`}
                                                className={`px-1.5 py-0.5 rounded ${
                                                    match.result === 'W' 
                                                        ? 'bg-[#16A34A]/10 text-[#16A34A]' 
                                                        : match.result === 'D' 
                                                            ? 'bg-yellow-500/10 text-yellow-600' 
                                                            : 'bg-red-500/10 text-red-500'
                                                }`}
                                            >
                                                {match.result}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {isCritical ? (
                                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 md:p-4">
                                    <p className="text-xs font-bold text-red-600 dark:text-red-400">Pressure peak reached. Action imminent.</p>
                                </div>
                            ) : (
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Results under scrutiny. Upcoming fixtures pivotal.
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
            
            <section className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800/60 relative z-10">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">Who is next to go?</p>
                    <div className="flex items-center gap-3">
                        <button className="text-xs font-bold text-[#64748B] hover:text-[#16A34A] transition-colors">
                            Full Dataset
                        </button>
                        <button className="bg-[#16A34A] text-white text-xs font-bold py-2.5 px-5 rounded-full hover:bg-[#15803d] transition-colors shadow-sm shadow-[#16A34A]/20">
                            Vote Now
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
