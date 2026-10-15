"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { importHtmlFile, MAX_HTML_IMPORT_MB, type HtmlImportMode } from "../../lib/htmlImport";

export function HtmlUpload({ content, onImport }: { content: string; onImport: (html: string) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<HtmlImportMode>("preserve");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    return (
        <div>
            <input ref={input} type="file" accept=".html,.htm,text/html" className="hidden" aria-label="Upload HTML"
                disabled={busy}
                onChange={async event => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setBusy(true);
                    setError("");
                    try {
                        const html = await importHtmlFile(file, mode);
                        if (content.trim()) {
                            if (!window.confirm("Replace the current article body with this HTML file?")) return;
                        }
                        onImport(html);
                        toast.success(mode === "preserve" ? "HTML imported with its layout and graphics. Review the preview below." : "HTML imported. You can now edit the text below.");
                    } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "Unable to read this HTML file. Please try again.");
                    } finally { setBusy(false); }
                }} />
            <label className="mb-2 block text-xs text-[#64748B] dark:text-gray-400">
                HTML import mode
                <select aria-label="HTML import mode" value={mode} disabled={busy} onChange={event => setMode(event.target.value as HtmlImportMode)} className="ml-2 rounded border p-1 dark:bg-slate-800">
                    <option value="preserve">Preserve HTML layout and graphics</option>
                    <option value="editable">Convert to editable article text</option>
                </select>
            </label>
            <button type="button" disabled={busy} onClick={() => input.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                <Upload className="h-3.5 w-3.5" /> {busy ? "Importing…" : "Upload HTML"}
            </button>
            <p className="mt-2 text-xs text-[#64748B] dark:text-gray-400">Import a .html or .htm file (up to {MAX_HTML_IMPORT_MB} MB), preserving layouts, styles, SVG/canvas graphics and inline scripts in an isolated preview. Choose editable text to convert to article formatting. Local assets need full web URLs or embedded data; external widgets depend on provider permissions.</p>
            {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
