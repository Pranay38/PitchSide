import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import type { BlogPost } from "../data/posts";
import { AdminLogin } from "../components/AdminLogin";
import { PostEditor } from "../components/PostEditor";
import { ThemeToggle } from "../components/ThemeToggle";
import {
    isAdminAuthenticated,
    adminLogout,
    getAllPosts,
    getAllPostsAsync,
    addPostAsync,
    updatePostAsync,
    deletePostAsync,
    exportPostsAsJSON,
    importPostsFromJSON,
} from "../lib/postStorage";
import { Plus, Edit3, Trash2, LogOut, Eye, ExternalLink, Download, Upload } from "lucide-react";
import { toast } from "sonner";

type View = "list" | "create" | "edit";

export function AdminPage() {
    const navigate = useNavigate();
    const [isAuthed, setIsAuthed] = useState(isAdminAuthenticated());
    const [view, setView] = useState<View>("list");
    const [posts, setPosts] = useState<BlogPost[]>(() => getAllPosts());
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

    const refreshPosts = useCallback(async () => {
        const latest = await getAllPostsAsync();
        setPosts(latest);
    }, []);

    // Load posts from API on mount
    useEffect(() => {
        if (isAuthed) refreshPosts();
    }, [isAuthed, refreshPosts]);

    const handleLogin = () => {
        setIsAuthed(true);
    };

    const handleLogout = () => {
        adminLogout();
        setIsAuthed(false);
    };

    const handleCreatePost = async (postData: Omit<BlogPost, "id">) => {
        const updated = await addPostAsync(postData);
        setPosts(updated);
        setView("list");
        toast.success("Post published successfully!");
    };

    const handleUpdatePost = async (postData: Omit<BlogPost, "id">) => {
        if (editingPost) {
            const updated = await updatePostAsync(editingPost.id, postData);
            setPosts(updated);
            setEditingPost(null);
            setView("list");
            toast.success("Post updated successfully!");
        }
    };

    const handleDeletePost = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this post? This cannot be undone.")) {
            const updated = await deletePostAsync(id);
            setPosts(updated);
            toast.success("Post deleted.");
        }
    };

    const handleEditPost = (post: BlogPost) => {
        setEditingPost(post);
        setView("edit");
    };

    const handleExport = () => {
        exportPostsAsJSON();
        toast.success("Posts exported! Move posts.json to your project's public/ folder, then deploy.");
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imported = await importPostsFromJSON(file);
            setPosts(imported);
            toast.success(`Imported ${imported.length} posts successfully!`);
        } catch {
            toast.error("Failed to import. Make sure it's a valid posts.json file.");
        }
        if (importFileRef.current) importFileRef.current.value = "";
    };

    if (!isAuthed) {
        return <AdminLogin onLogin={handleLogin} />;
    }

    if (view === "create") {
        return (
            <PostEditor
                onSave={handleCreatePost}
                onCancel={() => setView("list")}
            />
        );
    }

    if (view === "edit" && editingPost) {
        return (
            <PostEditor
                post={editingPost}
                onSave={handleUpdatePost}
                onCancel={() => { setEditingPost(null); setView("list"); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-2xl">⚽</span>
                            <span className="text-xl font-bold bg-gradient-to-r from-[#16A34A] to-[#22c55e] bg-clip-text text-transparent">
                                PitchSide
                            </span>
                        </Link>
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] rounded-full">
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">View Site</span>
                        </Link>
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hidden file input for import */}
            <input
                ref={importFileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
            />

            <main className="max-w-[1100px] mx-auto px-6 py-8">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
                            Your Posts
                        </h1>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                            {posts.length} article{posts.length !== 1 ? "s" : ""} published
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            title="Download posts.json — place in public/ folder then deploy"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button
                            onClick={() => importFileRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                            title="Import posts from a posts.json file"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Import</span>
                        </button>
                        <button
                            onClick={() => setView("create")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25"
                        >
                            <Plus className="w-4 h-4" />
                            New Post
                        </button>
                    </div>
                </div>

                {/* Posts List */}
                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="text-5xl mb-4">📝</div>
                        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">
                            No posts yet
                        </h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mb-6">
                            Create your first blog post to get started.
                        </p>
                        <button
                            onClick={() => setView("create")}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Write Your First Post
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
                            >
                                {/* Thumbnail */}
                                {post.coverImage && (
                                    <div className="hidden sm:block w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src={post.coverImage}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[#0F172A] dark:text-white text-sm truncate">
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8] dark:text-gray-500">
                                        <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] rounded-full font-medium">
                                            {post.club}
                                        </span>
                                        <span>{post.date}</span>
                                        <span>•</span>
                                        <span>{post.readTime}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => navigate(`/post/${post.id}`)}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] dark:text-gray-400 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEditPost(post)}
                                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#64748B] dark:text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePost(post.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#64748B] dark:text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
