import { useState, useMemo } from "react";
import { Zap, Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { addPostAsync } from "../../lib/postStorage";
import type { BlogPost } from "../../data/posts";
import { getAllClubNames } from "../../data/clubs";

export function AdminMatchReactionsTab() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [club, setClub] = useState("General");
    const [isPublishing, setIsPublishing] = useState(false);

    const clubOptions = useMemo(() => ["General", ...getAllClubNames().sort()], []);

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
        } catch (error) {
            console.error(error);
            toast.error("Failed to publish reaction.");
        } finally {
            setIsPublishing(false);
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
            
            <p className="text-center text-xs text-gray-400 mt-6 max-w-sm mx-auto">
                Once published, you can share the direct link straight to X or Reddit directly from the Quick Takes homepage widget.
            </p>
        </div>
    );
}
