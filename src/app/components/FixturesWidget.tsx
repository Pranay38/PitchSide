import { useState, useEffect, useRef } from "react";
import { Trophy } from "lucide-react";

const API_KEY = "7bbf2fad2c61ebe166e1633b964fcae3";
const WIDGET_SCRIPT_URL = "https://widgets.api-sports.io/3.1.0/widgets.js";

const COMPETITIONS = [
    { code: "39", name: "Premier League" },
    { code: "2", name: "Champions League" },
    { code: "140", name: "La Liga" },
    { code: "78", name: "Bundesliga" },
    { code: "135", name: "Serie A" },
];

type Tab = "games" | "standings";

// Load widget script once globally
let scriptLoaded = false;
function loadWidgetScript(): Promise<void> {
    if (scriptLoaded) return Promise.resolve();
    return new Promise((resolve) => {
        // Remove any existing widget scripts first
        document.querySelectorAll('script[src*="widgets.api-sports.io"]').forEach(s => s.remove());

        const script = document.createElement("script");
        script.src = WIDGET_SCRIPT_URL;
        script.type = "module";
        script.onload = () => {
            scriptLoaded = true;
            resolve();
        };
        script.onerror = () => resolve(); // still resolve to avoid hanging
        document.body.appendChild(script);
    });
}

export function FixturesWidget() {
    const [activeComp, setActiveComp] = useState("39");
    const [tab, setTab] = useState<Tab>("games");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear container
        container.innerHTML = "";

        // Create widget element
        const widget = document.createElement("api-sports-widget" as any);
        widget.setAttribute("data-type", tab);
        widget.setAttribute("data-league", activeComp);
        widget.setAttribute("data-season", "2024");
        widget.setAttribute("data-show-toolbar", "true");
        widget.setAttribute("data-show-errors", "false");
        widget.setAttribute("data-show-logos", "true");
        widget.setAttribute("data-theme", "grey");
        widget.setAttribute("data-color", "#16A34A");

        if (tab === "games") {
            widget.setAttribute("data-modal-game", "true");
            widget.setAttribute("data-modal-standings", "true");
            widget.setAttribute("data-modal-team", "true");
            widget.setAttribute("data-modal-player", "true");
        } else {
            widget.setAttribute("data-modal-game", "true");
            widget.setAttribute("data-modal-team", "true");
            widget.setAttribute("data-modal-player", "true");
        }

        // Create config element
        const config = document.createElement("api-sports-widget" as any);
        config.setAttribute("data-type", "config");
        config.setAttribute("data-key", API_KEY);
        config.setAttribute("data-sport", "football");
        config.setAttribute("data-refresh", tab === "games" ? "60" : "300");
        config.setAttribute("data-show-logos", "true");
        config.setAttribute("data-favorite", "true");

        container.appendChild(widget);
        container.appendChild(config);

        // Load widget script
        // Reset scriptLoaded to force re-init on each render
        scriptLoaded = false;
        document.querySelectorAll('script[src*="widgets.api-sports.io"]').forEach(s => s.remove());
        loadWidgetScript();

        return () => {
            container.innerHTML = "";
        };
    }, [activeComp, tab]);

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <Trophy className="w-4.5 h-4.5 text-[#16A34A]" />
                    Scores & Fixtures
                </h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button
                        onClick={() => setTab("games")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === "games" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400"}`}
                    >
                        Fixtures
                    </button>
                    <button
                        onClick={() => setTab("standings")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === "standings" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400"}`}
                    >
                        Table
                    </button>
                </div>
            </div>

            {/* Competition Tabs */}
            <div className="flex overflow-x-auto px-3 py-2 gap-1 border-b border-gray-100 dark:border-gray-800 scrollbar-thin">
                {COMPETITIONS.map(c => (
                    <button
                        key={c.code}
                        onClick={() => setActiveComp(c.code)}
                        className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${activeComp === c.code ? "bg-[#16A34A] text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Widget Container */}
            <div ref={containerRef} className="min-h-[400px]" />
        </div>
    );
}
