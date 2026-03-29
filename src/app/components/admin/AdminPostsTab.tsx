import { useState, useRef } from "react";
import { Plus, Edit3, Trash2, Eye, Download, Upload, Send, Filter, Layout } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { BlogPost } from "../../data/posts";

interface AdminPostsTabProps {
    posts: BlogPost[];
    subscriberCount: number;
    notifyingPostId: string | null;
    setView: (view: "list" | "create" | "edit") => void;
    setEditingPost: (post: BlogPost | null) => void;
    onDeletePost: (id: string) => void;
    onNotifySubscribers: (post: BlogPost) => void;
    onExport: () => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    importFileRef: React.RefObject<HTMLInputElement | null>;
}

export function AdminPostsTab({
    posts,
    subscriberCount,
    notifyingPostId,
    setView,
    setEditingPost,
    onDeletePost,
    onNotifySubscribers,
    onExport,
    onImport,
    importFileRef
}: AdminPostsTabProps) {
    const navigate = useNavigate();
    const [postFilter, setPostFilter] = useState<"all" | "published" | "drafts">("all");
    const [postSort, setPostSort] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

    const displayedPosts = [...posts]
        .filter(post => {
            if (postFilter === "published") return !post.isDraft;
            if (postFilter === "drafts") return post.isDraft;
            return true;
        })
        .sort((a, b) => {
            if (postSort === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (postSort === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
            if (postSort === "a-z") return a.title.localeCompare(b.title);
            if (postSort === "z-a") return b.title.localeCompare(a.title);
            return 0;
        });

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Your Posts</h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">{posts.length} article{posts.length !== 1 ? "s" : ""} published</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onExport} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                        <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
                    </button>
                    <button onClick={() => importFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                        <Upload className="w-4 h-4" /><span className="hidden sm:inline">Import</span>
                    </button>
                    <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25">
                        <Plus className="w-4 h-4" />New Post
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setPostFilter("all")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${postFilter === "all" ? "bg-white dark:bg-[#0F172A] text-[#16A34A] shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                    >
                        All ({posts.length})
                    </button>
                    <button
                        onClick={() => setPostFilter("published")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${postFilter === "published" ? "bg-white dark:bg-[#0F172A] text-[#16A34A] shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                    >
                        Published ({posts.filter(p => !p.isDraft).length})
                    </button>
                    <button
                        onClick={() => setPostFilter("drafts")}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${postFilter === "drafts" ? "bg-white dark:bg-[#0F172A] text-[#16A34A] shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                    >
                        Drafts ({posts.filter(p => p.isDraft).length})
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select 
                        value={postSort}
                        onChange={(e) => setPostSort(e.target.value as any)}
                        className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-[#16A34A] focus:border-[#16A34A] block w-full p-2.5 outline-none cursor-pointer pr-8"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="a-z">Title (A-Z)</option>
                        <option value="z-a">Title (Z-A)</option>
                    </select>
                </div>
            </div>

            {displayedPosts.length === 0 ? (
                <AdminEmptyState
                    icon={Layout}
                    title="No posts yet"
                    description="Create your first blog post to get started."
                    action={
                        <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all active:scale-95 shadow-sm">
                            <Plus className="w-4 h-4" />Write Your First Post
                        </button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {displayedPosts.map((post) => (
                        <div key={post.id} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                            {post.coverImage && (
                                <div className="hidden sm:block w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-[#0F172A] dark:text-white text-sm truncate">{post.title}</h3>
                                    {post.isDraft && (
                                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded">Draft</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8] dark:text-gray-500">
                                    <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] rounded-full font-medium">{post.club}</span>
                                    <span>{post.date}</span><span>•</span><span>{post.readTime}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => onNotifySubscribers(post)} disabled={notifyingPostId === post.id || post.isDraft} className={`p-2 rounded-lg ${post.isDraft ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors'}`} title="Notify Subscribers">
                                    <Send className={`w-4 h-4 ${notifyingPostId === post.id ? 'animate-pulse' : ''}`} />
                                </button>
                                <button onClick={() => navigate(`/post/${post.id}`)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] dark:text-gray-400 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => { setEditingPost(post); setView("edit"); }} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#64748B] dark:text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => onDeletePost(post.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#64748B] dark:text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
