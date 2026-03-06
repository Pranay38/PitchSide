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
import {
    getSiteSettings,
    getSiteSettingsAsync,
    updateSiteSettingsAsync,
    type SiteSettings,
} from "../lib/siteSettingsStorage";
import { Plus, Edit3, Trash2, LogOut, Eye, ExternalLink, Download, Upload, Mail, Send, RadioTower, Library, Flame, Layout } from "lucide-react";
import { toast } from "sonner";
import { DebateEditor } from "../components/DebateEditor";

type View = "list" | "create" | "edit";
type Tab = "posts" | "collections" | "debates" | "settings";

export function AdminPage() {
    const navigate = useNavigate();
    const [isAuthed, setIsAuthed] = useState(isAdminAuthenticated());
    const [view, setView] = useState<View>("list");
    const [activeTab, setActiveTab] = useState<Tab>("posts");
    const [showDebateEditor, setShowDebateEditor] = useState(false);

    const [posts, setPosts] = useState<BlogPost[]>(() => getAllPosts());
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

    const [subscriberCount, setSubscriberCount] = useState(0);
    const [notifyingPostId, setNotifyingPostId] = useState<string | null>(null);
    const [sendingDigest, setSendingDigest] = useState(false);

    const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getSiteSettings());
    const [savingSiteSettings, setSavingSiteSettings] = useState(false);

    const [collections, setCollections] = useState<any[]>([]);
    const [debates, setDebates] = useState<any[]>([]);

    const fetchSubscriberCount = useCallback(async () => {
        try {
            const res = await fetch("/api/subscribers");
            if (res.ok) {
                const data = await res.json();
                setSubscriberCount(data.count || 0);
            }
        } catch { }
    }, []);

    const fetchCollections = useCallback(async () => {
        try {
            const res = await fetch("/api/collections");
            if (res.ok) setCollections(await res.json());
        } catch { }
    }, []);

    const fetchDebates = useCallback(async () => {
        try {
            const res = await fetch("/api/debates");
            if (res.ok) setDebates(await res.json());
        } catch { }
    }, []);

    const refreshPosts = useCallback(async () => {
        const latest = await getAllPostsAsync();
        setPosts(latest);
    }, []);

    useEffect(() => {
        if (isAuthed) {
            refreshPosts();
            fetchSubscriberCount();
            fetchCollections();
            fetchDebates();
            getSiteSettingsAsync()
                .then((settings) => setSiteSettings(settings))
                .catch(() => { });
        }
    }, [isAuthed, refreshPosts, fetchSubscriberCount, fetchCollections, fetchDebates]);

    const handleLogin = () => setIsAuthed(true);
    const handleLogout = () => { adminLogout(); setIsAuthed(false); };

    // Post Handlers
    const handleCreatePost = async (postData: Omit<BlogPost, "id">) => {
        try {
            const updated = await addPostAsync(postData);
            setPosts(updated);

            if (postData.isDraft) {
                // It was an auto-save, stay in the editor but switch to edit mode
                // The newly created post is the first one in the returned array from addPostAsync
                const newPost = updated[0];
                setEditingPost(newPost);
                setView("edit");
            } else {
                // Explicit publish click
                setView("list");
                toast.success("Post published successfully!");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save post.");
        }
    };

    const handleEditPost = (post: BlogPost) => {
        setEditingPost(post);
        setView("edit");
    };

    const handleUpdatePost = async (postData: Omit<BlogPost, "id">) => {
        if (editingPost) {
            try {
                const updated = await updatePostAsync(editingPost.id, postData);
                setPosts(updated);

                if (postData.isDraft) {
                    // It was an auto-save, just update the currently editing post quietly
                    const updatedPost = updated.find(p => p.id === editingPost.id);
                    if (updatedPost) setEditingPost(updatedPost);
                } else {
                    // Explicit publish or update
                    setEditingPost(null);
                    setView("list");
                    toast.success("Post updated successfully!");
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update post.");
            }
        }
    };

    const handleDeletePost = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this post? This cannot be undone.")) {
            try {
                const updated = await deletePostAsync(id);
                setPosts(updated);
                toast.success("Post deleted.");
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to delete post.");
            }
        }
    };

    const notifySubscribers = async (post: BlogPost) => {
        if (subscriberCount === 0) return toast.info("No subscribers yet.");
        if (!window.confirm(`Send email notification about "${post.title}" to ${subscriberCount} subscriber(s)?`)) return;

        setNotifyingPostId(post.id);
        try {
            const res = await fetch("/api/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: post.title, excerpt: post.excerpt, postId: post.id }),
            });
            const data = await res.json();
            if (res.ok) toast.success(data.message || "Notifications sent!");
            else toast.error(data.error || "Failed to send notifications.");
        } catch {
            toast.error("Failed to send notifications.");
        }
        setNotifyingPostId(null);
    };

    // Collection Handlers
    const handleCreateCollection = async () => {
        const title = window.prompt("Collection Title:");
        if (!title) return;
        const description = window.prompt("Description:");
        const emoji = window.prompt("Emoji (e.g. 📚):", "📚");
        const postIdsStr = window.prompt("Comma separated Post IDs to include (optional):", "");

        try {
            const res = await fetch("/api/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title, description, emoji,
                    postIds: postIdsStr ? postIdsStr.split(",").map(id => id.trim()) : []
                })
            });
            if (res.ok) {
                toast.success("Collection created!");
                fetchCollections();
            } else {
                toast.error("Failed to create collection");
            }
        } catch { toast.error("Network error"); }
    };

    const handleDeleteCollection = async (id: string) => {
        if (!window.confirm("Delete this collection?")) return;
        try {
            const res = await fetch(`/api/collections?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Collection deleted");
                fetchCollections();
            } else toast.error("Failed to delete collection");
        } catch { toast.error("Network error"); }
    };

    // Debate Handlers
    const handleSaveDebate = async (data: { title: string; description: string; category: string; coverImage: string }) => {
        try {
            const res = await fetch("/api/debates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create", ...data })
            });
            if (res.ok) {
                toast.success("Debate created!");
                setShowDebateEditor(false);
                fetchDebates();
            } else {
                toast.error("Failed to create debate");
            }
        } catch { toast.error("Network error"); }
    };

    const handleDeleteDebate = async (id: string) => {
        if (!window.confirm("Delete this debate?")) return;
        try {
            const res = await fetch(`/api/debates?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Debate deleted");
                fetchDebates();
            } else toast.error("Failed to delete debate");
        } catch { toast.error("Network error"); }
    };

    // Settings & Digest
    const handleSaveSocialWall = async () => {
        setSavingSiteSettings(true);
        try {
            const updated = await updateSiteSettingsAsync({
                socialWallEnabled: siteSettings.socialWallEnabled,
                socialWallTitle: siteSettings.socialWallTitle.trim() || "Social Wall",
                socialWallEmbedCode: siteSettings.socialWallEmbedCode,
            });
            setSiteSettings(updated);
            toast.success("Social Wall updated.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update.");
        } finally {
            setSavingSiteSettings(false);
        }
    };

    const handleSendDigest = async () => {
        if (!window.confirm("Send weekly digest to all subscribers now?")) return;
        setSendingDigest(true);
        try {
            const res = await fetch("/api/digest", { method: "POST" });
            const data = await res.json();
            if (res.ok) toast.success(data.message || "Digest sent!");
            else toast.error(data.error || "Failed to send digest");
        } catch {
            toast.error("Error sending digest");
        }
        setSendingDigest(false);
    };

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
            toast.success(`Imported \${imported.length} posts successfully!`);
        } catch {
            toast.error("Failed to import valid posts.json");
        }
        if (importFileRef.current) importFileRef.current.value = "";
    };

    if (!isAuthed) return <AdminLogin onLogin={handleLogin} />;

    if (view === "create" || view === "edit") {
        return (
            <PostEditor
                post={view === "edit" && editingPost ? editingPost : undefined}
                onSave={view === "edit" && editingPost ? handleUpdatePost : handleCreatePost}
                onCancel={() => {
                    setEditingPost(null);
                    setView("list");
                }}
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
                            <span className="text-xl font-bold bg-gradient-to-r from-[#16A34A] to-[#22c55e] bg-clip-text text-transparent">
                                The Touchline Dribble
                            </span>
                        </Link>
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] rounded-full">Admin</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">View Site</span>
                        </Link>
                        <ThemeToggle />
                        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-gray-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

            <main className="max-w-[1100px] mx-auto px-6 py-8">
                {/* Tabs Wrapper */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-8 pb-4">
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${activeTab === "posts" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Layout className="w-4 h-4" /> Posts
                    </button>
                    <button
                        onClick={() => setActiveTab("collections")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${activeTab === "collections" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Library className="w-4 h-4" /> Collections
                    </button>
                    <button
                        onClick={() => setActiveTab("debates")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${activeTab === "debates" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Flame className="w-4 h-4" /> Debates
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${activeTab === "settings" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <RadioTower className="w-4 h-4" /> Settings & Newsletter
                    </button>
                </div>

                {/* POSTS TAB */}
                {activeTab === "posts" && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Your Posts</h1>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">{posts.length} article{posts.length !== 1 ? "s" : ""} published</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
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

                        {posts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="text-5xl mb-4">📝</div>
                                <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">No posts yet</h2>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-6">Create your first blog post to get started.</p>
                                <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all">
                                    <Plus className="w-4 h-4" />Write Your First Post
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {posts.map((post) => (
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
                                            <button onClick={() => notifySubscribers(post)} disabled={notifyingPostId === post.id || post.isDraft} className={`p-2 rounded-lg ${post.isDraft ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors'}`} title="Notify Subscribers">
                                                <Send className={`w-4 h-4 ${notifyingPostId === post.id ? 'animate-pulse' : ''}`} />
                                            </button>
                                            <button onClick={() => navigate(`/post/\${post.id}`)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] dark:text-gray-400 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => handleEditPost(post)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#64748B] dark:text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeletePost(post.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#64748B] dark:text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* COLLECTIONS TAB */}
                {activeTab === "collections" && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Collections</h1>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">{collections.length} Reading Lists</p>
                            </div>
                            <button onClick={handleCreateCollection} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]">
                                <Plus className="w-4 h-4" />New Collection
                            </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {collections.length === 0 && <p className="text-gray-500">No collections created yet.</p>}
                            {collections.map((col) => (
                                <div key={col.id} className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-3xl mb-2 block">{col.emoji}</span>
                                            <h3 className="font-bold text-[#0F172A] dark:text-white">{col.title}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{col.description}</p>
                                        </div>
                                        <button onClick={() => handleDeleteCollection(col.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                                        {col.postCount} post{col.postCount !== 1 ? 's' : ''} inside
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* DEBATES TAB */}
                {activeTab === "debates" && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Debate Corner</h1>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">{debates.length} hot takes</p>
                            </div>
                            <button onClick={() => setShowDebateEditor(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]">
                                <Plus className="w-4 h-4" />New Debate
                            </button>
                        </div>

                        {showDebateEditor && (
                            <DebateEditor onSave={handleSaveDebate} onCancel={() => setShowDebateEditor(false)} />
                        )}
                        <div className="space-y-3">
                            {debates.length === 0 && <p className="text-gray-500">No debates created yet.</p>}
                            {debates.map((deb) => (
                                <div key={deb.id} className="p-5 flex items-center justify-between bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <h3 className="font-semibold text-[#0F172A] dark:text-white">{deb.title}</h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span className="text-emerald-500 font-medium">{deb.agreeVotes} Agree</span>
                                            <span className="text-red-500 font-medium">{deb.disagreeVotes} Disagree</span>
                                            <span>•</span>
                                            <span>{deb.totalArguments} Arguments</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteDebate(deb.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                    <div className="space-y-8">
                        {/* Digest section */}
                        <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2 mb-2">
                                    <Mail className="w-5 h-5 text-[#16A34A]" /> Newsletter & Digest
                                </h2>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-4 max-w-lg">
                                    You have <strong className="text-[#16A34A]">{subscriberCount} subscribers</strong>. The weekly digest triggers automatically via Vercel Cron. You can also send the digest right now to test it.
                                </p>
                                <button onClick={handleSendDigest} disabled={sendingDigest} className="px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all disabled:opacity-50 flex gap-2 items-center">
                                    <Send className="w-4 h-4" /> {sendingDigest ? "Sending..." : "Send Digest Manually"}
                                </button>
                            </div>
                        </section>

                        {/* Social Wall */}
                        <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                                        <RadioTower className="w-5 h-5 text-[#16A34A]" /> Social Wall
                                    </h2>
                                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                                        Paste Curator.io or Tagembed code to show a live social feed in your homepage sidebar.
                                    </p>
                                </div>
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                    <span className="text-sm font-medium text-[#0F172A] dark:text-white">Enabled</span>
                                    <input type="checkbox" checked={siteSettings.socialWallEnabled} onChange={(e) => setSiteSettings(prev => ({ ...prev, socialWallEnabled: e.target.checked }))} className="h-4 w-4 accent-[#16A34A]" />
                                </label>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Section Title</label>
                                    <input type="text" value={siteSettings.socialWallTitle} onChange={(e) => setSiteSettings((prev) => ({ ...prev, socialWallTitle: e.target.value }))} placeholder="Social Wall" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Embed Snippet</label>
                                    <textarea value={siteSettings.socialWallEmbedCode} onChange={(e) => setSiteSettings((prev) => ({ ...prev, socialWallEmbedCode: e.target.value }))} rows={4} placeholder="<div class='tagembed-widget' ...></div><script src='...'></script>" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-xs font-mono text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleSaveSocialWall} disabled={savingSiteSettings} className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]">
                                        {savingSiteSettings ? "Saving..." : "Save Social Wall"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
