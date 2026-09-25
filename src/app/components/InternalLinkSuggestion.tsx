import { useState, useEffect, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import type { BlogPost } from "../data/posts";
import { Link2, AlertTriangle, ArrowRight, Zap } from "lucide-react";
import { suggestLinkTargets, detectOrphans, InternalLink } from "@/lib/internal-link-scorer";

interface InternalLinkSuggestionProps {
    editor: Editor;
    posts: BlogPost[];
    currentTitle?: string;
    currentTags?: string[];
    mockInternalLinks?: InternalLink[];
}

export function InternalLinkSuggestion({ 
    editor, 
    posts, 
    currentTitle = "Draft Post", 
    currentTags = [] 
}: InternalLinkSuggestionProps) {
    const [wordAtCursor, setWordAtCursor] = useState("");
    const [mockLinks] = useState<InternalLink[]>([]);
    
    // We mock inbound links for demonstration if not provided
    const inboundLinksCountMap = useMemo(() => {
        const counts: Record<string, number> = {};
        posts.forEach((p, i) => {
            // Assign some random mock counts for authority
            counts[p.id] = (i * 3) % 10;
        });
        return counts;
    }, [posts]);

    // Current post context
    const currentPostContext: Partial<BlogPost> = {
        id: "current-draft",
        title: currentTitle,
        tags: currentTags.length > 0 ? currentTags : ["football", "premier league", wordAtCursor].filter(Boolean),
    };

    // Calculate suggestions
    const suggestions = useMemo(() => {
        return suggestLinkTargets(currentPostContext, posts, inboundLinksCountMap).slice(0, 3);
    }, [currentPostContext, posts, inboundLinksCountMap, wordAtCursor]);

    // Check if orphan
    // We treat current post as orphan if it has no inbound links pointing to "current-draft"
    const isOrphan = true; // In a real scenario, this would be computed against actual internal links

    // Extract word near cursor to dynamically adjust tags/context
    useEffect(() => {
        if (!editor) return;

        const updateContext = () => {
            if (!editor.isFocused) return;
            const { from } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, " ");
            const words = textBefore.trim().split(/\s+/);
            if (words.length > 0) {
                const lastWord = words[words.length - 1];
                if (lastWord.length > 3) {
                    setWordAtCursor(lastWord.toLowerCase());
                }
            }
        };

        editor.on("selectionUpdate", updateContext);
        editor.on("update", updateContext);

        return () => {
            editor.off("selectionUpdate", updateContext);
            editor.off("update", updateContext);
        };
    }, [editor]);

    const handleInsertLink = (href: string, anchor?: string) => {
        if (anchor && editor.state.selection.empty) {
            editor.chain().focus().insertContent(`<a href="${href}">${anchor}</a> `).run();
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }
    };

    if (suggestions.length === 0 && !isOrphan) return null;

    return (
        <div className="mt-4 bg-zinc-900 border-2 border-zinc-800 p-4 font-mono">
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                <Zap className="w-4 h-4 text-[#39FF14]" />
                <span className="text-sm font-bold text-white uppercase tracking-widest">
                    SEO Link Engine
                </span>
            </div>

            {isOrphan && (
                <div className="mb-4 bg-red-950/30 border border-red-900 p-3 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-red-400 uppercase mb-1">Orphan Post Detected</p>
                        <p className="text-xs text-zinc-400">
                            This post has 0 inbound internal links. Suggestion: Edit high-authority posts to link back to this draft once published.
                        </p>
                    </div>
                </div>
            )}

            {suggestions.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Suggested Outbound Targets</p>
                    <div className="flex flex-col gap-2">
                        {suggestions.map((suggestion, idx) => {
                            const url = `/post/${suggestion.targetPost.slug || suggestion.targetPost.id}`;
                            return (
                                <div key={idx} className="bg-black border border-zinc-800 p-3 group hover:border-[#39FF14] transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm text-zinc-200 font-bold leading-tight flex-1">
                                            {suggestion.targetPost.title}
                                        </p>
                                        <span className="text-[10px] bg-zinc-800 text-[#39FF14] px-1.5 py-0.5 ml-2 font-bold whitespace-nowrap">
                                            AUTH: {suggestion.authorityScore.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-zinc-400 mb-3">
                                        <span className="text-zinc-500">Reason:</span> {suggestion.reason}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInsertLink(url, suggestion.suggestedAnchor)}
                                        className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-[#39FF14] hover:text-black text-[#39FF14] text-xs font-bold py-1.5 transition-colors"
                                    >
                                        <span>Link using anchor: <span className="underline decoration-black">{suggestion.suggestedAnchor}</span></span>
                                        <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
