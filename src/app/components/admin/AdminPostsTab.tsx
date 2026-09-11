import { useState, useRef, Dispatch, SetStateAction } from "react";
import { Plus, Eye, Edit3, Trash2, Send, Image as ImageIcon, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "../../data/posts";
import { exportPostsAsJSON, importPostsFromJSON } from "../../lib/postStorage";

interface AdminPostsTabProps {
    posts: BlogPost[];
    setPosts: Dispatch<SetStateAction<BlogPost[]>>;
    setView: (view: "list" | "create" | "edit") => void;
    handleViewPost: (post: BlogPost) => void;
    handleEditPost: (post: BlogPost) => void;
    handleDeletePost: (id: string) => void;
    notifySubscribers: (post: BlogPost) => void;
    notifyingPostId: string | null;
    setTargetCarouselText: (text: string) => void;
    setActiveTab: (tab: any) => void;
}

export function AdminPostsTab({
    posts,
    setPosts,
    setView,
    handleViewPost,
    handleEditPost,
    handleDeletePost,
    notifySubscribers,
    notifyingPostId,
    setTargetCarouselText,
    setActiveTab
}: AdminPostsTabProps) {
    const [postFilter, setPostFilter] = useState<"all" | "published" | "drafts">("all");
    const [postSort, setPostSort] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");
    const importFileRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        exportPostsAsJSON();
        toast.success("Posts exported! Move posts.json to your public/ folder.");
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imported = await importPostsFromJSON(file);
            setPosts(imported);
            toast.success(`Imported ${imported.length} posts successfully!`);
        } catch {
            toast.error("Failed to import valid posts.json");
        }
        if (importFileRef.current) importFileRef.current.value = "";
    };

    const displayedPosts = [...posts]
        .filter(post => {
            if (postFilter === "published") return !post.isDraft;
            if (postFilter === "drafts") return post.isDraft;
            return true; // "all"
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-[2]">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <button onClick={() => setView("create")} className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] text-white rounded-lg font-medium text-sm hover:bg-[#15803d] active:scale-95 transition-all">
                        <Plus className="w-4 h-4" /> New Post
                    </button>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <div className="relative">
                        <button onClick={() => importFileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
                            <Upload className="w-4 h-4" /> Import
                        </button>
                        <input type="file" accept=".json" className="hidden" ref={importFileRef} onChange={handleImport} />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <select 
                        value={postFilter}
                        onChange={(e) => setPostFilter(e.target.value as any)}
                        className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-[#16A34A] focus:border-[#16A34A] block w-full p-2.5 outline-none cursor-pointer pr-8"
                    >
                        <option value="all">All Posts</option>
                        <option value="published">Published</option>
                        <option value="drafts">Drafts</option>
                    </select>

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
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="text-5xl mb-4">📝</div>
                    <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">No posts yet</h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mb-6">Create your first blog post to get started.</p>
                    <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] active:scale-95 transition-all">
                        <Plus className="w-4 h-4" />Write Your First Post
                    </button>
                </div>
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
                                    {post.isDraft && !post.publishAt && (
                                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded">Draft</span>
                                    )}
                                    {post.isDraft && post.publishAt && (
                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                            Scheduled for {new Date(post.publishAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8] dark:text-gray-500">
                                    <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] rounded-full font-medium">{post.club}</span>
                                    <span>{post.date}</span><span>•</span><span>{post.readTime}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => notifySubscribers(post)} disabled={notifyingPostId === post.id || post.isDraft} className={`p-2 rounded-lg ${post.isDraft ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors'}`} title="Notify Subscribers">
                                    <Send className={`w-4 h-4 ${notifyingPostId === post.id ? 'animate-pulse' : ''}`} />
                                </button>
                                <button onClick={() => {
                                    setTargetCarouselText(post.content);
                                    setActiveTab("carousel-generator");
                                }} className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-[#64748B] dark:text-gray-400 hover:text-green-600 transition-colors" title="Create Carousel">
                                    <ImageIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleViewPost(post)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] dark:text-gray-400 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => handleEditPost(post)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#64748B] dark:text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeletePost(post.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#64748B] dark:text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
