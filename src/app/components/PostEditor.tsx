import { useState, useEffect, useMemo, useRef } from "react";
import type { BlogPost } from "../data/posts";
import { getAllClubNames, searchClubsOnline, addCustomClub, getClubByName, deleteCustomClub, isCustomClub } from "../data/clubs";
import type { SearchResult } from "../data/clubs";
import { calculateReadTime, formatDate, getAllPosts } from "../lib/postStorage";
import { RichTextEditor } from "./RichTextEditor";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { getArticleContentModel } from "../lib/articleModel";
import { ArrowLeft, Image, Tag, FileText, Upload, Link, X, Search, Loader2, Flame, Star, Crown, Activity, User, BarChart3, Users, Eye, Clock, Cloud, CloudOff, CheckCircle2, Plus, Trash2, MessageSquare, CalendarDays } from "lucide-react";
import { PollWidget } from "./PollWidget";
import { scheduleEmbedHydration } from "../lib/embedHydration";
import { toast } from "sonner";
import { SpellcheckBar } from "./admin/SpellcheckBar";

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
    onSave: (post: Omit<BlogPost, "id">, isLeaving?: boolean) => Promise<void>;
    onCancel: () => void;
}

export function PostEditor({ post, onSave, onCancel }: PostEditorProps) {
    type SubmitAction = "draft" | "publish" | "back";
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
    const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());
    const clubSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clubDropdownRef = useRef<HTMLDivElement>(null);
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>(post?.tags || []);
    const [thisWeek, setThisWeek] = useState(post?.thisWeek || false);
    const [mustRead, setMustRead] = useState(post?.mustRead || false);
    const [editorPick, setEditorPick] = useState(post?.editorPick || false);
    const [mainStory, setMainStory] = useState(post?.mainStory || false);
    const [mediaUrl, setMediaUrl] = useState(post?.mediaUrl || "");
    const [playerName, setPlayerName] = useState(post?.playerName || "");
    const [poll, setPoll] = useState(post?.poll || { question: "", options: [{ text: "", votes: 0 }, { text: "", votes: 0 }] });
    const [usePoll, setUsePoll] = useState(!!post?.poll);
    const [matchRatings, setMatchRatings] = useState<{playerName: string, editorRating: number}[]>(post?.matchRatings || []);
    const [useMatchRatings, setUseMatchRatings] = useState(!!post?.matchRatings && post.matchRatings.length > 0);
    const [publishAt, setPublishAt] = useState(post?.publishAt || "");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const previewContentRef = useRef<HTMLDivElement | null>(null);

    // Custom Team Modal State
    const [showCustomTeamModal, setShowCustomTeamModal] = useState(false);
    const [customTeamLogoInput, setCustomTeamLogoInput] = useState("");
    const [copiedThread, setCopiedThread] = useState(false);

    // Auto-save state
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [submitAction, setSubmitAction] = useState<SubmitAction | null>(null);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewArticleModel = useMemo(() => getArticleContentModel(content), [content]);

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

    const handleAddCustomClub = () => {
        if (!clubSearch.trim()) return;
        setCustomTeamLogoInput("");
        setShowCustomTeamModal(true);
    };

    const confirmCustomTeamAdd = () => {
        if (!clubSearch.trim()) return;

        const newClub = {
            name: clubSearch.trim(),
            league: "Custom Teams", // Generic bucket for user-added teams
            logo: customTeamLogoInput.trim() || ""
        };

        addCustomClub(newClub);
        selectClub(newClub);
        setShowCustomTeamModal(false);
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

    useEffect(() => {
        if (!showPreview || !content) return;
        return scheduleEmbedHydration(previewContentRef.current);
    }, [showPreview, content]);

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

    const handleCopyAsThread = () => {
        // Strip HTML but preserve paragraphs
        let plain = content
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, ' ')
            .trim();
            
        // Clean up excessive spaces
        plain = plain.replace(/  +/g, ' ');

        const paragraphs = plain.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
        
        if (paragraphs.length === 0) {
            toast.error("Editor is empty!");
            return;
        }

        const total = paragraphs.length;
        const threadText = paragraphs
            .map((p, i) => `${i + 1}/${total}\n${p}`)
            .join('\n\n———\n\n');

        navigator.clipboard.writeText(threadText);
        setCopiedThread(true);
        toast.success("Thread copied to clipboard!");
        setTimeout(() => setCopiedThread(false), 2000);
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        
        if (!title.trim()) errs.title = "Title is required";
        if (!excerpt.trim()) errs.excerpt = "Excerpt is required";
        if (!cleanContent && content.length < 10) errs.content = "Content is required";
        if (category === "club" && !club) errs.club = "Select a club";
        
        setErrors(errs);
        
        if (Object.keys(errs).length > 0) {
            toast.error("Please fill in all required fields to publish.", { id: "validation-error" });
        }
        
        return Object.keys(errs).length === 0;
    };

    const buildPostPayload = (isDraft: boolean): Omit<BlogPost, "id"> => {
        const plainText = content.replace(/<[^>]*>/g, " ").trim();
        const finalTitle = title.trim() || "Untitled Draft";

        return {
            title: finalTitle,
            excerpt: excerpt.trim(),
            content: content,
            coverImage:
                coverImage.trim() ||
                "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
            club: effectiveClub,
            tags: tags.length > 0 ? tags : [effectiveClub],
            date: post?.date || formatDate(),
            readTime: calculateReadTime(plainText),
            thisWeek,
            mustRead,
            editorPick,
            mainStory,
            mediaUrl: mediaUrl.trim() || undefined,
            playerName: playerName.trim() || undefined,
            isDraft,
            poll: usePoll && poll.question.trim() ? poll : undefined,
            matchRatings: useMatchRatings && matchRatings.filter(r => r.playerName.trim()).length > 0 ? matchRatings.filter(r => r.playerName.trim()) : undefined,
            publishAt: publishAt || undefined,
        };
    };

    const clearPendingAutoSave = () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = null;
        }
    };

    const showSavedIndicator = () => {
        setSaveStatus("saved");
        setLastSaved(new Date());
        if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
        saveFeedbackTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000);
    };

    const persistPost = async (mode: "draft" | "publish", isLeaving = false) => {
        await onSave(buildPostPayload(mode === "draft"), isLeaving);
    };

    const handleDraftSave = async (isLeaving = false) => {
        if (submitAction || saveStatus === "saving") return;

        clearPendingAutoSave();
        setSubmitAction(isLeaving ? "back" : "draft");

        try {
            await persistPost("draft", isLeaving);

            if (!isLeaving) {
                showSavedIndicator();
                toast.success(post?.isDraft ? "Draft updated." : "Saved as draft.");
            }
        } catch {
            setSaveStatus("error");
        } finally {
            setSubmitAction(null);
        }
    };

    const handlePublish = async () => {
        if (submitAction || saveStatus === "saving") return;
        if (!validate()) return;

        clearPendingAutoSave();
        setSubmitAction("publish");

        try {
            await persistPost("publish");
        } catch {
            setSaveStatus("error");
            setSubmitAction(null);
        }
    };

    // Auto-save effect
    useEffect(() => {
        // Don't auto-save immediately on mount or if completely empty
        if (!title.trim() && !content.trim()) return;
        if (submitAction || saveStatus === "saving") return;

        setSaveStatus("idle");

        clearPendingAutoSave();

        autoSaveTimerRef.current = setTimeout(() => {
            void (async () => {
                setSaveStatus("saving");

                try {
                    await persistPost("draft");
                    showSavedIndicator();
                } catch {
                    setSaveStatus("error");
                }
            })();
        }, 3000); // 3 seconds debounce

        return () => {
            clearPendingAutoSave();
        };
    }, [
        title, excerpt, content, coverImage, club, category, tags,
        thisWeek, mustRead, editorPick, mainStory, mediaUrl, playerName,
        usePoll, poll, useMatchRatings, matchRatings, publishAt, submitAction
    ]);

    useEffect(() => {
        return () => {
            if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
            clearPendingAutoSave();
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handlePublish();
    };

    const handleBack = async () => {
        if (submitAction) return;

        // If content and title are completely empty, just cancel
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        if (!title.trim() && !cleanContent) {
            onCancel();
            return;
        }

        // Otherwise, flush draft before unmounting
        await handleDraftSave(true);
    };

    const draftButtonLabel = post?.isDraft ? "Update Draft" : "Save as Draft";
    const publishButtonLabel = post && !post.isDraft ? "Update Published" : "Publish Post";
    const draftSubmitLabel = submitAction === "back"
        ? "Saving draft..."
        : submitAction === "draft"
            ? "Saving draft..."
            : "";
    const publishSubmitLabel = submitAction === "publish"
        ? post && !post.isDraft
            ? "Updating post..."
            : "Publishing post..."
        : "";
    const actionInFlightLabel = draftSubmitLabel || publishSubmitLabel;
    const isSubmitting = submitAction !== null;
    const isBusy = isSubmitting || saveStatus === "saving";

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => void handleBack()}
                        disabled={isBusy}
                        className="flex items-center gap-2 text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {/* Auto-save indicator */}
                    <div className="flex items-center justify-center flex-1 mx-4">
                        {isSubmitting && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {actionInFlightLabel}
                            </span>
                        )}
                        {!isSubmitting && saveStatus === "saving" && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Saving draft...
                            </span>
                        )
                        }
                        {
                            saveStatus === "saved" && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Draft saved to cloud
                                </span>
                            )
                        }
                        {
                            saveStatus === "error" && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">
                                    <CloudOff className="w-3.5 h-3.5" />
                                    Disconnected
                                </span>
                            )
                        }
                    </div >

                    <div className="flex items-center gap-3">
                        {/* Copy Preview Link — only for saved drafts */}
                        {post?.isDraft && post?.previewToken && (
                            <button
                                type="button"
                                onClick={() => {
                                    const previewUrl = `${window.location.origin}/post/${post.slug || post.id}?preview=${post.previewToken}`;
                                    navigator.clipboard.writeText(previewUrl);
                                    toast.success("Preview link copied! Share it for feedback.");
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg font-medium text-sm hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all duration-200"
                            >
                                <Link className="w-4 h-4" />
                                Copy Preview Link
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowPreview(true)}
                            disabled={isBusy}
                            className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleDraftSave()}
                            disabled={isBusy}
                            className="px-5 py-1.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitAction === "draft" ? "Saving..." : draftButtonLabel}
                        </button>
                        <button
                            type="button"
                            onClick={() => void handlePublish()}
                            disabled={isBusy}
                            className="px-5 py-1.5 bg-[#16A34A] text-white rounded-lg font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitAction === "publish" ? "Working..." : publishButtonLabel}
                        </button>
                    </div>
                </div >
            </div >

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
                        <button
                            type="button"
                            onClick={async () => {
                                if (!content.trim()) {
                                    toast.error("Write some content first so AI can generate a description.");
                                    return;
                                }
                                toast.loading("Generating meta description...", { id: "meta-gen" });
                                try {
                                    const res = await fetch("/api/ai-generate", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ type: "meta-description", text: content.slice(0, 3000) }),
                                    });
                                    const data = await res.json();
                                    if (data.data) {
                                        setExcerpt(data.data.trim());
                                        toast.success("Meta description generated!", { id: "meta-gen" });
                                    } else {
                                        toast.error(data.error || "Failed", { id: "meta-gen" });
                                    }
                                } catch {
                                    toast.error("AI generation failed", { id: "meta-gen" });
                                }
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                        >
                            🪄 AI Meta Description
                        </button>
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
                                    <img
                                        src={club ? (getClubByName(club)?.logo || "") : ""}
                                        alt=""
                                        className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 object-contain"
                                        style={{ display: club && getClubByName(club)?.logo ? "block" : "none" }}
                                    />
                                    <input
                                        type="text"
                                        value={clubSearch || club}
                                        onChange={(e) => handleClubSearch(e.target.value)}
                                        onFocus={() => { if (clubSearch || club) handleClubSearch(clubSearch || club); }}
                                        placeholder="Search any club in the world..."
                                        className={`w-full ${club && getClubByName(club)?.logo ? 'pl-[4.5rem]' : 'pl-10'} pr-4 py-3 rounded-xl border ${errors.club ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm`}
                                    />
                                    <Loader2
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16A34A] animate-spin"
                                        style={{ display: searchingClubs ? "block" : "none" }}
                                    />
                                </div>

                                {/* Dropdown results */}
                                <div
                                    className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-600 shadow-xl max-h-72 overflow-y-auto"
                                    style={{ display: showClubDropdown && (clubResults.length > 0 || clubSearch.length > 1) ? "block" : "none" }}
                                >
                                    {clubResults.map((result) => (
                                        <div
                                            key={result.name}
                                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 group text-sm"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => selectClub(result)}
                                                className="w-full flex items-center gap-3 text-left flex-1"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={result.logo || ""}
                                                        alt=""
                                                        className="w-5 h-5 object-contain"
                                                        style={{ display: result.logo && !brokenLogos.has(result.logo) ? "block" : "none" }}
                                                        onError={() => {
                                                            setBrokenLogos(prev => new Set(prev).add(result.logo));
                                                        }}
                                                    />
                                                    <span 
                                                        className="text-xs font-bold text-[#64748B]"
                                                        style={{ display: !result.logo || brokenLogos.has(result.logo) ? "block" : "none" }}
                                                    >
                                                        {result.name[0]}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <p className="font-medium text-[#0F172A] dark:text-white truncate">{result.name}</p>
                                                    <p className="text-xs text-[#94A3B8] dark:text-gray-500 truncate">{result.league}</p>
                                                </div>
                                            </button>
                                            {isCustomClub(result.name) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteCustomClub(result.name);
                                                        handleClubSearch(clubSearch || "");
                                                        if (club === result.name) {
                                                            setClub("");
                                                            setCategory("General");
                                                        }
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete custom team"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add Custom Club Button */}
                                    {clubSearch.length > 1 && !clubResults.some(c => c.name.toLowerCase() === clubSearch.toLowerCase()) && (
                                        <button
                                            type="button"
                                            onClick={handleAddCustomClub}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors text-sm border-t border-gray-100 dark:border-gray-700/50"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                <Plus className="w-4 h-4 text-green-600 dark:text-green-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-green-600 dark:text-green-400 truncate">Add "{clubSearch}" as a new team</p>
                                                <p className="text-xs text-green-500/70 truncate">Save this custom team for future posts</p>
                                            </div>
                                        </button>
                                    )}
                                </div>
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

                    {/* Media / YouTube Embed */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                            <Link className="w-4 h-4 text-[#16A34A]" />
                            Media / Embed Link (YouTube, Spotify)
                        </label>
                        <p className="text-xs text-[#64748B] dark:text-gray-400 mb-3">
                            Paste a YouTube or Spotify URL here to automatically embed a playable widget at the bottom of your post.
                        </p>
                        <input
                            type="url"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                        />
                    </div>



                    {/* Player Name (for Player Profile category) */}
                    {(category === "Player Profile" || tags.includes("Player Profile")) && (
                        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                                <User className="w-4 h-4 text-[#16A34A]" />
                                Player Name
                            </label>
                            <p className="text-xs text-[#64748B] dark:text-gray-400 mb-3">
                                Enter the player's full name. This will allow readers to filter by player on the homepage.
                            </p>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="e.g. Erling Haaland"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                            />
                        </div>
                    )}

                    {/* Poll Section */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                                <FileText className="w-4 h-4 text-[#16A34A]" />
                                Interactive Poll
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={usePoll} onChange={(e) => setUsePoll(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#16A34A]/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#16A34A]"></div>
                            </label>
                        </div>

                        {usePoll && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <input
                                        type="text"
                                        value={poll.question}
                                        onChange={(e) => setPoll({ ...poll, question: e.target.value })}
                                        placeholder="Poll Question (e.g. Who will win the title?)"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm mb-3 font-semibold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-[#64748B] dark:text-gray-400">Poll Options</p>
                                    {poll.options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={opt.text}
                                                onChange={(e) => {
                                                    const newOpts = [...poll.options];
                                                    newOpts[idx].text = e.target.value;
                                                    setPoll({ ...poll, options: newOpts });
                                                }}
                                                placeholder={`Option ${idx + 1}`}
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                                            />
                                            {poll.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newOpts = poll.options.filter((_, i) => i !== idx);
                                                        setPoll({ ...poll, options: newOpts });
                                                    }}
                                                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {poll.options.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => setPoll({ ...poll, options: [...poll.options, { text: "", votes: 0 }] })}
                                            className="text-xs font-semibold text-[#16A34A] hover:text-[#15803d] transition-colors mt-2"
                                        >
                                            + Add Option
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interactive Match Ratings Section */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                                <Star className="w-4 h-4 text-[#16A34A]" />
                                Interactive Match Ratings
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={useMatchRatings} onChange={(e) => setUseMatchRatings(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#16A34A]/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#16A34A]"></div>
                            </label>
                        </div>

                        {useMatchRatings && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-[#64748B] dark:text-gray-400 mb-3">
                                    Set your editor ratings out of 10. Fans will be able to submit their own ratings directly on the article!
                                </p>
                                <div className="space-y-2">
                                    {matchRatings.map((rating, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={rating.playerName}
                                                onChange={(e) => {
                                                    const newRatings = [...matchRatings];
                                                    newRatings[idx].playerName = e.target.value;
                                                    setMatchRatings(newRatings);
                                                }}
                                                placeholder="Player Name (e.g. Bukayo Saka)"
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={rating.editorRating}
                                                onChange={(e) => {
                                                    const newRatings = [...matchRatings];
                                                    newRatings[idx].editorRating = Number(e.target.value);
                                                    setMatchRatings(newRatings);
                                                }}
                                                placeholder="Rating (1-10)"
                                                className="w-24 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newRatings = matchRatings.filter((_, i) => i !== idx);
                                                    setMatchRatings(newRatings);
                                                }}
                                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setMatchRatings([...matchRatings, { playerName: "", editorRating: 7 }])}
                                        className="flex items-center gap-1.5 text-sm font-medium text-[#16A34A] hover:text-[#15803d]"
                                    >
                                        <Plus className="w-4 h-4" /> Add Player Rating
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Featured Layout Options */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-2">
                            <Star className="w-4 h-4 text-[#16A34A]" />
                            Featured Layout
                        </label>

                        {/* Featured Layout Segmented Controls */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setThisWeek(!thisWeek)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${thisWeek ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700'}`}
                            >
                                <Flame className="w-3.5 h-3.5" />
                                "This Week"
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setMustRead(!mustRead)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${mustRead ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700'}`}
                            >
                                <Star className="w-3.5 h-3.5" />
                                Must Read Pick
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setEditorPick(!editorPick)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${editorPick ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                            >
                                <Star className="w-3.5 h-3.5" />
                                Editor Pick
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setMainStory(!mainStory)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${mainStory ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'}`}
                            >
                                <Crown className="w-3.5 h-3.5" />
                                Main Story
                            </button>
                        </div>

                        {/* Schedule Publishing */}
                        <div className="flex border-t border-gray-100 dark:border-gray-800 pt-6 flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${publishAt ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white mb-0.5">Schedule Publish</p>
                                    <p className="text-xs text-[#64748B] dark:text-gray-400">
                                        {publishAt
                                            ? `Scheduled for ${new Date(publishAt).toLocaleString()}`
                                            : "Set a future date to auto-publish before matchday."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="datetime-local"
                                    value={publishAt ? new Date(new Date(publishAt).getTime() - new Date(publishAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                                    onChange={(e) => setPublishAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                {publishAt && (
                                    <button
                                        type="button"
                                        onClick={() => setPublishAt("")}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Clear schedule"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rich Text Content */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                        <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                                <FileText className="w-4 h-4 text-[#16A34A]" />
                                Content
                            </label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={handleCopyAsThread}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] text-xs font-semibold rounded-lg hover:opacity-80 transition-opacity"
                                >
                                    {copiedThread ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied Thread</> : <><MessageSquare className="w-3.5 h-3.5" /> Copy as Thread</>}
                                </button>
                                <span className="text-xs font-medium text-[#94A3B8] dark:text-gray-500">
                                    {calculateReadTime(content.replace(/<[^>]*>/g, " "))}
                                </span>
                            </div>
                        </div>
                        <p className="mb-3 text-xs leading-5 text-[#64748B] dark:text-gray-400">
                            Use the <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A] dark:text-[#4ade80]">✦ Editorial Blocks</span> button in the toolbar above to insert timelines, stats cards, quote blocks, key takeaways, comparison tables, and tactical board embeds — they render in both preview and published articles.
                        </p>
                        {errors.content && <p className="text-red-500 text-xs mb-2">{errors.content}</p>}
                        <SpellcheckBar
                            content={content}
                            onFix={(found, replacement) => {
                                // Replace all occurrences (case-sensitive)
                                const re = new RegExp(found.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
                                setContent((prev) => prev.replace(re, replacement));
                            }}
                        />
                        <RichTextEditor content={content} onChange={setContent} existingPosts={getAllPosts()} />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pb-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isBusy}
                            className="px-6 py-2.5 text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleDraftSave()}
                            disabled={isBusy}
                            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitAction === "draft" ? "Saving..." : draftButtonLabel}
                        </button>
                        <button
                            type="submit"
                            disabled={isBusy}
                            className="px-8 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitAction === "publish" ? "Working..." : publishButtonLabel}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Custom Team Logo Modal ── */}
            {showCustomTeamModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">New Team Options</h3>
                            <p className="text-sm text-[#64748B] dark:text-gray-400 mb-6 font-medium">Adding <span className="font-bold text-[#16A34A]">{clubSearch}</span></p>

                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-2">
                                Logo URL <span className="text-xs text-[#94A3B8] font-normal">(Optional)</span>
                            </label>
                            <input
                                type="url"
                                value={customTeamLogoInput}
                                onChange={(e) => setCustomTeamLogoInput(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm mb-6"
                                autoFocus
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowCustomTeamModal(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCustomTeamAdd}
                                    className="px-6 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25"
                                >
                                    Save & Select
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Preview Overlay ── */}
            {
                showPreview && (
                    <div className="fixed inset-0 z-[100] bg-[#F8FAFC] dark:bg-[#0B1120] overflow-y-auto transition-colors duration-300">
                        {/* Preview Top Bar */}
                        <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
                            <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        disabled={isBusy}
                                        className="flex items-center gap-2 text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Editor
                                    </button>
                                    <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                                        Preview Mode
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void handleDraftSave()}
                                        disabled={isBusy}
                                        className="px-5 py-1.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitAction === "draft" ? "Saving..." : draftButtonLabel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handlePublish()}
                                        disabled={isBusy}
                                        className="px-5 py-1.5 bg-[#16A34A] text-white rounded-lg font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {submitAction === "publish" ? "Working..." : publishButtonLabel}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cover Image */}
                        {coverImage && (
                            <div className="w-full h-[400px] md:h-[500px] overflow-hidden relative">
                                <img
                                    src={coverImage}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                        )}

                        {/* Article Content */}
                        <article className="max-w-[720px] mx-auto px-6 py-12">
                            {/* Tags */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${tag === effectiveClub
                                                ? "text-white bg-[#16A34A]"
                                                : "text-[#64748B] dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                                }`}
                                        >
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Title and Meta */}
                            <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mb-4 leading-tight">
                                {title || "Untitled Post"}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 mb-8 text-sm text-[#64748B] dark:text-gray-400">
                                <span>{post?.date || formatDate()}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {calculateReadTime(content.replace(/<[^>]*>/g, " "))}
                                </span>
                            </div>

                            {/* Excerpt */}
                            {excerpt && (
                                <p className="text-lg text-[#64748B] dark:text-gray-400 mb-8 italic border-l-4 border-[#16A34A] pl-4">
                                    {excerpt}
                                </p>
                            )}

                            {/* Article Body */}
                            <div ref={previewContentRef}>
                                <ArticleContentRenderer model={previewArticleModel} />
                            </div>

                            {/* Media Embed */}
                            {mediaUrl && (
                                <div className="mt-12 w-full mx-auto overflow-hidden rounded-2xl flex items-center justify-center p-0 sm:p-2 bg-transparent">
                                    {mediaUrl.includes('spotify.com') ? (
                                        <iframe
                                            style={{ borderRadius: '12px', border: 'none' }}
                                            src={mediaUrl.replace('open.spotify.com', 'open.spotify.com/embed')}
                                            width="100%"
                                            height="152"
                                            allowFullScreen={false}
                                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                            loading="lazy"
                                        />
                                    ) : mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? (
                                        <div className="relative w-full pb-[56.25%] h-0 rounded-xl overflow-hidden shadow-md">
                                            <iframe
                                                className="absolute top-0 left-0 w-full h-full border-none"
                                                src={mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                                                title="YouTube video player"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                referrerPolicy="strict-origin-when-cross-origin"
                                                allowFullScreen
                                            />
                                        </div>
                                    ) : (
                                        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[#16A34A] hover:underline flex items-center gap-2 py-4">
                                            Watch Media Link
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Poll Preview */}
                            {usePoll && poll.question.trim() && (
                                <div className="mt-8">
                                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-gray-800/50">
                                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4 flex items-center gap-2">
                                            📊 {poll.question}
                                        </h3>
                                        <div className="space-y-3">
                                            {poll.options.filter(o => o.text.trim()).map((opt, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-sm font-medium text-[#0F172A] dark:text-white hover:border-[#16A34A] hover:bg-[#16A34A]/5 transition-all cursor-pointer"
                                                >
                                                    {opt.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </article>
                    </div>
                )
            }
        </div >
    );
}
