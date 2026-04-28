import { FileText, CheckCircle2, MessageSquare } from "lucide-react";
import { calculateReadTime, getAllPosts } from "../../lib/postStorage";
import { SpellcheckBar } from "../admin/SpellcheckBar";
import { RichTextEditor } from "../RichTextEditor";

interface EditorCanvasProps {
    content: string;
    setContent: React.Dispatch<React.SetStateAction<string>>;
    errors: Record<string, string>;
    handleCopyAsThread: () => void;
    copiedThread: boolean;
}

export function EditorCanvas({
    content,
    setContent,
    errors,
    handleCopyAsThread,
    copiedThread,
}: EditorCanvasProps) {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
            <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                    <FileText className="w-4 h-4 text-[#16A34A]" />
                    Content
                </label>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleCopyAsThread}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] text-xs font-semibold rounded-lg hover:opacity-80 transition-opacity"
                    >
                        {copiedThread ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Copied Thread
                            </>
                        ) : (
                            <>
                                <MessageSquare className="w-3.5 h-3.5" /> Copy as Thread
                            </>
                        )}
                    </button>
                    <span className="text-xs font-medium text-[#94A3B8] dark:text-gray-500">
                        {calculateReadTime(content.replace(/<[^>]*>/g, " "))}
                    </span>
                </div>
            </div>
            <p className="mb-3 text-xs leading-5 text-[#64748B] dark:text-gray-400">
                Use the{" "}
                <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A] dark:text-[#4ade80]">
                    ✦ Editorial Blocks
                </span>{" "}
                button in the toolbar above to insert timelines, stats cards, quote blocks, key takeaways, comparison tables, and tactical board embeds — they render in both preview and published articles.
            </p>
            {errors.content && (
                <p className="text-red-500 text-xs mb-2">{errors.content}</p>
            )}
            <SpellcheckBar
                content={content}
                onFix={(found, replacement) => {
                    // Replace all occurrences (case-sensitive)
                    const re = new RegExp(
                        found.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                        "g"
                    );
                    setContent((prev) => prev.replace(re, replacement));
                }}
            />
            <RichTextEditor
                content={content}
                onChange={setContent}
                existingPosts={getAllPosts()}
            />
        </div>
    );
}
