import { useState, useMemo, useEffect } from "react";
import { Zap, Send, Loader2, MessageCircle, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { addPostAsync, getAllPostsAsync, deletePostAsync } from "../../lib/postStorage";
import type { BlogPost } from "../../data/posts";
import { getAllClubNames } from "../../data/clubs";

export function AdminMatchReactionsTab() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [club, setClub] = useState("General");
    const [isPublishing, setIsPublishing] = useState(false);
    
    // Recent match reactions state
    const [recentReactions, setRecentReactions] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const clubOptions = useMemo(() => ["General", ...getAllClubNames().sort()], []);

    const loadReactions = async () => {
        try {
            const posts = await getAllPostsAsync();
            const reactions = posts
                .filter(p => p.format === "match-reaction")
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentReactions(reactions);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadReactions();
    }, []);

    const handlePublish = async () => {
        if (!content.trim()) {
            toast.error("Reaction content is required.");
            return;
        }

        setIsPublishing(true);
        try {
            const finalTitle = title.trim() || `Match Reaction: ${club}`;
            const timestamp = new Date().toISOString();
            const newPost: BlogPost = {
                id: crypto.randomUUID(),
                title: finalTitle,
                content: content.trim(),
                author: "Admin", // or fetch from session
                date: timestamp,
                readTime: "1 min read",
                format: "match-reaction",
                tags: club !== "General" ? [club, "Match Reaction"] : ["Analysis", "Match Reaction"],
                club: club !== "General" ? club : undefined,
                excerpt: content.replace(/<[^>]*>?/gm, '').substring(0, 150) + "...",
                isDraft: false,
            };

            await addPostAsync(newPost);
            
            // Ping Google
            fetch("/api/posts?action=pingSitemap")
                .catch(err => console.error("Sitemap ping failed silently:", err));

            toast.success("Match Reaction Published instantly to the feed!");
            
            // Format state
            setTitle("");
            setContent("");
            setClub("General");
            
            // Reload list
            void loadReactions();
        } catch (error) {
            console.error(error);
            toast.error("Failed to publish reaction.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this match reaction?")) return;
        
        try {
            await deletePostAsync(id);
            setRecentReactions(prev => prev.filter(r => r.id !== id));
            toast.success("Reaction deleted!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete reaction.");
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto pt-6">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#16A34A]/10 mb-4 text-[#16A34A]">
                    <Zap className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                    Instant Match Reaction
                </h1>
                <p className="mt-2 text-[#64748B] dark:text-gray-400 max-w-md mx-auto">
                    The final whistle just blew. Write 1 or 2 fast takeaways here and immediately push it to the Quick Takes feed.
                </p>
            </div>

            {/* Editor Surface */}
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-lg shadow-[#16A34A]/5 border border-[#16A34A]/20 overflow-hidden transform transition-all duration-300 relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#16A34A] to-emerald-400"></div>
                
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex gap-4">
                    <select
                        value={club}
                        onChange={(e) => setClub(e.target.value)}
                        className="bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold px-4 py-2 focus:ring-[#16A34A] max-w-[150px] shadow-sm text-gray-700 dark:text-gray-300 outline-none"
                    >
                        {clubOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Optional headline (Default: Match Reaction: [Club])"
                        className="flex-1 bg-transparent border-none text-base font-bold font-outfit text-[#0F172A] dark:text-white focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-2 outline-none"
                    />
                </div>

                <div className="p-6">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's your immediate reaction? Write raw markdown or plain text."
                        className="w-full min-h-[240px] bg-transparent border-none focus:ring-0 resize-y text-[#0F172A] dark:text-gray-200 text-lg leading-relaxed outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium"
                        autoFocus
                    />
                </div>
                
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-slate-800/50 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <MessageCircle className="w-3 h-3" />
                            Live
                        </span>
                        <p className="text-xs text-gray-400 font-medium hidden sm:block">
                            Formats as Quick Take
                        </p>
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || !content}
                        className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base shadow-md shadow-[#16A34A]/20"
                    >
                        {isPublishing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                        Publish Reaction Now
                    </button>
                </div>
            </div>
            
            {/* Recent Match Reactions List */}
            <div className="mt-12 mb-6 border-t border-gray-200 dark:border-gray-800 pt-8">
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <h2 className="text-xl font-bold font-outfit text-[#0F172A] dark:text-white">
                        Past Match Reactions
                    </h2>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#16A34A] animate-spin" />
                    </div>
                ) : recentReactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No match reactions found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentReactions.map(reaction => (
                            <div key={reaction.id} className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-start justify-between gap-4 transition-all hover:shadow-md">
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {reaction.club && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#0F172A] dark:bg-gray-700 px-2 py-0.5 rounded">
                                                {reaction.club}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500 font-medium">
                                            {new Date(reaction.date).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-[#0F172A] dark:text-white truncate">
                                        {reaction.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {reaction.excerpt}
                                    </p>
                                </div>
                                <button
                                    onClick={() => void handleDelete(reaction.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                    title="Delete Reaction"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
