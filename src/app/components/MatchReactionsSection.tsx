import { useEffect, useState, useRef } from "react";
import { Zap, Share2, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getAllPostsAsync } from "../../lib/postStorage";
import type { BlogPost } from "../../data/posts";
import ReactMarkdown from "react-markdown";
import { ImageShareModal } from "./ImageShareModal";
import { Camera } from "lucide-react";

export function MatchReactionsSection() {
    const [reactions, setReactions] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [sharePost, setSharePost] = useState<BlogPost | null>(null);

    useEffect(() => {
        const load = async () => {
            const allPosts = await getAllPostsAsync();
            const reactionsPosts = allPosts.filter(p => !p.isDraft && p.format === "match-reaction");
            
            // Only show the 5 most recent reactions
            setReactions(reactionsPosts.slice(0, 5));
            setLoading(false);
        };
        load();
    }, []);

    const handleShare = (id: string, title: string) => {
        const url = `${window.location.origin}/post/${id}`;
        navigator.clipboard.writeText(`Match Reaction: ${title}\n\n${url}`);
        toast.success("Reaction link copied to clipboard!");
    };

    if (loading) return null;
    if (reactions.length === 0) return null;

    return (
        <section className="mb-12 relative">
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-[#16A34A] animate-pulse" />
                        Live Match Reactions
                    </h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">Raw, unfiltered takeaways from the latest games.</p>
                </div>
            </div>

            <div className="relative">
                {/* Horizontal scroll container */}
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory hide-scrollbar pl-2 pr-12"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {reactions.map(reaction => (
                        <div 
                            key={reaction.id}
                            className="shrink-0 w-[300px] md:w-[380px] snap-start bg-gradient-to-br from-white to-gray-50 dark:from-[#1E293B] dark:to-[#0F172A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-lg shadow-[#16A34A]/5 relative group"
                        >
                            <div className="absolute top-0 right-0 p-3 flex gap-2">
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleShare(reaction.id, reaction.title);
                                    }}
                                    className="p-1.5 rounded-full bg-white dark:bg-slate-800 text-gray-400 hover:text-[#16A34A] shadow-sm transition-colors z-10"
                                    title="Copy Link"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setSharePost(reaction);
                                    }}
                                    className="p-1.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A] hover:text-white shadow-sm transition-colors z-10"
                                    title="Share as Image"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                                {reaction.club && (
                                    <span className="px-2.5 py-1 bg-[#16A34A]/10 text-[#16A34A] rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {reaction.club}
                                    </span>
                                )}
                                <span className="text-xs text-gray-500 font-medium">
                                    {new Date(reaction.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <Link to={`/post/${reaction.id}`} className="block">
                                <h3 className="font-bold text-lg text-[#0F172A] dark:text-white mb-2 leading-tight group-hover:text-[#16A34A] transition-colors line-clamp-2">
                                    {reaction.title}
                                </h3>
                                <div className="text-sm text-[#64748B] dark:text-gray-400 line-clamp-4 prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>{reaction.content}</ReactMarkdown>
                                </div>
                            </Link>

                            <Link 
                                to={`/post/${reaction.id}`}
                                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#16A34A] hover:text-[#15803d]"
                            >
                                Read full reaction <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
            
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            
            <ImageShareModal 
                isOpen={!!sharePost} 
                onClose={() => setSharePost(null)}
                post={sharePost}
            />
        </section>
    );
}
