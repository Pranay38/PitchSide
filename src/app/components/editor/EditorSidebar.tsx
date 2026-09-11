import { Sparkles, Upload, X } from "lucide-react";
import type { StoryFeature } from "../../data/stories";
import { slugifyStoryValue } from "../../data/stories";
import type { Dispatch, SetStateAction } from "react";

interface EditorSidebarProps {
  draft: StoryFeature;
  updateStory: (updater: (current: StoryFeature) => StoryFeature) => void;
  coverUploading: boolean;
  handleCoverUpload: (file: File) => Promise<void>;
}

export function EditorSidebar({ draft, updateStory, coverUploading, handleCoverUpload }: EditorSidebarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Title, Slug, etc */}
      <label className="block">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Title</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateStory((current) => ({ ...current, title: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Slug</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => updateStory((current) => ({ ...current, slug: slugifyStoryValue(e.target.value) }))}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
          <button
            type="button"
            onClick={() => updateStory((current) => ({ ...current, slug: slugifyStoryValue(current.title) }))}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Generate slug from title"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Eyebrow</span>
        <input
          type="text"
          value={draft.eyebrow}
          onChange={(e) => updateStory((current) => ({ ...current, eyebrow: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Read Time</span>
        <input
          type="text"
          value={draft.readTime}
          onChange={(e) => updateStory((current) => ({ ...current, readTime: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>

      <label className="block md:col-span-2">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Subtitle</span>
        <input
          type="text"
          value={draft.subtitle}
          onChange={(e) => updateStory((current) => ({ ...current, subtitle: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>

      <label className="block md:col-span-2">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Excerpt</span>
        <textarea
          value={draft.excerpt}
          onChange={(e) => updateStory((current) => ({ ...current, excerpt: e.target.value }))}
          rows={3}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Date</span>
        <input
          type="text"
          value={draft.date}
          onChange={(e) => updateStory((current) => ({ ...current, date: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Last Updated</span>
        <input
          type="text"
          value={new Date(draft.updatedAt).toLocaleString()}
          readOnly
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#64748B] dark:text-gray-400"
        />
      </label>
      
      <label className="block md:col-span-2">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Theme From</span>
        <input
          type="text"
          value={draft.themeFrom}
          onChange={(e) => updateStory((current) => ({ ...current, themeFrom: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>

      <label className="block md:col-span-2">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Theme To</span>
        <input
          type="text"
          value={draft.themeTo}
          onChange={(e) => updateStory((current) => ({ ...current, themeTo: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
        />
      </label>
    </div>
  );
}
