import { Share2, Check, Twitter, Link as LinkIcon, AlertTriangle } from "lucide-react";
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
        <div className="urgency-panel p-6 relative overflow-visible group font-sans">
            {/* Header section */}
            <div className="flex items-start justify-between mb-8 border-b-4 border-[#222] pb-4">
                <div>
                    <div className="urgency-badge mb-2">
                        <AlertTriangle className="w-4 h-4 outline-none" strokeWidth={3} />
                        <span>Critical Alert</span>
                    </div>
                    <h3 className="text-4xl mt-2 uppercase tracking-tighter font-black font-outfit text-white leading-none">
                        Pressure<br />Gauge
                    </h3>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShareOpen(!shareOpen)}
                        className="bg-transparent border-2 border-[#555] text-white p-2 hover:bg-white hover:text-black transition-colors"
                        aria-label="Share Gauge"
                    >
                        {shared ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    </button>

                    {shareOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border-[3px] border-black p-1 z-[100] shadow-[4px_4px_0_0_#000]">
                            <button onClick={shareToX} className="w-full text-left px-3 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-[#39FF14] transition-colors border-b-2 border-black flex items-center justify-between">
                                Share on X <Twitter className="w-3 h-3" />
                            </button>
                            <button onClick={copyLink} className="w-full text-left px-3 py-2 text-xs font-black uppercase tracking-wider text-black hover:bg-[#39FF14] transition-colors flex items-center justify-between">
                                Copy Link <LinkIcon className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-5 relative z-10">
                {data.map((manager, index) => {
                    const isCritical = manager.pressureScore >= 80;
                    const barColor = isCritical ? "var(--urgency-primary)" : "var(--urgency-accent)";
                    return (
                        <div key={manager.name} className="flex flex-col gap-2">
                            <div className="flex justify-between items-end border-b-2 border-dashed border-[#333] pb-1">
                                <span className="text-white text-lg font-black uppercase tracking-wide">
                                    <span className="text-[#555] mr-2">0{index + 1}</span> {manager.name}
                                </span>
                                <span className={`text-2xl font-black font-mono leading-none ${isCritical ? 'text-[var(--urgency-primary)]' : 'text-[var(--urgency-accent)]'}`}>
                                    {manager.pressureScore}%
                                </span>
                            </div>

                            {/* Blocky Brutalist Bar */}
                            <div className="w-full h-4 bg-[#111] overflow-hidden border border-[#333]">
                                <div
                                    className="h-full animate-thermometer-fill"
                                    style={{
                                        width: `${manager.pressureScore}%`,
                                        backgroundColor: barColor,
                                        boxShadow: `inset -4px 0 0 0 rgba(0,0,0,0.3)`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 bg-white text-black text-center py-2 font-black uppercase text-[10px] tracking-[0.3em]">
                Live Analytics ⚡ Touchline Dribble
            </div>
        </div>
    );
}
