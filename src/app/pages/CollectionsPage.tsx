import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { ArrowLeft, BookOpen, Clock, ChevronRight, Loader2, Library } from "lucide-react";

interface Collection {
    id: string;
    title: string;
    description: string;
    emoji: string;
    postCount: number;
    createdAt: string;
}

interface Post {
    id: string;
    title: string;
    excerpt?: string;
    coverImage?: string;
    date?: string;
    category?: string;
}

interface CollectionDetail extends Collection {
    posts: Post[];
    postIds: string[];
}

export function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [activeCollection, setActiveCollection] = useState<CollectionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchCollections = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/collections");
            if (res.ok) setCollections(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    const fetchDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/collections?id=${id}`);
            if (res.ok) setActiveCollection(await res.json());
        } catch (e) { console.error(e); }
        setDetailLoading(false);
    }, []);

    useEffect(() => { fetchCollections(); }, [fetchCollections]);

    // Detail view
    if (activeCollection) {
        return (
            <div className="min-h-screen bg-[#0a0e1a] text-white">
                <div className="sticky top-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
                        <button onClick={() => setActiveCollection(null)} className="flex items-center gap-1.5 text-gray-400 hover:text-emerald-400 transition text-sm font-medium">
                            <ArrowLeft className="w-4 h-4" /> All Collections
                        </button>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 py-8">
                    <div className="text-center mb-8">
                        <span className="text-4xl mb-3 block">{activeCollection.emoji}</span>
                        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{activeCollection.title}</h1>
                        {activeCollection.description && (
                            <p className="text-gray-400 text-sm max-w-md mx-auto">{activeCollection.description}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-2">{activeCollection.posts.length} articles</p>
                    </div>

                    <div className="space-y-4">
                        {activeCollection.posts.length === 0 ? (
                            <div className="text-center py-16">
                                <BookOpen className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                                <p className="text-gray-400 text-sm">No posts in this collection yet</p>
                            </div>
                        ) : (
                            activeCollection.posts.map((post, i) => (
                                <Link
                                    key={post.id}
                                    to={`/post/${post.id}`}
                                    className="group block rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all p-5"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition mb-1 line-clamp-2">
                                                {post.title}
                                            </h3>
                                            {post.excerpt && (
                                                <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600">
                                                {post.category && <span className="px-2 py-0.5 bg-white/5 rounded-full">{post.category}</span>}
                                                {post.date && <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition flex-shrink-0 mt-1" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Collections list
    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">
            <div className="sticky top-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <h1 className="text-sm font-bold text-white flex items-center gap-2">
                        <Library className="w-4 h-4 text-emerald-400" /> Reading Lists
                    </h1>
                    <div className="w-16" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">📚 Reading Lists</h1>
                    <p className="text-gray-400 text-sm">Curated collections of our best articles</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                        <p className="text-gray-500 text-sm">Loading collections...</p>
                    </div>
                ) : collections.length === 0 ? (
                    <div className="text-center py-16">
                        <Library className="w-12 h-12 mx-auto text-gray-700 mb-3" />
                        <p className="text-gray-400 text-sm font-medium">No collections yet</p>
                        <p className="text-gray-600 text-xs mt-1">Collections will appear here when created by the admin</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {collections.map((col) => (
                            <button
                                key={col.id}
                                onClick={() => fetchDetail(col.id)}
                                disabled={detailLoading}
                                className="group text-left rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/5 hover:border-emerald-500/20 hover:from-emerald-500/5 transition-all p-6 relative overflow-hidden"
                            >
                                <div className="absolute -top-4 -right-4 text-6xl opacity-10 group-hover:opacity-20 transition">
                                    {col.emoji}
                                </div>
                                <span className="text-3xl mb-3 block">{col.emoji}</span>
                                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition mb-1">
                                    {col.title}
                                </h3>
                                {col.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{col.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                                    <BookOpen className="w-3 h-3" />
                                    <span>{col.postCount} article{col.postCount !== 1 ? "s" : ""}</span>
                                    <span>•</span>
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(col.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
