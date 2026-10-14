"use client";

import { useId, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";

export function LinkControl({ editor }: { editor: Editor }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);
    const [range, setRange] = useState({ from: 0, to: 0 });

    const save = () => {
        const value = url.trim();
        const href = /^(https?:|mailto:|tel:|\/|#)/i.test(value) ? value : `https://${value}`;
        if (!value || /\s/.test(href) || (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^(https?:|mailto:|tel:)/i.test(value))) {
            setError("Enter a valid web, email, phone, or relative link.");
            return;
        }
        try { new URL(href, "https://example.com"); } catch {
            setError("Enter a valid URL, such as https://example.com.");
            return;
        }
        editor.chain().focus().setTextSelection(range).setLink({ href }).run();
        setOpen(false);
    };

    return <>
        <button type="button" title="Add or edit hyperlink" onMouseDown={event => event.preventDefault()}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-[#16A34A] hover:bg-green-50 dark:hover:bg-gray-700"
            onClick={() => {
                const active = editor.isActive("link");
                if (active) editor.commands.extendMarkRange("link");
                const { from, to } = editor.state.selection;
                if (from === to) {
                    toast.info("Select the text you want to link first, then click Link.");
                    return;
                }
                setRange({ from, to });
                setEditing(active);
                setUrl(editor.getAttributes("link").href || "");
                setError("");
                setOpen(true);
            }}><LinkIcon className="h-4 w-4" /> Link</button>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent onCloseAutoFocus={event => { event.preventDefault(); editor.commands.focus(); }}>
                <DialogTitle>{editing ? "Edit hyperlink" : "Add hyperlink"}</DialogTitle>
                <DialogDescription>Enter the URL to link the selected text. Your words will stay unchanged.</DialogDescription>
                <label htmlFor={`${id}-url`} className="text-sm">URL
                    <input id={`${id}-url`} value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com"
                        aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}
                        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); save(); } }}
                        className="mt-1 w-full rounded-md border bg-transparent p-2" />
                </label>
                {error && <p id={`${id}-error`} role="alert" className="text-sm text-red-600">{error}</p>}
                <div className="flex flex-wrap justify-end gap-3">
                    {editing && <button type="button" className="text-sm text-red-600" onClick={() => {
                        editor.chain().focus().setTextSelection(range).unsetLink().run();
                        setOpen(false);
                    }}>Remove link</button>}
                    <button type="button" className="text-sm" onClick={() => setOpen(false)}>Cancel</button>
                    <button type="button" className="rounded-md bg-[#16A34A] px-3 py-2 text-sm font-semibold text-white" onClick={save}>Save link</button>
                </div>
            </DialogContent>
        </Dialog>
    </>;
}
