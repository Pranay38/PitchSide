import { Activity } from "lucide-react";

export function MatchweekHub() {
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
                {/* Min-height ensures the layout doesn't jump while the iframe loads */}
                <div className="w-full min-h-[120px] sm:min-h-[150px] relative overflow-hidden bg-slate-900/20 px-4 py-2 sm:px-6">

                    {/* USER: Paste your ScoreAxis iframe or Script embed code here */}
                    {/* Example standard iframe implementation: 
          <iframe 
            src="YOUR_SCOREAXIS_WIDGET_URL" 
            width="100%" 
            height="100%" 
            style={{ border: "none", minHeight: "120px", display: "block" }}
            title="ScoreAxis Live Match Widget"
            loading="lazy"
          />
          */}

                    {/* Example next/script approach if ScoreAxis provides a JS snippet:
          import Script from 'next/script';
          ...
          <div id="scoreaxis-widget-container"></div>
          <Script 
            src="https://www.scoreaxis.com/widget/js/some-script.js" 
            strategy="lazyOnload" 
          />
          */}

                    <div className="flex items-center justify-center h-full min-h-[120px] border border-dashed border-slate-700/50 rounded-lg text-slate-500 text-sm font-mono">
                        &#x3C;!-- ScoreAxis Widget Placehoder --&#x3E;
                    </div>

                </div>
            </div>
        </div>
    );
}
