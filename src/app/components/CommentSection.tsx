import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Loader2, CornerDownRight, ThumbsUp, Reply } from "lucide-react";
import { toast } from "sonner";
import { getDeviceId } from "../lib/deviceId";
import { useUser } from "@clerk/nextjs";
import { getAvatarUrl } from "../lib/avatar";

interface ClubBadge {
    name: string;
    logoUrl: string | null;
}

interface Comment {
    id: string;
    postId: string;
    parentId: string | null;
    name: string;
    text: string;
    likes: number;
    userLiked?: boolean;
    createdAt: string;
    clubBadge?: ClubBadge | null;
    userId?: string | null;
}

interface CommentSectionProps {
    postId: string;
    userName?: string;
    isSignedIn?: boolean;
}

export function CommentSection({ postId, userName, isSignedIn }: CommentSectionProps) {
    const { user } = useUser();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [text, setText] = useState("");
    const [name, setName] = useState(userName || "");
    const [submitting, setSubmitting] = useState(false);
    
    // Reply state
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    
    // Optimistic UI for likes
    const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

    // Read user's fan club from localStorage
    const [userClubBadge, setUserClubBadge] = useState<ClubBadge | null>(null);
    useEffect(() => {
        try {
            const raw = localStorage.getItem("pitchside_fan_club");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.name) setUserClubBadge(parsed);
            }
        } catch { /* ignore */ }
    }, []);

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
                
                // Initialize liked state from backend
                const backendLiked = new Set<string>();
                data.forEach((c: any) => {
                    if (c.userLiked) backendLiked.add(c.id);
                });
                setLikedComments(backendLiked);
            }
        } catch (e) {
            console.error("Failed to fetch comments:", e);
        }
        setLoading(false);
    }, [postId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
        e.preventDefault();
        
        const content = parentId ? replyText : text;
        if (!content.trim() || submitting) return;

        const authorName = name.trim() || userName || "Anonymous";
        setSubmitting(true);

        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    postId, 
                    parentId,
                    name: authorName, 
                    text: content.trim(),
                    clubBadge: userClubBadge || undefined,
                    userId: user?.id || null,
                    _hp: "",
                    deviceId: getDeviceId(),
                }),
            });

            if (res.ok) {
                if (parentId) {
                    setReplyText("");
                    setReplyingToId(null);
                } else {
                    setText("");
                }
                fetchComments();
            }
        } catch (e) {
            console.error("Failed to post comment:", e);
            toast.error("Failed to post comment.");
        }
        setSubmitting(false);
    };

    const handleLike = async (commentId: string) => {
        if (likedComments.has(commentId)) return;

        // Optimistic update
        setLikedComments(prev => new Set(prev).add(commentId));
        setComments(prev => prev.map(c => 
            c.id === commentId ? { ...c, likes: c.likes + 1 } : c
        ));

        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "like", commentId, deviceId: getDeviceId() })
            });
            if (!res.ok) throw new Error("Failed");
        } catch (e) {
            // Revert optimistic update
            setLikedComments(prev => {
                const next = new Set(prev);
                next.delete(commentId);
                return next;
            });
            setComments(prev => prev.map(c => 
                c.id === commentId ? { ...c, likes: Math.max(0, c.likes - 1) } : c
            ));
            toast.error("Could not like comment right now.");
        }
    };

    const formatTime = (isoString: string) => {
        const ts = new Date(isoString).getTime();
        const diff = Date.now() - ts;
        if (diff < 60000) return "just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const topLevelComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

    const CommentRender = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
        const replies = getReplies(comment.id);
        const isReplying = replyingToId === comment.id;

        return (
            <div className={`flex flex-col gap-3 ${isReply ? "mt-4 ml-8 relative" : "mt-6"}`}>
                {isReply && (
                    <div className="absolute -left-6 top-4 border-l-2 border-b-2 border-gray-200 dark:border-gray-800 w-4 h-4 rounded-bl-xl"></div>
                )}
                
                <div className="group flex gap-3 p-4 rounded-xl bg-white dark:bg-[#1E293B]/30 border border-gray-100 dark:border-gray-800/50 hover:border-[#16A34A]/20 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img src={getAvatarUrl(comment.userId, comment.name)} alt={comment.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-semibold text-[#0F172A] dark:text-white">{comment.name}</span>
                            {comment.clubBadge?.name && (
                                <span className="text-[10px] font-semibold text-[#16A34A] bg-[#16A34A]/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    {comment.clubBadge.logoUrl && (
                                        <img src={comment.clubBadge.logoUrl} alt="" className="w-3 h-3 object-contain" />
                                    )}
                                    {comment.clubBadge.name}
                                </span>
                            )}
                            <span className="text-[10px] text-gray-400">{formatTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                            {comment.text}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                            <button 
                                onClick={() => handleLike(comment.id)}
                                disabled={likedComments.has(comment.id)}
                                className={`flex items-center gap-1.5 transition-colors ${likedComments.has(comment.id) ? "text-[#16A34A]" : "hover:text-[#16A34A]"}`}
                            >
                                <ThumbsUp className="w-3.5 h-3.5" /> 
                                {comment.likes > 0 ? comment.likes : "Like"}
                            </button>
                            <button 
                                onClick={() => {
                                    setReplyingToId(isReplying ? null : comment.id);
                                    setReplyText("");
                                }}
                                className="flex items-center gap-1.5 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                            >
                                <Reply className="w-3.5 h-3.5" /> 
                                Reply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reply Form */}
                {isReplying && (
                    <div className="ml-8 mt-2">
                        <form onSubmit={(e) => handleSubmit(e, comment.id)}>
                            {/* Honeypot */}
                            <input type="text" name="_hp" autoComplete="off" tabIndex={-1} style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />
                            <div className="bg-gray-50 dark:bg-[#1E293B]/50 rounded-2xl p-3 border border-[#16A34A]/20">
                                {!isSignedIn && !userName && (
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full bg-transparent text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400 focus:outline-none mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 font-medium"
                                        maxLength={30}
                                    />
                                )}
                                <div className="flex gap-3">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Replying to ${comment.name}...`}
                                        rows={1}
                                        className="flex-1 bg-transparent text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400/70 focus:outline-none resize-none pt-1"
                                        maxLength={1000}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting || !replyText.trim()}
                                        className="self-end px-3 py-1.5 bg-[#16A34A] text-white rounded-lg text-xs font-bold hover:bg-[#15803d] transition-all disabled:opacity-40 flex items-center gap-1.5"
                                    >
                                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Render Replies recursively */}
                {replies.length > 0 && (
                    <div className="ml-4">
                        {replies.map(reply => (
                            <CommentRender key={reply.id} comment={reply} isReply={true} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8" id="comments">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-[#16A34A]" />
                Discussion ({comments.length})
            </h3>

            {/* Top-level Comment form */}
            <form onSubmit={(e) => handleSubmit(e, null)} className="mb-10">
                {/* Honeypot — invisible to humans, bots fill it */}
                <input type="text" name="_hp" autoComplete="off" tabIndex={-1} style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }} />
                <div className="bg-gray-50 dark:bg-[#1E293B]/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 focus-within:border-[#16A34A]/40 transition-colors">
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
                            className="flex-1 bg-transparent text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400/70 focus:outline-none resize-none pt-1"
                            maxLength={1000}
                        />
                        <button
                            type="submit"
                            disabled={submitting || !text.trim()}
                            className="self-end px-5 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-bold hover:bg-[#15803d] transition-all disabled:opacity-40 flex items-center gap-2 shadow-sm"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Post</>}
                        </button>
                    </div>
                </div>
            </form>

            {/* Comments list */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
                    <MessageSquare className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm font-medium text-[#0F172A] dark:text-white">No comments yet</p>
                    <p className="text-sm text-gray-500 mt-1">Be the first to share your take on this article.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {topLevelComments.map((comment) => (
                        <CommentRender key={comment.id} comment={comment} />
                    ))}
                </div>
            )}
        </div>
    );
}
