"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { importHtmlFile } from "../../lib/htmlImport";

export function HtmlUpload({ content, onImport }: { content: string; onImport: (html: string) => void }) {
    const input = useRef<HTMLInputElement>(null);
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
                        const html = await importHtmlFile(file);
                        if (content.replace(/<[^>]*>/g, "").trim() || /<(img|table|div|iframe|hr)\b/i.test(content)) {
                            if (!window.confirm("Replace the current article body with this HTML file?")) return;
                        }
                        onImport(html);
                        toast.success("HTML imported. You can now edit the text below.");
                    } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "Unable to read this HTML file. Please try again.");
                    } finally { setBusy(false); }
                }} />
            <button type="button" disabled={busy} onClick={() => input.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                <Upload className="h-3.5 w-3.5" /> {busy ? "Importing…" : "Upload HTML"}
            </button>
            <p className="mt-2 text-xs text-[#64748B] dark:text-gray-400">Import a .html or .htm file (up to 5 MB), then edit its text below. Uses article formatting; page styles and scripts are removed. Images need full web URLs or embedded data.</p>
            {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
