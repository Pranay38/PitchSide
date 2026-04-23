import { useState } from "react";
import { Plus, Edit3, Trash2, Eye, Copy, BookOpen } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";
import { useNavigate } from "@/lib/router-compat";
import { addStoryAsync, updateStoryAsync, deleteStoryAsync } from "../../lib/storyStorage";
import type { StoryFeature } from "../../data/stories";
import { StoryEditor } from "../StoryEditor";
import { toast } from "sonner";

interface AdminStoriesTabProps {
    stories: StoryFeature[];
    setStories: React.Dispatch<React.SetStateAction<StoryFeature[]>>;
}

export function AdminStoriesTab({
    stories,
    setStories,
}: AdminStoriesTabProps) {
    const navigate = useNavigate();
    const [showStoryEditor, setShowStoryEditor] = useState(false);
    const [editingStory, setEditingStory] = useState<StoryFeature | null>(null);

    const handleCreateStory = () => {
        setEditingStory(null);
        setShowStoryEditor(true);
    };

    const handleEditStory = (story: StoryFeature) => {
        setEditingStory(story);
        setShowStoryEditor(true);
    };

    const handleSaveStory = async (story: StoryFeature) => {
        try {
            let updatedStories;
            if (editingStory) {
                updatedStories = await updateStoryAsync(story);
            } else {
                updatedStories = await addStoryAsync(story);
            }
            setStories(updatedStories);
            setShowStoryEditor(false);
            setEditingStory(null);
            toast.success("Story saved successfully!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save story.");
            throw error;
        }
    };

    const handleDeleteStory = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this story?")) return;
        try {
            const updatedStories = await deleteStoryAsync(id);
            setStories(updatedStories);
            toast.success("Story deleted.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete story.");
        }
    };

    const handleDuplicateStory = async (story: StoryFeature) => {
        try {
            const duplicate = { ...story, id: `story-${Date.now()}`, title: `${story.title} (Copy)`, slug: `${story.slug}-copy-${Date.now()}` };
            const updatedStories = await addStoryAsync(duplicate);
            setStories(updatedStories);
            toast.success("Story duplicated.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to duplicate story.");
        }
    };

    if (showStoryEditor) {
        return (
            <StoryEditor
                story={editingStory}
                onSave={handleSaveStory}
                onCancel={() => { setShowStoryEditor(false); setEditingStory(null); }}
            />
        );
    }

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Scrollytelling Stories</h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        {stories.length} stor{stories.length !== 1 ? "ies" : "y"} total · {stories.filter((story) => !story.isDraft).length} published · {stories.filter((story) => story.isDraft).length} drafts
                    </p>
                </div>
                <button
                    onClick={handleCreateStory}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25"
                >
                    <Plus className="w-4 h-4" />New Story
                </button>
            </div>

            {stories.length === 0 ? (
                <AdminEmptyState
                    icon={BookOpen}
                    title="No stories yet"
                    description="Create your first scrollytelling story with chapters, metrics, and sticky visuals."
                    action={
                        <button
                            onClick={handleCreateStory}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all active:scale-95 shadow-sm mt-2"
                        >
                            <Plus className="w-4 h-4" />Create First Story
                        </button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {stories.map((story) => (
                        <div
                            key={story.id}
                            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr]">
                                <div className="relative min-h-[180px] lg:min-h-full">
                                    <img
                                        src={story.coverImage}
                                        alt={story.title}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <div
                                        className="absolute inset-0 opacity-85"
                                        style={{ background: `linear-gradient(135deg, ${story.themeFrom}bb, ${story.themeTo}88)` }}
                                    />
                                </div>

                                <div className="p-6">
                                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] bg-[#16A34A]/10 text-[#16A34A]">
                                                    {story.eyebrow}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${story.isDraft ? "bg-amber-500/10 text-amber-600 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"}`}>
                                                    {story.isDraft ? "Draft" : "Published"}
                                                </span>
                                                <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">{story.date}</span>
                                                <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">{story.readTime}</span>
                                                <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">
                                                    {story.chapters.length} chapter{story.chapters.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">{story.title}</h2>
                                            <p className="text-sm font-medium text-[#16A34A] mt-2">/{story.slug}</p>
                                            <p className="text-sm text-[#64748B] dark:text-gray-400 mt-4 max-w-3xl">
                                                {story.excerpt}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {story.highlights.slice(0, 4).map((highlight) => (
                                                    <span
                                                        key={`${story.id}-${highlight}`}
                                                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-[#334155] dark:bg-[#0F172A] dark:text-gray-200"
                                                    >
                                                        {highlight}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => navigate(story.isDraft ? `/stories/${story.slug}?preview=1&storyId=${encodeURIComponent(story.id)}` : `/stories/${story.slug}`)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] dark:text-gray-400 transition-colors"
                                                title="View Story"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDuplicateStory(story)}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] dark:text-gray-400 transition-colors"
                                                title="Duplicate Story"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditStory(story)}
                                                className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#64748B] dark:text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Edit Story"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStory(story.id)}
                                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#64748B] dark:text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete Story"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
