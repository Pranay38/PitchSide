import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Comment {
    id: string;
    name: string;
    text: string;
    timestamp: number;
}

interface CommentSectionProps {
    postId: string;
    userName?: string;
    isSignedIn?: boolean;
}

export function CommentSection({ postId, userName, isSignedIn }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [name, setName] = useState(userName || "");
    const [submitting, setSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (e) {
            console.error("Failed to fetch comments:", e);
        }
        setLoading(false);
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || submitting) return;

        const authorName = name.trim() || userName || "Anonymous";
        setSubmitting(true);

        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, name: authorName, text: text.trim() }),
            });

            if (res.ok) {
                setText("");
                fetchComments();
            }
        } catch (e) {
            console.error("Failed to post comment:", e);
        }
        setSubmitting(false);
    };

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return "just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-[#16A34A]" />
                Discussion ({comments.length})
            </h3>

            {/* Comment form */}
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="bg-gray-50 dark:bg-[#1E293B]/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    {!isSignedIn && !userName && (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="w-full bg-transparent text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400 focus:outline-none mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 font-medium"
                            maxLength={30}
                        />
                    )}
                    <div className="flex gap-3">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Share your thoughts..."
                            rows={2}
                            className="flex-1 bg-transparent text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400/70 focus:outline-none resize-none"
                            maxLength={1000}
                        />
                        <button
                            type="submit"
                            disabled={submitting || !text.trim()}
                            className="self-end px-4 py-2 bg-[#16A34A] text-white rounded-xl text-sm font-bold hover:bg-[#15803d] transition-all disabled:opacity-40 flex items-center gap-1.5"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </form>

            {/* Comments list */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">No comments yet. Be the first to share your take!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="group flex gap-3 p-4 rounded-xl bg-white dark:bg-[#1E293B]/30 border border-gray-100 dark:border-gray-800/50 hover:border-[#16A34A]/20 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#16A34A] to-[#4ade80] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {comment.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-sm font-semibold text-[#0F172A] dark:text-white">{comment.name}</span>
                                    <span className="text-[10px] text-gray-400">{formatTime(comment.timestamp)}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
