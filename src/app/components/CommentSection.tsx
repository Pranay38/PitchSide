import { useState, useMemo } from "react";
import { MessageCircle, Send, User } from "lucide-react";

interface Comment {
    id: string;
    name: string;
    text: string;
    timestamp: number;
}

function getComments(postId: string): Comment[] {
    try {
        return JSON.parse(localStorage.getItem(`pitchside_comments_${postId}`) || "[]");
    } catch {
        return [];
    }
}

function saveComment(postId: string, comment: Comment) {
    const comments = getComments(postId);
    comments.push(comment);
    localStorage.setItem(`pitchside_comments_${postId}`, JSON.stringify(comments));
}

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function CommentSection({ postId }: { postId: string }) {
    const [name, setName] = useState(() => {
        try { return localStorage.getItem("pitchside_commenter_name") || ""; } catch { return ""; }
    });
    const [text, setText] = useState("");
    const [comments, setComments] = useState<Comment[]>(() => getComments(postId));

    const sortedComments = useMemo(
        () => [...comments].sort((a, b) => b.timestamp - a.timestamp),
        [comments]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !text.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            name: name.trim(),
            text: text.trim(),
            timestamp: Date.now(),
        };

        saveComment(postId, comment);
        setComments(getComments(postId));
        setText("");
        try { localStorage.setItem("pitchside_commenter_name", name.trim()); } catch { }
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 dark:bg-[#0F172A] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                <div className="flex gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#16A34A]" />
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] placeholder-[#94A3B8] transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Share your thoughts..."
                        required
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] placeholder-[#94A3B8] resize-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!name.trim() || !text.trim()}
                        className="self-end px-4 py-2 bg-[#16A34A] text-white rounded-lg hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm font-medium"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Post
                    </button>
                </div>
            </form>

            {/* Comments List */}
            {sortedComments.length > 0 ? (
                <div className="space-y-4">
                    {sortedComments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-sm font-bold text-[#16A34A]">
                                    {comment.name[0].toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-[#0F172A] dark:text-white">{comment.name}</span>
                                    <span className="text-xs text-[#94A3B8] dark:text-gray-500">{timeAgo(comment.timestamp)}</span>
                                </div>
                                <p className="text-sm text-[#334155] dark:text-gray-300 leading-relaxed">{comment.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-[#94A3B8] dark:text-gray-500 text-center py-6">
                    No comments yet. Be the first to share your thoughts! 💬
                </p>
            )}
        </div>
    );
}
