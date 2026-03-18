import React, { useState, useRef, useCallback } from "react";
import { Copy, Check, FileText, Heading, PenLine, BookOpen, Flame, AlignLeft, Loader2 } from "lucide-react";

type DraftAction = "outline" | "headlines" | "intro" | "expand" | "hottake" | "summary";

interface ActionDef {
    key: DraftAction;
    label: string;
    icon: React.ReactNode;
    desc: string;
}

const actions: ActionDef[] = [
    { key: "outline",   label: "Outline",   icon: <FileText className="w-4 h-4" />,  desc: "Structured article skeleton" },
    { key: "headlines", label: "Headlines", icon: <Heading className="w-4 h-4" />,   desc: "6 punchy headline options" },
    { key: "intro",     label: "Intro",     icon: <PenLine className="w-4 h-4" />,   desc: "Compelling opening paragraph" },
    { key: "expand",    label: "Expand",    icon: <BookOpen className="w-4 h-4" />,  desc: "Flesh out the draft" },
    { key: "hottake",   label: "Hot Take",  icon: <Flame className="w-4 h-4" />,     desc: "Bold, provocative angle" },
    { key: "summary",   label: "Summary",   icon: <AlignLeft className="w-4 h-4" />, desc: "TL;DR bullet points" },
];

export function DraftAssistant() {
    const [text, setText]             = useState("");
    const [output, setOutput]         = useState("");
    const [activeAction, setActive]   = useState<DraftAction | null>(null);
    const [loading, setLoading]       = useState(false);
    const [copied, setCopied]         = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    const run = useCallback(async (action: DraftAction) => {
        if (!text.trim() || loading) return;
        setLoading(true);
        setActive(action);
        setOutput("");
        try {
            const res = await fetch("/api/sys?action=ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "draft-assist", action, text }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || "Generation failed");

            if (typeof body.data === "string") {
                setOutput(body.data);
            } else if (Array.isArray(body.data)) {
                // headlines → list
                setOutput(body.data.map((h: string, i: number) => `${i + 1}. ${h}`).join("\n"));
            } else if (body.data?.take) {
                // hot take → formatted
                setOutput(`🔥 ${body.data.take}\n\n${body.data.reasoning}\n\n⚖️ Counterpoint: ${body.data.counterpoint}`);
            } else {
                setOutput(JSON.stringify(body.data, null, 2));
            }
        } catch (e: any) {
            setOutput(`❌ Error: ${e.message}`);
        }
        setLoading(false);
    }, [text, loading]);

    const copyOutput = useCallback(() => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [output]);

    const insertIntoEditor = useCallback(() => {
        setText(prev => prev + "\n\n" + output);
    }, [output]);

    return (
        <div className="w-full" style={{ fontFamily: "var(--font-sans, system-ui)" }}>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                    AI Draft Assistant
                </h2>
                <p className="text-sm mt-3 text-gray-500 dark:text-gray-400">
                    Paste your draft or notes, then pick any action to get AI assistance. Powered by Gemini.
                </p>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-2 mb-6">
                {actions.map(a => (
                    <button
                        key={a.key}
                        onClick={() => run(a.key)}
                        disabled={loading || !text.trim()}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                            activeAction === a.key && loading
                                ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-500/20"
                                : activeAction === a.key
                                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10"
                        }`}
                        title={a.desc}
                    >
                        {activeAction === a.key && loading ? <Loader2 className="w-4 h-4 animate-spin" /> : a.icon}
                        {a.label}
                    </button>
                ))}
            </div>

            {/* Split pane */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left: editor */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Your Draft</span>
                        <span className="text-xs text-gray-400">{text.length.toLocaleString()} chars</span>
                    </div>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Paste your article draft, notes, or raw ideas here..."
                        disabled={loading}
                        className="w-full flex-1 min-h-[420px] bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-sm text-gray-900 dark:text-gray-100 leading-relaxed outline-none focus:border-green-500/50 resize-y transition-colors"
                        style={{ opacity: loading ? 0.6 : 1 }}
                    />
                </div>

                {/* Right: output */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-500">
                            {activeAction ? `AI → ${actions.find(a => a.key === activeAction)?.label}` : "AI Output"}
                        </span>
                        {output && (
                            <div className="flex gap-2">
                                <button
                                    onClick={insertIntoEditor}
                                    className="text-xs px-3 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    ← Insert into draft
                                </button>
                                <button
                                    onClick={copyOutput}
                                    className="text-xs px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                                >
                                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                </button>
                            </div>
                        )}
                    </div>
                    <div
                        ref={outputRef}
                        className="w-full flex-1 min-h-[420px] bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-sm text-gray-800 dark:text-gray-200 leading-relaxed overflow-auto whitespace-pre-wrap"
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                                <span className="text-sm">Generating {activeAction}...</span>
                            </div>
                        ) : output ? (
                            output
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 text-center gap-2">
                                <PenLine className="w-10 h-10 opacity-30" />
                                <p className="text-sm">Paste your draft on the left, then pick an action above.</p>
                                <p className="text-xs opacity-60">The AI output will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
