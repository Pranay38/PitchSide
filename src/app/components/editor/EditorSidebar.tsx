import { ChevronDown, Sparkles } from "lucide-react";
import type { StoryFeature } from "../../data/stories";
import { slugifyStoryValue } from "../../data/stories";

interface EditorSidebarProps {
  draft: StoryFeature;
  updateStory: (updater: (current: StoryFeature) => StoryFeature) => void;
}

export function EditorSidebar({ draft, updateStory }: EditorSidebarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Title, Slug, etc */}
      <label className="block">
        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Title</span>
        <input
          type="text"
          value={draft.title}
          onChange={(e) => updateStory((current) => ({
            ...current,
            title: e.target.value,
            slug: current.title === "New Story" || current.slug.startsWith("story-")
              ? slugifyStoryValue(e.target.value)
              : current.slug,
          }))}
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

      <details className="group md:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#16A34A] dark:text-white">
          Advanced story settings
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="grid gap-4 border-t border-gray-200 p-4 md:grid-cols-2 dark:border-gray-700">
          <label className="block"><span className="mb-2 block text-sm font-medium dark:text-white">Display date</span><input type="text" value={draft.date} onChange={(e) => updateStory((current) => ({ ...current, date: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0F172A] dark:text-white" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium dark:text-white">Theme start</span><input type="text" value={draft.themeFrom} onChange={(e) => updateStory((current) => ({ ...current, themeFrom: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0F172A] dark:text-white" /></label>
          <label className="block"><span className="mb-2 block text-sm font-medium dark:text-white">Theme end</span><input type="text" value={draft.themeTo} onChange={(e) => updateStory((current) => ({ ...current, themeTo: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-[#0F172A] dark:text-white" /></label>
          <div><span className="mb-2 block text-sm font-medium dark:text-white">Last updated</span><p className="rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-[#475569] dark:bg-[#0F172A] dark:text-gray-300">{new Date(draft.updatedAt).toLocaleString()}</p></div>
        </div>
      </details>
    </div>
  );
}
