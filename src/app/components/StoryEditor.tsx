import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, Eye, Home, Plus, Save, Sparkles, Trash2, Upload, X } from "lucide-react";
import {
  createStoryFromTemplate,
  createEmptyStoryBar,
  createEmptyStoryChapter,
  createEmptyStoryFeature,
  createEmptyStoryMetric,
  formatStoryDate,
  storyTemplates,
  slugifyStoryValue,
  type StoryFeature,
} from "../data/stories";
import { normalizeStoryFeature, saveStoryPreview } from "../lib/storyStorage";
import { RichTextEditor } from "./RichTextEditor";
import { EditorSidebar } from "./editor/EditorSidebar";

function compressImage(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", quality));
      };
      img.onerror = reject;
      img.src = String(event.target?.result || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface StorySaveOptions {
  mode: "autosave" | "draft" | "publish";
  featureAsHero?: boolean;
}

interface StoryEditorProps {
  story?: StoryFeature | null;
  onSave: (story: StoryFeature, options: StorySaveOptions) => Promise<void> | void;
  onCancel: () => void;
}

export function StoryEditor({ story, onSave, onCancel }: StoryEditorProps) {
  const [draft, setDraft] = useState<StoryFeature>(() => normalizeStoryFeature(story || createEmptyStoryFeature()));
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [chapterUploading, setChapterUploading] = useState<Record<string, boolean>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [featureAsHero, setFeatureAsHero] = useState(false);
  const [published, setPublished] = useState(false);
  const revisionRef = useRef(0);

  useEffect(() => {
    setDraft(normalizeStoryFeature(story || createEmptyStoryFeature()));
    setDirty(false);
    setPublished(false);
  }, [story?.id]);

  const updateStory = (updater: (current: StoryFeature) => StoryFeature) => {
    setDraft((current) => updater(current));
    revisionRef.current += 1;
    setDirty(true);
    setAutoSaveStatus("idle");
  };

  const updateChapter = (
    chapterId: string,
    updater: (chapter: StoryFeature["chapters"][number]) => StoryFeature["chapters"][number],
  ) => {
    updateStory((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) => (
        chapter.id === chapterId ? updater(chapter) : chapter
      )),
    }));
  };

  const moveChapter = (chapterId: string, direction: "up" | "down") => {
    updateStory((current) => {
      const chapters = [...current.chapters];
      const index = chapters.findIndex((chapter) => chapter.id === chapterId);
      if (index === -1) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= chapters.length) return current;
      [chapters[index], chapters[targetIndex]] = [chapters[targetIndex], chapters[index]];
      return { ...current, chapters };
    });
  };

  const calculatedReadTime = useMemo(() => {
    const words = draft.chapters.reduce((total, chapter) => {
      const text = chapter.body.join(" ").replace(/<[^>]*>/g, " ").trim();
      return total + text.split(/\s+/).filter(Boolean).length;
    }, 0);
    return `${Math.max(1, Math.ceil(words / 200))} min scroll`;
  }, [draft.chapters]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!draft.title.trim() || draft.title.trim() === "New Story") errors.push("Add a story title.");
    if (!draft.slug.trim()) errors.push("Add a URL slug.");
    if (!draft.excerpt.trim() || draft.excerpt.startsWith("Summarize the story")) errors.push("Write a homepage excerpt.");
    if (!draft.coverImage.trim()) errors.push("Add a cover image.");
    const completeChapter = draft.chapters.some((chapter) => {
      const body = chapter.body.join(" ").replace(/<[^>]*>/g, " ").trim();
      return chapter.title.trim() && chapter.title !== "New Chapter" && body && body !== "Write this chapter here.";
    });
    if (!completeChapter) errors.push("Complete at least one chapter.");
    return errors;
  }, [draft]);

  const prepareStory = (overrides?: Partial<StoryFeature>): StoryFeature => normalizeStoryFeature({
    ...draft,
    readTime: calculatedReadTime,
    ...overrides,
    updatedAt: new Date().toISOString(),
  });

  const handleSave = async (mode: "draft" | "publish") => {
    if (mode === "publish" && validationErrors.length > 0) {
      setCurrentStep(2);
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const prepared = prepareStory({
        isDraft: mode === "publish" ? false : draft.isDraft,
        publishedAt: mode === "publish" ? (draft.publishedAt || now) : draft.publishedAt,
        date: mode === "publish" && !draft.publishedAt ? formatStoryDate() : draft.date,
      });
      await onSave(prepared, { mode, featureAsHero: mode === "publish" && featureAsHero });
      setDraft(prepared);
      setDirty(false);
      setAutoSaveStatus("saved");
      if (mode === "publish") setPublished(true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!dirty || saving || draft.title.trim() === "New Story") return;
    const revision = revisionRef.current;
    const timeout = window.setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        await onSave(prepareStory(), { mode: "autosave" });
        if (revisionRef.current === revision) setDirty(false);
        setAutoSaveStatus("saved");
      } catch {
        setAutoSaveStatus("error");
      }
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [dirty, draft, saving, onSave]);

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const previewStory = prepareStory();
      saveStoryPreview(previewStory);
      window.open(
        `/stories/${previewStory.slug}?preview=1&storyId=${encodeURIComponent(previewStory.id)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setPreviewing(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setCoverUploading(true);
    try {
      const dataUrl = await compressImage(file);
      updateStory((current) => ({ ...current, coverImage: dataUrl }));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleChapterImageUpload = async (chapterId: string, file: File) => {
    if (!file.type.startsWith("image/")) return;
    setChapterUploading((current) => ({ ...current, [chapterId]: true }));
    try {
      const dataUrl = await compressImage(file);
      updateChapter(chapterId, (chapter) => ({
        ...chapter,
        image: {
          ...chapter.image,
          src: dataUrl,
          alt: chapter.image?.alt || chapter.title,
        },
      }));
    } finally {
      setChapterUploading((current) => ({ ...current, [chapterId]: false }));
    }
  };

  const applyTemplate = (templateId: string) => {
    if (!templateId) return;

    const template = storyTemplates.find((item) => item.id === templateId);
    if (!template) return;

    const shouldReplace = draft.title === "New Story"
      && draft.chapters.length === 1
      && draft.chapters[0]?.title === "New Chapter"
      ? true
      : window.confirm(`Apply the ${template.name} template? This will replace the current story draft in the editor.`);

    if (!shouldReplace) return;

    const nextTemplateStory = createStoryFromTemplate(template.id);
    updateStory(() => normalizeStoryFeature({
      ...nextTemplateStory,
      id: draft.id || nextTemplateStory.id,
      isDraft: true,
    }));
    setSelectedTemplateId(templateId);
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-40 -mx-2 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-gray-800 dark:bg-[#0F172A]/95 sm:mx-0">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">Story Editor</p>
          <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">
            {story ? "Edit scrollytelling story" : "Create scrollytelling story"}
          </h2>
          <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2 max-w-2xl">
            Build longform stories with publish control, preview mode, chapter images, and scroll-reactive sections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[120px] text-xs font-semibold text-[#475569] dark:text-gray-300" aria-live="polite">
            {autoSaveStatus === "saving" && "Saving…"}
            {autoSaveStatus === "saved" && <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300"><Check className="h-3.5 w-3.5" /> Saved</span>}
            {autoSaveStatus === "error" && <span className="inline-flex items-center gap-1 text-red-600"><AlertCircle className="h-3.5 w-3.5" /> Autosave failed</span>}
            {autoSaveStatus === "idle" && (dirty ? "Unsaved changes" : "All changes saved")}
          </div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-[#0F172A] transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            <Eye className="w-4 h-4" />
            {previewing ? "Opening..." : "Preview"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-[#475569] transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Back to stories
          </button>
          <button
            type="button"
            onClick={() => void handleSave("draft")}
            disabled={saving}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : draft.isDraft ? "Save draft" : "Save changes"}
          </button>
        </div>
        </div>
        <nav className="mt-5 grid grid-cols-3 gap-2" aria-label="Story creation steps">
          {["Essentials", "Chapters", "Review & publish"].map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setCurrentStep(index)}
              aria-current={currentStep === index ? "step" : undefined}
              className={`min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] sm:text-sm ${currentStep === index ? "border-[#16A34A] bg-[#16A34A]/10 text-[#15803d] dark:text-[#86efac]" : "border-gray-200 bg-white text-[#475569] hover:border-[#16A34A]/40 dark:border-gray-700 dark:bg-[#1E293B] dark:text-gray-300"}`}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-current/10">{index + 1}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {currentStep === 0 && (
      <>
      <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">Story Templates</p>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Start from a proven narrative shape</h3>
            <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2 max-w-2xl">
              Apply a preset for timelines, tactical explainers, transfer sagas, or season recaps and then rewrite the copy for your story.
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-[#0F172A] px-4 py-3 text-sm text-[#475569] dark:text-gray-300">
            Current template: <span className="font-bold text-[#16A34A]">{selectedTemplateId || "Custom draft"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {storyTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template.id)}
              className="text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] p-4 hover:border-[#16A34A]/40 hover:shadow-lg hover:shadow-[#16A34A]/5 transition-all"
            >
              <div className="w-10 h-1.5 rounded-full mb-4" style={{ backgroundColor: template.accent }} />
              <h4 className="text-base font-bold text-[#0F172A] dark:text-white">{template.name}</h4>
              <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2 leading-6">{template.description}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#16A34A] mt-4">Apply template</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
        <EditorSidebar 
          draft={draft}
          updateStory={updateStory}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Cover Image URL</span>
            <input
              type="text"
              value={draft.coverImage.startsWith("data:") ? "" : draft.coverImage}
              onChange={(e) => updateStory((current) => ({ ...current, coverImage: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </label>

          <div className="md:col-span-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-white">Cover Image Upload</p>
                <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">Upload from device if you do not want to paste a URL.</p>
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-[#0F172A] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <Upload className="w-4 h-4" />
                {coverUploading ? "Uploading..." : "Upload Cover"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCoverUpload(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {draft.coverImage && (
            <div className="md:col-span-2 relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <img src={draft.coverImage} alt={draft.title} className="w-full h-56 object-cover" />
              <button
                type="button"
                onClick={() => updateStory((current) => ({ ...current, coverImage: "" }))}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm font-medium text-[#0F172A] dark:text-white">Landing Highlights</span>
            <button
              type="button"
              onClick={() => updateStory((current) => ({ ...current, highlights: [...current.highlights, "New highlight"] }))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-[#16A34A] hover:bg-[#16A34A]/5"
            >
              <Plus className="w-4 h-4" />
              Add highlight
            </button>
          </div>
          <div className="space-y-2">
            {draft.highlights.map((highlight, index) => (
              <div key={`${highlight}-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => updateStory((current) => ({
                    ...current,
                    highlights: current.highlights.map((item, itemIndex) => itemIndex === index ? e.target.value : item),
                  }))}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
                <button
                  type="button"
                  onClick={() => updateStory((current) => ({
                    ...current,
                    highlights: current.highlights.filter((_, itemIndex) => itemIndex !== index),
                  }))}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:bg-[#16A34A] dark:hover:bg-[#15803d]">
          Continue to chapters <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      </>
      )}

      {currentStep === 1 && (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Chapters</h3>
            <p className="text-sm text-[#64748B] dark:text-gray-400">Each chapter becomes one scrollytelling stop.</p>
          </div>
          <button
            type="button"
            onClick={() => updateStory((current) => ({ ...current, chapters: [...current.chapters, createEmptyStoryChapter()] }))}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]"
          >
            <Plus className="w-4 h-4" />
            Add chapter
          </button>
        </div>

        {draft.chapters.map((chapter, chapterIndex) => (
          <div key={chapter.id} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">Chapter {chapterIndex + 1}</p>
                <h4 className="text-xl font-bold text-[#0F172A] dark:text-white">{chapter.title}</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveChapter(chapter.id, "up")}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveChapter(chapter.id, "down")}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateStory((current) => ({
                    ...current,
                    chapters: current.chapters.filter((item) => item.id !== chapter.id),
                  }))}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Kicker</span>
                <input
                  type="text"
                  value={chapter.kicker}
                  onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, kicker: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Title</span>
                <input
                  type="text"
                  value={chapter.title}
                  onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, title: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </label>
              <label className="block md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-sm font-medium text-[#0F172A] dark:text-white">Body Paragraphs</span>
                </div>
                {chapter.body.length > 1 || (chapter.body.length === 1 && !chapter.body[0].startsWith("<")) ? (
                    <div className="mb-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-xl text-sm border border-amber-200 dark:border-amber-800">
                      This chapter was created with the old text area format. Your changes below will be converted to rich text.
                    </div>
                ) : null}
                <RichTextEditor
                  content={chapter.body.join("\n\n")}
                  onChange={(html) => updateChapter(chapter.id, (current) => ({
                    ...current,
                    body: [html],
                  }))}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Takeaway</span>
                <textarea
                  value={chapter.takeaway}
                  onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, takeaway: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h5 className="text-sm font-black uppercase tracking-[0.18em] text-[#16A34A]">Chapter Image</h5>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-[#0F172A] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {chapterUploading[chapter.id] ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleChapterImageUpload(chapter.id, file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <input
                type="text"
                value={chapter.image?.src?.startsWith("data:") ? "" : chapter.image?.src || ""}
                onChange={(e) => updateChapter(chapter.id, (current) => ({
                  ...current,
                  image: {
                    src: e.target.value,
                    alt: current.image?.alt || "",
                    caption: current.image?.caption,
                  },
                }))}
                placeholder="Image URL"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={chapter.image?.alt || ""}
                  onChange={(e) => updateChapter(chapter.id, (current) => ({
                    ...current,
                    image: {
                      src: current.image?.src || "",
                      alt: e.target.value,
                      caption: current.image?.caption,
                    },
                  }))}
                  placeholder="Alt text"
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
                <input
                  type="text"
                  value={chapter.image?.caption || ""}
                  onChange={(e) => updateChapter(chapter.id, (current) => ({
                    ...current,
                    image: {
                      src: current.image?.src || "",
                      alt: current.image?.alt || "",
                      caption: e.target.value,
                    },
                  }))}
                  placeholder="Caption"
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
              {chapter.image?.src && (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <img src={chapter.image.src} alt={chapter.image.alt || chapter.title} className="w-full h-56 object-cover" />
                  <button
                    type="button"
                    onClick={() => updateChapter(chapter.id, (current) => ({
                      ...current,
                      image: { src: "", alt: "", caption: "" },
                    }))}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <details className="group rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#0F172A]">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#16A34A] dark:text-white">
                Advanced chapter tools
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="space-y-5 border-t border-gray-200 p-5 dark:border-gray-800">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#0F172A] dark:text-white">Pull quote</span>
                  <input
                    type="text"
                    value={chapter.pullQuote || ""}
                    onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, pullQuote: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A] dark:border-gray-700 dark:bg-[#1E293B] dark:text-white"
                  />
                </label>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h5 className="text-sm font-black uppercase tracking-[0.18em] text-[#16A34A]">Metrics</h5>
                  <button
                    type="button"
                    onClick={() => updateChapter(chapter.id, (current) => ({
                      ...current,
                      metrics: [...current.metrics, createEmptyStoryMetric()],
                    }))}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-[#16A34A] hover:bg-[#16A34A]/5"
                  >
                    <Plus className="w-4 h-4" />
                    Add metric
                  </button>
                </div>
                <div className="space-y-3">
                  {chapter.metrics.map((metric, metricIndex) => (
                    <div key={`${chapter.id}-metric-${metricIndex}`} className="rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={metric.label}
                          onChange={(e) => updateChapter(chapter.id, (current) => ({
                            ...current,
                            metrics: current.metrics.map((item, itemIndex) => itemIndex === metricIndex ? { ...item, label: e.target.value } : item),
                          }))}
                          placeholder="Label"
                          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                        />
                        <input
                          type="text"
                          value={metric.value}
                          onChange={(e) => updateChapter(chapter.id, (current) => ({
                            ...current,
                            metrics: current.metrics.map((item, itemIndex) => itemIndex === metricIndex ? { ...item, value: e.target.value } : item),
                          }))}
                          placeholder="Value"
                          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={metric.hint || ""}
                          onChange={(e) => updateChapter(chapter.id, (current) => ({
                            ...current,
                            metrics: current.metrics.map((item, itemIndex) => itemIndex === metricIndex ? { ...item, hint: e.target.value } : item),
                          }))}
                          placeholder="Hint"
                          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                        />
                        <button
                          type="button"
                          onClick={() => updateChapter(chapter.id, (current) => ({
                            ...current,
                            metrics: current.metrics.filter((_, itemIndex) => itemIndex !== metricIndex),
                          }))}
                          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 p-5 space-y-4">
                <h5 className="text-sm font-black uppercase tracking-[0.18em] text-[#16A34A]">Sticky Visual</h5>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    value={chapter.visual.eyebrow}
                    onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, visual: { ...current.visual, eyebrow: e.target.value } }))}
                    placeholder="Visual eyebrow"
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                  <input
                    type="text"
                    value={chapter.visual.headline}
                    onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, visual: { ...current.visual, headline: e.target.value } }))}
                    placeholder="Visual headline"
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                  <textarea
                    value={chapter.visual.subheadline}
                    onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, visual: { ...current.visual, subheadline: e.target.value } }))}
                    rows={3}
                    placeholder="Visual subheadline"
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={chapter.visual.primaryValue}
                      onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, visual: { ...current.visual, primaryValue: e.target.value } }))}
                      placeholder="Primary value"
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    />
                    <input
                      type="text"
                      value={chapter.visual.primaryLabel}
                      onChange={(e) => updateChapter(chapter.id, (current) => ({ ...current, visual: { ...current.visual, primaryLabel: e.target.value } }))}
                      placeholder="Primary label"
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[#0F172A] dark:text-white">Bars</span>
                      <button
                        type="button"
                        onClick={() => updateChapter(chapter.id, (current) => ({
                          ...current,
                          visual: {
                            ...current.visual,
                            bars: [...current.visual.bars, createEmptyStoryBar()],
                          },
                        }))}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-[#16A34A] hover:bg-[#16A34A]/5"
                      >
                        <Plus className="w-4 h-4" />
                        Add bar
                      </button>
                    </div>
                    {chapter.visual.bars.map((bar, barIndex) => (
                      <div key={`${chapter.id}-bar-${barIndex}`} className="flex gap-2">
                        <input
                          type="text"
                          value={bar.label}
                          onChange={(e) => updateChapter(chapter.id, (current) => ({
                            ...current,
                            visual: {
                              ...current.visual,
                              bars: current.visual.bars.map((item, itemIndex) => itemIndex === barIndex ? { ...item, label: e.target.value } : item),
                            },
                          }))}
                          placeholder="Bar label"
                          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={bar.value}
                          onChange={(e) => updateChapter(chapter.id, (current) => ({
                            ...current,
                            visual: {
                              ...current.visual,
                              bars: current.visual.bars.map((item, itemIndex) => itemIndex === barIndex ? { ...item, value: Number(e.target.value) } : item),
                            },
                          }))}
                          className="w-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                        />
                        <button
                          type="button"
                          onClick={() => updateChapter(chapter.id, (current) => ({
                            ...current,
                            visual: {
                              ...current.visual,
                              bars: current.visual.bars.filter((_, itemIndex) => itemIndex !== barIndex),
                            },
                          }))}
                          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
              </div>
            </details>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setCurrentStep(0)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-[#475569] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" /> Essentials
          </button>
          <button type="button" onClick={() => setCurrentStep(2)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:bg-[#16A34A] dark:hover:bg-[#15803d]">
            Review story <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
      )}

      {currentStep === 2 && (
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1E293B]">
            <div className="relative h-64 bg-[#0F172A]">
              {draft.coverImage && <img src={draft.coverImage} alt={draft.title} className="h-full w-full object-cover opacity-70" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#86efac]">{draft.eyebrow}</p>
                <h3 className="mt-2 text-3xl font-black font-outfit">{draft.title}</h3>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <p className="text-base font-semibold text-[#16A34A]">{draft.subtitle}</p>
              <p className="leading-7 text-[#475569] dark:text-gray-300">{draft.excerpt}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-[#0F172A]"><p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Read time</p><p className="mt-2 font-bold dark:text-white">{calculatedReadTime}</p></div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-[#0F172A]"><p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Chapters</p><p className="mt-2 font-bold dark:text-white">{draft.chapters.length}</p></div>
                <div className="rounded-xl bg-gray-50 p-4 dark:bg-[#0F172A]"><p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">URL</p><p className="mt-2 truncate font-bold text-[#16A34A]">/{draft.slug}</p></div>
              </div>
            </div>
          </div>

          <aside className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#1E293B]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#16A34A]">Ready check</p>
              <h3 className="mt-2 text-xl font-bold text-[#0F172A] dark:text-white">Review and publish</h3>
            </div>
            {validationErrors.length > 0 ? (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" /> Finish these items</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {validationErrors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div><p className="font-bold">Ready to publish</p><p className="mt-1 text-sm">This story will appear in Latest Stories on the homepage.</p></div>
              </div>
            )}
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
              <input type="checkbox" checked={featureAsHero} onChange={(event) => setFeatureAsHero(event.target.checked)} className="mt-1 h-4 w-4 accent-[#16A34A]" />
              <span><span className="flex items-center gap-2 font-bold text-[#0F172A] dark:text-white"><Home className="h-4 w-4 text-[#16A34A]" /> Make homepage hero</span><span className="mt-1 block text-sm text-[#475569] dark:text-gray-400">Optional. This replaces the current homepage lead.</span></span>
            </label>
            <button type="button" onClick={() => void handleSave("publish")} disabled={saving || validationErrors.length > 0} className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 font-bold text-white transition-colors duration-200 hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <CheckCircle2 className="h-5 w-5" /> {saving ? "Publishing…" : draft.isDraft ? "Publish story" : "Update published story"}
            </button>
            {published && (
              <div aria-live="polite" className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <p className="font-bold text-emerald-900 dark:text-emerald-100">Story published successfully.</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`/stories/${draft.slug}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0F172A] px-3 py-2 text-sm font-bold text-white"><Eye className="h-4 w-4" /> View story</a>
                  <a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-bold text-emerald-900 dark:text-emerald-100"><Home className="h-4 w-4" /> View homepage</a>
                </div>
              </div>
            )}
            <button type="button" onClick={() => setCurrentStep(1)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold text-[#475569] hover:text-[#16A34A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:text-gray-300"><ArrowLeft className="h-4 w-4" /> Back to chapters</button>
          </aside>
        </section>
      )}
    </div>
  );
}
