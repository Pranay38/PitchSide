import { Activity } from "lucide-react";
import { useEffect } from "react";

export function MatchweekHub() {
    // Inject the external script manually since this is a Vite SPA
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://widgets.scoreaxis.com/api/football/live-match/6852aee51f076d68cf080792?widgetId=7l48mmacrsk3&lang=en&lineupsBlock=1&eventsBlock=1&statsBlock=1&links=1&font=heebo&fontSize=14&rowDensity=100&widgetWidth=auto&widgetHeight=auto&bodyColor=%230f172a&textColor=%23e2e8f0&linkColor=%2334d399&borderColor=%231e293b&tabColor=%23020617";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Document cleanup if widget is unmounted
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div className="w-full bg-slate-950 border-y border-slate-800/80 shadow-inner overflow-hidden">
            <div className="max-w-[1280px] mx-auto">
                {/* Header Ribbon */}
                <div className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-slate-900/50 border-b border-slate-800">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-sm font-black text-slate-200 uppercase tracking-widest">
                        Matchweek Focus: Live Scores
                    </h2>
                    <span className="relative flex h-2.5 w-2.5 ml-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                </div>

                {/* ScoreAxis Embed Container */}
                <div className="w-full min-h-[120px] sm:min-h-[150px] relative overflow-hidden bg-slate-900/20 px-4 py-4 sm:px-6">
                    <div
                        id="widget-7l48mmacrsk3"
                        className="scoreaxis-widget"
                        style={{
                            width: "auto",
                            height: "auto",
                            fontSize: "14px",
                            backgroundColor: "#0f172a",
                            color: "#e2e8f0",
                            border: "1px solid",
                            borderColor: "#1e293b",
                            overflow: "auto"
                        }}
                    >
                        {/* The script will inject the iframe here */}
                        <div
                            className="widget-main-link"
                            style={{ padding: "6px 12px", fontWeight: 500 }}
                        >
                            Live data by <a href="https://www.scoreaxis.com/" style={{ color: "inherit" }}>Scoreaxis</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
