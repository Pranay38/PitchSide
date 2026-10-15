"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { importHtmlFile, MAX_HTML_IMPORT_MB } from "../../lib/htmlImport";

export function HtmlUpload({ onImport }: { onImport: (html: string) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    return (
        <div>
            <input ref={input} type="file" accept=".html,.htm,text/html" className="hidden" aria-label="Upload HTML section"
                disabled={busy}
                onChange={async event => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setBusy(true);
                    setError("");
                    try {
                        const html = await importHtmlFile(file, "preserve");
                        onImport(html);
                        toast.success("HTML section inserted. Your article text is unchanged.");
                    } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "Unable to read this HTML file. Please try again.");
                    } finally { setBusy(false); }
                }} />
            <button type="button" disabled={busy} onClick={() => input.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                <Upload className="h-3.5 w-3.5" /> {busy ? "Importing…" : "Upload HTML section"}
            </button>
            <p className="mt-2 text-xs text-[#64748B] dark:text-gray-400">Click where the graphic belongs in your article, then upload its .html file (up to {MAX_HTML_IMPORT_MB} MB). It becomes a separate section with working styles and interactive stats. Upload only the graphic, not the whole article. Images must be embedded or use web URLs.</p>
            {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
