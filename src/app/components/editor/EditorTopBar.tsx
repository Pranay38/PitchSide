import { ArrowLeft, Loader2, CheckCircle2, CloudOff, Link, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "../../data/posts";

interface EditorTopBarProps {
    handleBack: () => Promise<void> | void;
    isBusy: boolean;
    isSubmitting: boolean;
    actionInFlightLabel: string;
    saveStatus: "idle" | "saving" | "saved" | "error";
    post?: BlogPost | null;
    setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
    setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
    handleDraftSave: () => Promise<void> | void;
    draftButtonLabel: string;
    handlePublish: () => Promise<void> | void;
    publishButtonLabel: string;
    submitAction: string | null;
}

export function EditorTopBar({
    handleBack,
    isBusy,
    isSubmitting,
    actionInFlightLabel,
    saveStatus,
    post,
    setShowPreview,
    setShowHistory,
    handleDraftSave,
    draftButtonLabel,
    handlePublish,
    publishButtonLabel,
    submitAction,
}: EditorTopBarProps) {
    return (
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
                    )}
                    {saveStatus === "saved" && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Draft saved to cloud
                        </span>
                    )}
                    {saveStatus === "error" && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md">
                            <CloudOff className="w-3.5 h-3.5" />
                            Disconnected
                        </span>
                    )}
                </div>

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
                    {post && (
                        <button
                            type="button"
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                            title="Version History"
                        >
                            <Clock className="w-4 h-4" />
                            <span className="hidden sm:inline">History</span>
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
            </div>
        </div>
    );
}
