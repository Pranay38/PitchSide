import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { BlogPost } from "../data/posts";
import { Link2, X, ArrowRight } from "lucide-react";

interface InternalLinkSuggestionProps {
    editor: Editor;
    posts: BlogPost[];
}

/** Extract the word or short phrase at / near the cursor position */
function getWordAtCursor(editor: Editor): string {
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 40),
        from,
        " "
    );
    // Get the last word or two-word phrase
    const words = textBefore.trim().split(/\s+/);
    if (words.length === 0) return "";
    // Return last 1-2 words for matching
    return words.slice(-2).join(" ");
}

/** Find posts that match a given keyword */
function findMatchingPosts(keyword: string, posts: BlogPost[], currentPostId?: string): BlogPost[] {
    if (!keyword || keyword.length < 3) return [];

    const q = keyword.toLowerCase();
    return posts
        .filter((p) => p.id !== currentPostId)
        .filter((p) => {
            // Match against player name, club, title, or tags
            return (
                p.playerName?.toLowerCase().includes(q) ||
                p.club?.toLowerCase().includes(q) ||
                p.title.toLowerCase().includes(q) ||
                p.tags.some((t) => t.toLowerCase().includes(q))
            );
        })
        .slice(0, 3); // Max 3 suggestions
}

export function InternalLinkSuggestion({ editor, posts }: InternalLinkSuggestionProps) {
    const [suggestions, setSuggestions] = useState<BlogPost[]>([]);
    const [currentWord, setCurrentWord] = useState("");
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const checkForSuggestions = useCallback(() => {
        if (!editor || !editor.isFocused) {
            setSuggestions([]);
            return;
        }

        const word = getWordAtCursor(editor);
        if (word === currentWord) return;

        setCurrentWord(word);

        // Debounce the search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const matches = findMatchingPosts(word, posts);
            // Filter out dismissed ones
            const filtered = matches.filter((m) => !dismissed.has(m.id));
            setSuggestions(filtered);
        }, 300);
    }, [editor, posts, currentWord, dismissed]);

    useEffect(() => {
        if (!editor) return;

        editor.on("selectionUpdate", checkForSuggestions);
        editor.on("update", checkForSuggestions);

        return () => {
            editor.off("selectionUpdate", checkForSuggestions);
            editor.off("update", checkForSuggestions);
        };
    }, [editor, checkForSuggestions]);

    const handleInsertLink = (post: BlogPost) => {
        const url = `/post/${post.id}`;
        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        setSuggestions([]);
    };

    const handleDismiss = (postId: string) => {
        setDismissed((prev) => new Set(prev).add(postId));
        setSuggestions((prev) => prev.filter((p) => p.id !== postId));
    };

    if (suggestions.length === 0) return null;

    return (
        <div className="mt-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                    Link Suggestions
                </span>
            </div>
            <div className="flex flex-col gap-1.5">
                {suggestions.map((post) => (
                    <div
                        key={post.id}
                        className="flex items-center gap-2 group"
                    >
                        <button
                            type="button"
                            onClick={() => handleInsertLink(post)}
                            className="flex-1 flex items-center gap-2 text-left px-3 py-2 rounded-lg bg-white dark:bg-[#1E293B] hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-all text-sm group/btn"
                        >
                            <span className="font-medium text-[#0F172A] dark:text-white truncate flex-1">
                                {post.title}
                            </span>
                            <span className="text-xs text-[#94A3B8] dark:text-gray-500 flex-shrink-0">
                                {post.club}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDismiss(post.id)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-[#94A3B8] hover:text-[#64748B] transition-colors flex-shrink-0"
                            title="Dismiss"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
