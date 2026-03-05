import { Flame, TrendingUp, Share2, Check, Twitter, Instagram, Link as LinkIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface ManagerPressure {
    name: string;
    pressureScore: number;
}

interface ManagerPressureWidgetProps {
    data: ManagerPressure[];
}

export function ManagerPressureWidget({ data }: ManagerPressureWidgetProps) {
    const [shared, setShared] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
    const shareText = `🔥 Premier League Hot Seat 🔥\n${top3}\n\nCheck the full index at ${window.location.origin}`;

    const shareToX = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
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

    const nativeShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Premier League Hot Seat',
                    text: shareText,
                });
            } else {
                alert("Native sharing is not supported on this device/browser. Please use Copy Link.");
            }
        } catch (error) {
            console.error("Error sharing:", error);
        }
        setShareOpen(false);
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-5 text-white shadow-xl border border-white/5 relative overflow-hidden group">
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-colors duration-500" />

            <div className="flex items-center justify-between mb-4 relative z-50">
                <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                    <h3 className="text-base uppercase tracking-wider font-black font-outfit">The Hot Seat</h3>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShareOpen(!shareOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-colors"
                    >
                        {shared ? <Check className="w-3.5 h-3.5 text-accent-light" /> : <Share2 className="w-3.5 h-3.5 text-gray-300" />}
                        {shared ? "Copied" : "Share"}
                    </button>

                    {shareOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-[100] overflow-hidden animate-float-in origin-top-right ring-1 ring-white/10">
                            <button onClick={shareToX} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors">
                                <Twitter className="w-4 h-4 text-sky-400" />
                                Share on X
                            </button>
                            <button onClick={nativeShare} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors">
                                <Instagram className="w-4 h-4 text-pink-500" />
                                Share via... (Insta)
                            </button>
                            <button onClick={copyLink} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-white transition-colors">
                                <LinkIcon className="w-4 h-4 text-gray-400" />
                                Copy Link
                            </button>
                        </div>
                    )}
                </div>
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
