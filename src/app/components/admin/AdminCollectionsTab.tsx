import { useState } from "react";
import { Loader2, Plus, Trash2, Library } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";
import { toast } from "sonner";

interface AdminCollection {
    id: string;
    title: string;
    description?: string;
    emoji?: string;
    postCount?: number;
    postIds?: string[];
    updatedAt?: string;
}

interface AdminCollectionsTabProps {
    collections: AdminCollection[];
    fetchCollections: () => Promise<void>;
}

export function AdminCollectionsTab({ collections, fetchCollections }: AdminCollectionsTabProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [emoji, setEmoji] = useState("📚");
    const [postIdsInput, setPostIdsInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setEmoji("📚");
        setPostIdsInput("");
    };

    const handleCreateCollection = async () => {
        if (!title.trim()) {
            toast.error("Collection title is required.");
            return;
        }

        setSaving(true);
        try {
            const password = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const res = await fetch("/api/collections", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${password || ""}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    emoji: emoji.trim() || "📚",
                    postIds: postIdsInput
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Failed to create collection.");
                setSaving(false);
                return;
            }

            toast.success("Collection created.");
            resetForm();
            await fetchCollections();
        } catch {
            toast.error("Network error while creating collection.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCollection = async (id: string) => {
        if (!window.confirm("Delete this collection?")) return;

        setDeletingId(id);
        try {
            const password = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const res = await fetch(`/api/collections?id=${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${password || ""}`,
                },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Failed to delete collection.");
                setDeletingId(null);
                return;
            }

            toast.success("Collection deleted.");
            await fetchCollections();
        } catch {
            toast.error("Network error while deleting collection.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Collections</h1>
                    <p className="mt-1 text-sm text-[#64748B] dark:text-gray-400">{collections.length} Reading Lists</p>
                </div>
            </div>

            <section className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-[#1E293B]">
                <div className="mb-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">New Reading List</p>
                    <h2 className="mt-2 text-xl font-bold text-[#0F172A] dark:text-white">Create a guided list</h2>
                    <p className="mt-2 text-sm text-[#64748B] dark:text-gray-400">
                        Add a title, description, emoji, and a comma-separated article ID list in the reading order you want.
                    </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px]">
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Collection title"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-[#0F172A] dark:text-white"
                    />
                    <input
                        value={emoji}
                        onChange={(event) => setEmoji(event.target.value)}
                        placeholder="📚"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-[#0F172A] dark:text-white"
                    />
                </div>

                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Why should readers open this list first?"
                    rows={3}
                    className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-[#0F172A] dark:text-white"
                />

                <textarea
                    value={postIdsInput}
                    onChange={(event) => setPostIdsInput(event.target.value)}
                    placeholder="post_123, post_456, post_789"
                    rows={3}
                    className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#0F172A] outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-[#0F172A] dark:text-white"
                />

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleCreateCollection}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Create Collection
                    </button>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
                {collections.length === 0 && (
                    <div className="sm:col-span-2">
                        <AdminEmptyState
                            icon={Library}
                            title="No collections created yet"
                            description="Create a reading list collection to guide your users through related articles."
                        />
                    </div>
                )}
                {collections.map((collection) => (
                    <div key={collection.id} className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-[#1E293B]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="mb-2 block text-3xl">{collection.emoji || "📚"}</span>
                                <h3 className="font-bold text-[#0F172A] dark:text-white">{collection.title}</h3>
                                {collection.description && (
                                    <p className="mt-1 text-sm text-gray-400">{collection.description}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDeleteCollection(collection.id)}
                                disabled={deletingId === collection.id}
                                className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                {deletingId === collection.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800">
                            {collection.postCount || collection.postIds?.length || 0} post{(collection.postCount || collection.postIds?.length || 0) === 1 ? "" : "s"} inside
                            {collection.updatedAt && (
                                <span> · Updated {new Date(collection.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
