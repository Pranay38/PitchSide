import { useState, useEffect, useMemo, useRef } from "react";
import type { BlogPost } from "../data/posts";
import { getAllClubNames, searchClubsOnline, addCustomClub, getClubByName, deleteCustomClub, isCustomClub } from "../data/clubs";
import type { SearchResult } from "../data/clubs";
import { calculateReadTime, formatDate, getAllPosts } from "../lib/postStorage";
import { RichTextEditor } from "./RichTextEditor";
import { ArticleContentRenderer } from "./ArticleContentRenderer";
import { getArticleContentModel } from "../lib/articleModel";
import { ArrowLeft, Image, Tag, FileText, Upload, Link, X, Search, Loader2, Flame, Star, Crown, Activity, User, BarChart3, Users, Eye, Clock, Cloud, CloudOff, CheckCircle2, Plus, Trash2, MessageSquare, CalendarDays, Library } from "lucide-react";
import { PollWidget } from "./PollWidget";
import { scheduleEmbedHydration } from "../lib/embedHydration";
import { toast } from "sonner";
import { SpellcheckBar } from "./admin/SpellcheckBar";
import { InteractiveWidgets } from "./editor/InteractiveWidgets";
import { MetaSettings } from "./editor/MetaSettings";
import { EditorTopBar } from "./editor/EditorTopBar";
import { CoverImageUpload } from "./editor/CoverImageUpload";
import { RichTextCanvas } from "./editor/RichTextCanvas";
import { SeoTools } from "./editor/SeoTools";
import { SidebarSettings } from "./editor/SidebarSettings";
import { VersionHistoryPanel } from "./admin/VersionHistoryPanel";

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



