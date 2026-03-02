import { useState } from "react";
import { Trophy } from "lucide-react";

const API_KEY = "7bbf2fad2c61ebe166e1633b964fcae3";
const WIDGET_SCRIPT = "https://widgets.api-sports.io/3.1.0/widgets.js";

const COMPETITIONS = [
    { code: "39", name: "Premier League" },
    { code: "2", name: "Champions League" },
    { code: "140", name: "La Liga" },
    { code: "78", name: "Bundesliga" },
    { code: "135", name: "Serie A" },
];

type Tab = "games" | "standings";

export function FixturesWidget() {
    const [activeComp, setActiveComp] = useState("39");
    const [tab, setTab] = useState<Tab>("games");
    const [widgetKey, setWidgetKey] = useState(0);

    const switchComp = (code: string) => {
        setActiveComp(code);
        setWidgetKey(k => k + 1); // force re-render
    };

    const switchTab = (t: Tab) => {
        setTab(t);
        setWidgetKey(k => k + 1);
    };

    const isCL = activeComp === "2";

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
                        onClick={() => switchTab("games")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${tab === "games" ? "bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white shadow-sm" : "text-[#64748B] dark:text-gray-400"}`}
                    >
                        Fixtures
                    </button>
                    <button
                        onClick={() => switchTab("standings")}
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
                        onClick={() => switchComp(c.code)}
                        className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${activeComp === c.code ? "bg-[#16A34A] text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Widget Container */}
            <div key={widgetKey} className="min-h-[300px]">
                {tab === "games" ? (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: `
                                <api-sports-widget
                                    data-type="games"
                                    data-league="${activeComp}"
                                    data-season="2024"
                                    data-show-toolbar="true"
                                    data-show-errors="false"
                                    data-show-logos="true"
                                    data-modal-game="true"
                                    data-modal-standings="true"
                                    data-modal-team="true"
                                    data-modal-player="true"
                                    data-theme="grey"
                                    data-color="#16A34A"
                                ></api-sports-widget>
                                <api-sports-widget
                                    data-type="config"
                                    data-key="${API_KEY}"
                                    data-sport="football"
                                    data-refresh="60"
                                    data-show-logos="true"
                                    data-favorite="true"
                                ></api-sports-widget>
                                <script type="module" src="${WIDGET_SCRIPT}"></script>
                            `,
                        }}
                    />
                ) : (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: `
                                <api-sports-widget
                                    data-type="standings"
                                    data-league="${activeComp}"
                                    data-season="2024"
                                    data-show-toolbar="true"
                                    data-show-errors="false"
                                    data-show-logos="true"
                                    data-modal-game="true"
                                    data-modal-team="true"
                                    data-modal-player="true"
                                    data-theme="grey"
                                    data-color="#16A34A"
                                ></api-sports-widget>
                                <api-sports-widget
                                    data-type="config"
                                    data-key="${API_KEY}"
                                    data-sport="football"
                                    data-refresh="300"
                                    data-show-logos="true"
                                ></api-sports-widget>
                                <script type="module" src="${WIDGET_SCRIPT}"></script>
                            `,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
