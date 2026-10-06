"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { importMarkdownFiles } from "../../lib/markdownImport";

export function MarkdownUpload({ content, onImport, replacementMessage = "Replace the current article body with this Markdown file?", successMessage = "Markdown imported. Review your article before publishing." }: { content: string; onImport: (html: string) => void; replacementMessage?: string; successMessage?: string }) {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    return (
        <div>
            <input ref={input} type="file" accept=".md,.markdown,image/*" multiple className="hidden" aria-label="Upload Markdown and images"
                onChange={async event => {
                    const files = Array.from(event.target.files || []);
                    event.target.value = "";
                    if (!files.length) return;
                    setBusy(true);
                    setError("");
                    try {
                        const result = await importMarkdownFiles(files);
                        if (result.missingImages.length) {
                            throw new Error(`Select the .md file again together with these images: ${result.missingImages.join(", ")}`);
                        }
                        if (content.replace(/<[^>]*>/g, "").trim() || /<(img|table|div)\b/i.test(content)) {
                            if (!window.confirm(replacementMessage)) return;
                        }
                        onImport(result.html);
                        toast.success(successMessage);
                    } catch (cause) {
                        setError(cause instanceof Error ? cause.message : "Unable to read this file. Please try again.");
                    } finally { setBusy(false); }
                }} />
            <button type="button" disabled={busy} onClick={() => input.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                <Upload className="h-3.5 w-3.5" /> {busy ? "Importing…" : "Upload Markdown"}
            </button>
            <p className="mt-2 text-xs text-[#64748B] dark:text-gray-400">Select a .md file and any local images together. Web images load automatically.</p>
            {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