/** Read an image file as a full-quality base64 data URL (no compression) */
function readImageAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) resolve(result);
            else reject(new Error("Failed to read file"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

interface PostEditorProps {
    post?: BlogPost | null;
    allPosts?: BlogPost[];
    onSave: (post: Omit<BlogPost, "id">, isLeaving?: boolean) => Promise<void>;
    onCancel: () => void;
}

export function PostEditor({ post, allPosts, onSave, onCancel }: PostEditorProps) {
    type SubmitAction = "draft" | "publish" | "back";
    const [title, setTitle] = useState(post?.title || "");
    const [format, setFormat] = useState<"article" | "quick-take">(post?.format === "quick-take" ? "quick-take" : "article");
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

    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>(post?.tags || []);
    const [thisWeek, setThisWeek] = useState(post?.thisWeek || false);
    const [mustRead, setMustRead] = useState(post?.mustRead || false);
    const [editorPick, setEditorPick] = useState(post?.editorPick || false);
    const [mainStory, setMainStory] = useState(post?.mainStory || false);
    const [mediaUrl, setMediaUrl] = useState(post?.mediaUrl || "");
    const [audioUrl, setAudioUrl] = useState(post?.audioUrl || "");
    const [playerName, setPlayerName] = useState(post?.playerName || "");
    const [poll, setPoll] = useState(post?.poll || { question: "", options: [{ text: "", votes: 0 }, { text: "", votes: 0 }] });
    const [usePoll, setUsePoll] = useState(!!post?.poll);
    const [hotTakes, setHotTakes] = useState<{id: string; statement: string}[]>(post?.hotTakes || []);
    const [useHotTakes, setUseHotTakes] = useState(!!(post?.hotTakes && post.hotTakes.length > 0));
    const [armchairRatings, setArmchairRatings] = useState<{name: string; position: string; authorRating: number; imageUrl?: string}[]>(post?.armchairRatings || []);
    const [useArmchairRatings, setUseArmchairRatings] = useState(!!(post?.armchairRatings && post.armchairRatings.length > 0));
    const [seriesName, setSeriesName] = useState(post?.seriesName || "");
    const [seriesOrder, setSeriesOrder] = useState<number | "">(post?.seriesOrder ?? "");
    const [publishAt, setPublishAt] = useState(post?.publishAt || "");
    const [relatedPostIds, setRelatedPostIds] = useState<string[]>(post?.relatedPostIds || []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const previewContentRef = useRef<HTMLDivElement | null>(null);

    const [copiedThread, setCopiedThread] = useState(false);

    // Auto-save state
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [submitAction, setSubmitAction] = useState<SubmitAction | null>(null);
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewArticleModel = useMemo(() => getArticleContentModel(content), [content]);



    useEffect(() => {
        if (!showPreview || !content) return;
        return scheduleEmbedHydration(previewContentRef.current);
    }, [showPreview, content]);

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        setUploading(true);
        try {
            const dataUrl = await readImageAsDataURL(file);
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
            format,
            coverImage:
                coverImage.trim() ||
                "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
            club: club,
            tags: tags.length > 0 ? tags : [club],
            date: post?.date || formatDate(),
            readTime: calculateReadTime(plainText),
            thisWeek,
            mustRead,
            editorPick,
            mainStory,
            mediaUrl: mediaUrl.trim() || undefined,
            audioUrl: audioUrl.trim() || undefined,
            playerName: playerName.trim() || undefined,
            isDraft,
            poll: usePoll && poll.question.trim() ? poll : undefined,
            hotTakes: useHotTakes && hotTakes.filter(t => t.statement.trim()).length > 0 ? hotTakes.filter(t => t.statement.trim()) : undefined,
            armchairRatings: useArmchairRatings && armchairRatings.filter(r => r.name.trim() && r.authorRating > 0).length > 0 ? armchairRatings.filter(r => r.name.trim() && r.authorRating > 0) : undefined,
            seriesName: seriesName.trim() || undefined,
            seriesOrder: seriesOrder === "" ? undefined : seriesOrder,
            publishAt: publishAt || undefined,
            relatedPostIds: relatedPostIds.length > 0 ? relatedPostIds : undefined,
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
        thisWeek, mustRead, editorPick, mainStory, mediaUrl, audioUrl, playerName,
        usePoll, poll, seriesName, seriesOrder, publishAt, relatedPostIds, submitAction
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
    const publishButtonLabel = post && !post.isDraft ? "Update Published" : (publishAt ? "Schedule" : "Publish Post");
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
            <EditorTopBar
                handleBack={handleBack}
                isBusy={isBusy}
                isSubmitting={isSubmitting}
                actionInFlightLabel={actionInFlightLabel}
                saveStatus={saveStatus}
                post={post}
                setShowPreview={setShowPreview}
                setShowHistory={setShowHistory}
                handleDraftSave={handleDraftSave}
                draftButtonLabel={draftButtonLabel}
                handlePublish={handlePublish}
                publishButtonLabel={publishButtonLabel}
                submitAction={submitAction}
            />

            <div className="max-w-[1200px] mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-6">


                            <RichTextCanvas
                                title={title}
                                setTitle={setTitle}
                                format={format}
                                setFormat={setFormat}
                                content={content}
                                setContent={setContent}
                                errors={errors}
                                handleCopyAsThread={handleCopyAsThread}
                                copiedThread={copiedThread}
                            />
                        </div>

                        {/* Sidebar Settings */}
                        <div className="lg:col-span-1">
                            <SidebarSettings>
                                <CoverImageUpload
                                    imageMode={imageMode}
                                    setImageMode={setImageMode}
                                    coverImage={coverImage}
                                    setCoverImage={setCoverImage}
                                    uploading={uploading}
                                    dragOver={dragOver}
                                    setDragOver={setDragOver}
                                    handleFileUpload={handleFileUpload}
                                    handleDrop={handleDrop}
                                    fileInputRef={fileInputRef}
                                />

                                <SeoTools
                                    excerpt={excerpt}
                                    setExcerpt={setExcerpt}
                                    content={content}
                                    errors={errors}
                                />

                                <MetaSettings
                                    category={category}
                                    setCategory={setCategory}
                                    club={club}
                                    setClub={setClub}
                                    tagInput={tagInput}
                                    setTagInput={setTagInput}
                                    tags={tags}
                                    setTags={setTags}
                                    mediaUrl={mediaUrl}
                                    setMediaUrl={setMediaUrl}
                                    audioUrl={audioUrl}
                                    setAudioUrl={setAudioUrl}
                                    playerName={playerName}
                                    setPlayerName={setPlayerName}
                                    seriesName={seriesName}
                                    setSeriesName={setSeriesName}
                                    seriesOrder={seriesOrder}
                                    setSeriesOrder={setSeriesOrder}
                                    thisWeek={thisWeek}
                                    setThisWeek={setThisWeek}
                                    mustRead={mustRead}
                                    setMustRead={setMustRead}
                                    editorPick={editorPick}
                                    setEditorPick={setEditorPick}
                                    mainStory={mainStory}
                                    setMainStory={setMainStory}
                                    publishAt={publishAt}
                                    setPublishAt={setPublishAt}
                                    relatedPostIds={relatedPostIds}
                                    setRelatedPostIds={setRelatedPostIds}
                                    allPosts={allPosts || []}
                                    currentPostId={post?.id}
                                    errors={errors}
                                />

                                <InteractiveWidgets
                                    usePoll={usePoll}
                                    setUsePoll={setUsePoll}
                                    poll={poll}
                                    setPoll={setPoll}
                                    useHotTakes={useHotTakes}
                                    setUseHotTakes={setUseHotTakes}
                                    hotTakes={hotTakes}
                                    setHotTakes={setHotTakes}
                                    useArmchairRatings={useArmchairRatings}
                                    setUseArmchairRatings={setUseArmchairRatings}
                                    armchairRatings={armchairRatings}
                                    setArmchairRatings={setArmchairRatings}
                                />
                            </SidebarSettings>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pb-8 mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
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
                                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${tag === club
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

            {showHistory && post && (
                <VersionHistoryPanel 
                    postId={post.id} 
                    onClose={() => setShowHistory(false)} 
                    onRestore={() => {
                        window.location.reload();
                    }} 
                />
            )}
        </div >
    );
}
