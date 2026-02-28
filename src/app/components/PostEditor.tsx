import { useState, useEffect, useRef } from "react";
import type { BlogPost } from "../data/posts";
import { getAllClubNames, searchClubsOnline, addCustomClub, getClubByName } from "../data/clubs";
import type { SearchResult } from "../data/clubs";
import { calculateReadTime, formatDate } from "../lib/postStorage";
import { RichTextEditor } from "./RichTextEditor";
import { ArrowLeft, Image, Tag, FileText, Upload, Link, X, Search, Loader2 } from "lucide-react";

/** Categories that are NOT club-specific */
const GENERAL_CATEGORIES = [
    "General",
    "Tactics",
    "Trophy",
    "History",
    "Opinion",
    "Transfer Rumours",
    "Match Preview",
    "Match Review",
    "Player Profile",
    "Manager Spotlight",
    "Youth Development",
    "Women's Football",
];

/** Compress and convert an image file to a base64 data URL */
function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = (h * maxWidth) / w;
                    w = maxWidth;
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("Canvas not supported"));
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/webp", quality));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

interface PostEditorProps {
    post?: BlogPost | null;
    onSave: (post: Omit<BlogPost, "id">) => void;
    onCancel: () => void;
}

export function PostEditor({ post, onSave, onCancel }: PostEditorProps) {
    const [title, setTitle] = useState(post?.title || "");
    const [excerpt, setExcerpt] = useState(post?.excerpt || "");
    const [content, setContent] = useState(post?.content || "");
    const [coverImage, setCoverImage] = useState(post?.coverImage || "");
    const [imageMode, setImageMode] = useState<"upload" | "url">(
        post?.coverImage?.startsWith("data:") ? "upload" : "url"
    );
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState<string>(() => {
        if (post?.club && getAllClubNames().includes(post.club)) return "club";
        return post?.club || "General";
    });
    const [club, setClub] = useState(post?.club || "");
    const [clubSearch, setClubSearch] = useState("");
    const [clubResults, setClubResults] = useState<SearchResult[]>([]);
    const [searchingClubs, setSearchingClubs] = useState(false);
    const [showClubDropdown, setShowClubDropdown] = useState(false);
    const clubSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clubDropdownRef = useRef<HTMLDivElement>(null);
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>(post?.tags || []);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Derive the effective "club" field based on category
    const effectiveClub = category === "club" ? club : category;

    // Auto-set primary tag when category/club changes
    useEffect(() => {
        const primary = category === "club" ? club : category;
        if (primary && !tags.includes(primary)) {
            setTags((prev) => [primary, ...prev.filter((t) => t !== primary)]);
        }
    }, [category, club]);

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) {
            setTags([...tags, t]);
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    // Club search with debounce
    const handleClubSearch = (query: string) => {
        setClubSearch(query);
        setShowClubDropdown(true);

        // Show local matches immediately
        const localNames = getAllClubNames();
        const localMatches = localNames
            .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
            .map((n) => {
                const c = getClubByName(n);
                return { name: n, league: c?.league || "", logo: c?.logo || "" };
            });
        setClubResults(localMatches);

        // Debounced online search
        if (clubSearchTimeout.current) clearTimeout(clubSearchTimeout.current);
        if (query.length >= 2) {
            setSearchingClubs(true);
            clubSearchTimeout.current = setTimeout(async () => {
                const online = await searchClubsOnline(query);
                // Merge: local first, then online results not already in local
                const localSet = new Set(localMatches.map((m) => m.name.toLowerCase()));
                const merged = [
                    ...localMatches,
                    ...online.filter((r) => !localSet.has(r.name.toLowerCase())),
                ];
                setClubResults(merged);
                setSearchingClubs(false);
            }, 400);
        } else {
            setSearchingClubs(false);
        }
    };

    const selectClub = (result: SearchResult) => {
        setClub(result.name);
        setClubSearch(result.name);
        setShowClubDropdown(false);
        // Add to persistent club list if it's new
        addCustomClub({ name: result.name, league: result.league, logo: result.logo });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (clubDropdownRef.current && !clubDropdownRef.current.contains(e.target as Node)) {
                setShowClubDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setUploading(true);
        try {
            const dataUrl = await compressImage(file);
            setCoverImage(dataUrl);
        } catch {
            console.error("Failed to process image");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!title.trim()) errs.title = "Title is required";
        if (!excerpt.trim()) errs.excerpt = "Excerpt is required";
        if (!content.trim() && content.length < 10) errs.content = "Content is required";
        if (category === "club" && !club) errs.club = "Select a club";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const plainText = content.replace(/<[^>]*>/g, " ").trim();

        onSave({
            title: title.trim(),
            excerpt: excerpt.trim(),
            content: content,
            coverImage:
                coverImage.trim() ||
                "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
            club: effectiveClub,
            tags: tags.length > 0 ? tags : [effectiveClub],
            date: post?.date || formatDate(),
            readTime: calculateReadTime(plainText),
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-1.5 bg-[#16A34A] text-white rounded-lg font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25"
                    >
                        {post ? "Update Post" : "Publish Post"}
                    </button>
                </div>
            </div>

            <div className="max-w-[900px] mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Cover Image */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                            <Image className="w-4 h-4 text-[#16A34A]" />
                            Cover Image
                        </label>

                        {/* Toggle: Upload vs URL */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setImageMode("upload")}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${imageMode === "upload"
                                    ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                                    : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                                    }`}
                            >
                                <Upload className="w-4 h-4" />
                                Upload from Device
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageMode("url")}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${imageMode === "url"
                                    ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                                    : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                                    }`}
                            >
                                <Link className="w-4 h-4" />
                                Paste URL
                            </button>
                        </div>

                        {/* Upload mode */}
                        {imageMode === "upload" && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${dragOver
                                        ? "border-[#16A34A] bg-[#16A34A]/5"
                                        : "border-gray-300 dark:border-gray-600 hover:border-[#16A34A] hover:bg-gray-50 dark:hover:bg-[#0F172A]"
                                        }`}
                                >
                                    {uploading ? (
                                        <div className="flex items-center gap-2 text-[#16A34A]">
                                            <div className="w-5 h-5 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm font-medium">Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-[#94A3B8]" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                                                    Click to upload or drag & drop
                                                </p>
                                                <p className="text-xs text-[#94A3B8] mt-1">
                                                    PNG, JPG, WEBP up to 10MB — auto-compressed
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {/* URL mode */}
                        {imageMode === "url" && (
                            <>
                                <input
                                    type="url"
                                    value={coverImage.startsWith("data:") ? "" : coverImage}
                                    onChange={(e) => setCoverImage(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                                />
                                <p className="text-xs text-[#94A3B8] dark:text-gray-500 mt-2">
                                    Tip: Use{" "}
                                    <a href="https://unsplash.com" target="_blank" rel="noopener" className="text-[#16A34A] hover:underline">
                                        Unsplash
                                    </a>{" "}
                                    for free high-quality images
                                </p>
                            </>
                        )}

                        {/* Preview */}
                        {coverImage && (
                            <div className="mt-4 relative">
                                <div className="aspect-[21/9] rounded-xl overflow-hidden">
                                    <img
                                        src={coverImage}
                                        alt="Cover preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setCoverImage(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
                                    title="Remove image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Title & Excerpt */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                            <FileText className="w-4 h-4 text-[#16A34A]" />
                            Title & Summary
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setErrors({ ...errors, title: "" });
                            }}
                            placeholder="Your article title..."
                            className={`w-full px-4 py-3 rounded-xl border ${errors.title ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-lg font-semibold mb-3`}
                        />
                        {errors.title && <p className="text-red-500 text-xs mb-2">{errors.title}</p>}

                        <textarea
                            value={excerpt}
                            onChange={(e) => {
                                setExcerpt(e.target.value);
                                setErrors({ ...errors, excerpt: "" });
                            }}
                            placeholder="Brief summary of the article (shown on cards)..."
                            rows={2}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.excerpt ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm resize-none`}
                        />
                        {errors.excerpt && <p className="text-red-500 text-xs">{errors.excerpt}</p>}
                    </div>

                    {/* Category & Club */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                            <Tag className="w-4 h-4 text-[#16A34A]" />
                            Category & Tags
                        </label>

                        {/* Category type selector */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setCategory("club")}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${category === "club"
                                    ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                                    : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                                    }`}
                            >
                                ⚽ Club-Specific
                            </button>
                            <button
                                type="button"
                                onClick={() => setCategory("General")}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${category !== "club"
                                    ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                                    : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                                    }`}
                            >
                                📋 General Topic
                            </button>
                        </div>

                        {/* Club selector with search (only when club-specific) */}
                        {category === "club" && (
                            <div ref={clubDropdownRef} className="relative mb-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    {club && getClubByName(club)?.logo && (
                                        <img
                                            src={getClubByName(club)!.logo}
                                            alt=""
                                            className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 object-contain"
                                        />
                                    )}
                                    <input
                                        type="text"
                                        value={clubSearch || club}
                                        onChange={(e) => handleClubSearch(e.target.value)}
                                        onFocus={() => { if (clubSearch || club) handleClubSearch(clubSearch || club); }}
                                        placeholder="Search any club in the world..."
                                        className={`w-full ${club && getClubByName(club)?.logo ? 'pl-[4.5rem]' : 'pl-10'} pr-4 py-3 rounded-xl border ${errors.club ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm`}
                                    />
                                    {searchingClubs && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16A34A] animate-spin" />
                                    )}
                                </div>

                                {/* Dropdown results */}
                                {showClubDropdown && clubResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-600 shadow-xl max-h-60 overflow-y-auto">
                                        {clubResults.map((result) => (
                                            <button
                                                key={result.name}
                                                type="button"
                                                onClick={() => selectClub(result)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {result.logo ? (
                                                        <img
                                                            src={result.logo}
                                                            alt=""
                                                            className="w-5 h-5 object-contain"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = "none";
                                                                e.currentTarget.parentElement!.textContent = result.name[0];
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-[#64748B]">{result.name[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[#0F172A] dark:text-white truncate">{result.name}</p>
                                                    <p className="text-xs text-[#94A3B8] dark:text-gray-500 truncate">{result.league}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* General topic selector (only when general) */}
                        {category !== "club" && (
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm mb-3"
                            >
                                {GENERAL_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        )}

                        {errors.club && <p className="text-red-500 text-xs mb-2">{errors.club}</p>}

                        {/* Tag input */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add a custom tag (e.g., Premier League, UCL)..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-[#0F172A] dark:text-white rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${tag === effectiveClub
                                            ? "bg-[#16A34A] text-white"
                                            : "bg-gray-100 dark:bg-gray-700 text-[#64748B] dark:text-gray-400"
                                            }`}
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-1 hover:text-red-500 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rich Text Content */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                                <FileText className="w-4 h-4 text-[#16A34A]" />
                                Content
                            </label>
                            <span className="text-xs text-[#94A3B8] dark:text-gray-500">
                                {calculateReadTime(content.replace(/<[^>]*>/g, " "))}
                            </span>
                        </div>
                        {errors.content && <p className="text-red-500 text-xs mb-2">{errors.content}</p>}
                        <RichTextEditor content={content} onChange={setContent} />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pb-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25"
                        >
                            {post ? "Update Post" : "Publish Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
