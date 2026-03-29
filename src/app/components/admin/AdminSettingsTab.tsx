import type { Dispatch, SetStateAction } from "react";
import { Mail, Send, BarChart3, RadioTower, Layout, Trash2, Sparkles } from "lucide-react";
import { PollWidget } from "../PollWidget";
import type { BlogPost } from "../../data/posts";
import type { StoryFeature } from "../../data/stories";
import type { ClubIntelligence, ClubIntelligenceSummary } from "../../lib/clubIntelligence";
import type { SiteSettings } from "../../lib/siteSettingsStorage";
import { getTransferTierLabel } from "../../lib/transferWatch";

interface AdminSettingsTabProps {
    siteSettings: SiteSettings;
    posts: BlogPost[];
    stories: StoryFeature[];
    subscriberCount: number;
    sendingDigest: boolean;
    savingPollOfWeek: boolean;
    savingSiteSettings: boolean;
    savingClubIntelligence: boolean;
    selectedClubForInsights: string;
    selectedClubInsight: ClubIntelligence;
    selectedClubInsightSummary: ClubIntelligenceSummary;
    setSiteSettings: Dispatch<SetStateAction<SiteSettings>>;
    clubOptions: string[];
    handleSendDigest: () => Promise<void>;
    handlePollFieldChange: (field: "enabled" | "title" | "description" | "question", value: string | boolean) => void;
    handleAddPollOption: () => void;
    handlePollOptionChange: (index: number, value: string) => void;
    handleRemovePollOption: (index: number) => void;
    handleSavePollOfWeek: () => Promise<void>;
    handleResetPollDraft: () => void;
    handleSaveSocialWall: () => Promise<void>;
    handleSaveHomepageCuration: () => Promise<void>;
    setSelectedClubForInsights: (club: string) => void;
    handleClubInsightChange: (key: keyof ClubIntelligence, value: string | number) => void;
    handleSaveClubIntelligence: () => Promise<void>;
    handleResetClubInsight: () => void;
    normalizePollOfWeek: (poll: SiteSettings["pollOfWeek"]) => SiteSettings["pollOfWeek"];
}

function toggleSelection(values: string[], id: string, max: number): string[] {
    if (!id) return values;
    if (values.includes(id)) {
        return values.filter((value) => value !== id);
    }
    if (values.length >= max) {
        return values;
    }
    return [...values, id];
}

function SelectionCard({
    title,
    meta,
    description,
    selectedIndex,
    onClick,
}: {
    title: string;
    meta: string;
    description: string;
    selectedIndex: number;
    onClick: () => void;
}) {
    const selected = selectedIndex >= 0;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${
                selected
                    ? "border-[#16A34A]/30 bg-[#16A34A]/8 shadow-sm"
                    : "border-gray-200 bg-white hover:border-[#16A34A]/20 hover:bg-[#F8FAFC] dark:border-gray-800 dark:bg-[#0F172A] dark:hover:bg-[#08111f]"
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">{title}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#16A34A]">{meta}</p>
                </div>
                <span
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-black ${
                        selected
                            ? "bg-[#16A34A] text-white"
                            : "bg-gray-100 text-[#94A3B8] dark:bg-white/5"
                    }`}
                >
                    {selected ? selectedIndex + 1 : "+"}
                </span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">
                {description}
            </p>
        </button>
    );
}

export function AdminSettingsTab({
    siteSettings,
    posts,
    stories,
    subscriberCount,
    sendingDigest,
    savingPollOfWeek,
    savingSiteSettings,
    savingClubIntelligence,
    selectedClubForInsights,
    selectedClubInsight,
    selectedClubInsightSummary,
    setSiteSettings,
    clubOptions,
    handleSendDigest,
    handlePollFieldChange,
    handleAddPollOption,
    handlePollOptionChange,
    handleRemovePollOption,
    handleSavePollOfWeek,
    handleResetPollDraft,
    handleSaveSocialWall,
    handleSaveHomepageCuration,
    setSelectedClubForInsights,
    handleClubInsightChange,
    handleSaveClubIntelligence,
    handleResetClubInsight,
    normalizePollOfWeek,
}: AdminSettingsTabProps) {
    const publishedPosts = posts.filter((post) => !post.isDraft);
    const publishedStories = stories.filter((story) => !story.isDraft);
    const heroItems = siteSettings.homepageCuration.hero.type === "story" ? publishedStories : publishedPosts;

    return (
        <div className="space-y-8">
            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#16A34A]" /> Homepage Curation
                        </h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1 max-w-3xl">
                            Control the homepage hero and editorial lanes directly from admin. If a selected item disappears from the published feed, the homepage falls back automatically.
                        </p>
                    </div>
                    <button
                        onClick={handleSaveHomepageCuration}
                        disabled={savingSiteSettings}
                        className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] disabled:opacity-50"
                    >
                        {savingSiteSettings ? "Saving..." : "Save Homepage"}
                    </button>
                </div>

                <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
                    <div className="space-y-5">
                        <div className="rounded-[1.5rem] border border-gray-200 dark:border-gray-800 p-5">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#16A34A] mb-3">Hero Slot</p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Hero Type</span>
                                    <select
                                        value={siteSettings.homepageCuration.hero.type}
                                        onChange={(event) => {
                                            const type = event.target.value === "story" ? "story" : "post";
                                            setSiteSettings((prev) => ({
                                                ...prev,
                                                homepageCuration: {
                                                    ...prev.homepageCuration,
                                                    hero: { type, id: "" },
                                                },
                                            }));
                                        }}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                    >
                                        <option value="post">Article</option>
                                        <option value="story">Story</option>
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Hero Selection</span>
                                    <select
                                        value={siteSettings.homepageCuration.hero.id}
                                        onChange={(event) => setSiteSettings((prev) => ({
                                            ...prev,
                                            homepageCuration: {
                                                ...prev.homepageCuration,
                                                hero: {
                                                    ...prev.homepageCuration.hero,
                                                    id: event.target.value,
                                                },
                                            },
                                        }))}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                    >
                                        <option value="">Automatic fallback</option>
                                        {heroItems.map((item) => (
                                            <option key={item.id} value={item.id}>{item.title}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="mt-4 rounded-[1.25rem] bg-[#F8FAFC] dark:bg-[#08111f] p-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                                    Current Hero
                                </p>
                                <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-white">
                                    {heroItems.find((item) => item.id === siteSettings.homepageCuration.hero.id)?.title || "Automatic homepage pick"}
                                </p>
                                <p className="mt-2 text-sm text-[#64748B] dark:text-gray-400">
                                    {siteSettings.homepageCuration.hero.type === "story"
                                        ? "Uses the selected longform story as the front-page lead."
                                        : "Uses the selected article as the front-page lead."}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-gray-200 dark:border-gray-800 p-5">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#16A34A] mb-3">Selection Summary</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[1.25rem] bg-[#F8FAFC] dark:bg-[#08111f] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Latest Analysis</p>
                                    <p className="mt-2 text-2xl font-black text-[#0F172A] dark:text-white">{siteSettings.homepageCuration.latestPostIds.length}</p>
                                </div>

                                <div className="rounded-[1.25rem] bg-[#F8FAFC] dark:bg-[#08111f] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Featured Stories</p>
                                    <p className="mt-2 text-2xl font-black text-[#0F172A] dark:text-white">{siteSettings.homepageCuration.featuredStoryIds.length}</p>
                                </div>
                                <div className="rounded-[1.25rem] bg-[#F8FAFC] dark:bg-[#08111f] p-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Transfer Spotlights</p>
                                    <p className="mt-2 text-2xl font-black text-[#0F172A] dark:text-white">{siteSettings.homepageCuration.transferSpotlightIds.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[1.5rem] border border-gray-200 dark:border-gray-800 p-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Lane One</p>
                                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Latest Analysis</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSiteSettings((prev) => ({
                                        ...prev,
                                        homepageCuration: { ...prev.homepageCuration, latestPostIds: [] },
                                    }))}
                                    className="text-sm font-medium text-[#64748B] hover:text-[#16A34A]"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                {publishedPosts.map((post) => (
                                    <SelectionCard
                                        key={post.id}
                                        title={post.title}
                                        meta={`${post.club} · ${post.readTime}`}
                                        description={post.excerpt}
                                        selectedIndex={siteSettings.homepageCuration.latestPostIds.indexOf(post.id)}
                                        onClick={() => setSiteSettings((prev) => ({
                                            ...prev,
                                            homepageCuration: {
                                                ...prev.homepageCuration,
                                                latestPostIds: toggleSelection(prev.homepageCuration.latestPostIds, post.id, 6),
                                            },
                                        }))}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="rounded-[1.5rem] border border-gray-200 dark:border-gray-800 p-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Lane Two</p>
                                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Featured Stories</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSiteSettings((prev) => ({
                                        ...prev,
                                        homepageCuration: { ...prev.homepageCuration, featuredStoryIds: [] },
                                    }))}
                                    className="text-sm font-medium text-[#64748B] hover:text-[#16A34A]"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                {publishedStories.map((story) => (
                                    <SelectionCard
                                        key={story.id}
                                        title={story.title}
                                        meta={`${story.eyebrow} · ${story.readTime}`}
                                        description={story.excerpt}
                                        selectedIndex={siteSettings.homepageCuration.featuredStoryIds.indexOf(story.id)}
                                        onClick={() => setSiteSettings((prev) => ({
                                            ...prev,
                                            homepageCuration: {
                                                ...prev.homepageCuration,
                                                featuredStoryIds: toggleSelection(prev.homepageCuration.featuredStoryIds, story.id, 3),
                                            },
                                        }))}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-gray-200 dark:border-gray-800 p-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">Lane Three</p>
                                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Transfer Spotlights</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSiteSettings((prev) => ({
                                        ...prev,
                                        homepageCuration: { ...prev.homepageCuration, transferSpotlightIds: [] },
                                    }))}
                                    className="text-sm font-medium text-[#64748B] hover:text-[#16A34A]"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="grid max-h-[24rem] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                {siteSettings.transferWatch.map((entry) => (
                                    <SelectionCard
                                        key={entry.id}
                                        title={`${entry.player} to ${entry.club}`}
                                        meta={`${entry.status === "confirmed" ? "Confirmed" : getTransferTierLabel(entry.tier, entry.status)} · ${entry.updatedAt.slice(0, 10)}`}
                                        description="Shows as a dossier-led transfer spotlight on the homepage."
                                        selectedIndex={siteSettings.homepageCuration.transferSpotlightIds.indexOf(entry.id)}
                                        onClick={() => setSiteSettings((prev) => ({
                                            ...prev,
                                            homepageCuration: {
                                                ...prev.homepageCuration,
                                                transferSpotlightIds: toggleSelection(prev.homepageCuration.transferSpotlightIds, entry.id, 2),
                                            },
                                        }))}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-[#16A34A]" /> Newsletter & Digest
                    </h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mb-4 max-w-lg">
                        You have <strong className="text-[#16A34A]">{subscriberCount} subscribers</strong>. The weekly digest triggers automatically via Vercel Cron. You can also send the digest right now to test it.
                    </p>
                    <button onClick={handleSendDigest} disabled={sendingDigest} className="px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all disabled:opacity-50 flex gap-2 items-center">
                        <Send className="w-4 h-4" /> {sendingDigest ? "Sending..." : "Send Digest Manually"}
                    </button>
                </div>
            </section>

            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#16A34A]" /> Poll Of The Week
                        </h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1 max-w-2xl">
                            Create one exclusive homepage poll here. Publishing a new poll resets the vote counts so each weekly question starts fresh.
                        </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm font-medium text-[#0F172A] dark:text-white">Published</span>
                        <input
                            type="checkbox"
                            checked={siteSettings.pollOfWeek.enabled}
                            onChange={(e) => handlePollFieldChange("enabled", e.target.checked)}
                            className="h-4 w-4 accent-[#16A34A]"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.05fr] gap-8">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 gap-4">
                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Widget Title</span>
                                <input
                                    type="text"
                                    value={siteSettings.pollOfWeek.title}
                                    onChange={(e) => handlePollFieldChange("title", e.target.value)}
                                    placeholder="Poll of the Week"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Question</span>
                                <textarea
                                    value={siteSettings.pollOfWeek.question}
                                    onChange={(e) => handlePollFieldChange("question", e.target.value)}
                                    rows={3}
                                    placeholder="Who has the strongest title run-in right now?"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Short Description</span>
                                <textarea
                                    value={siteSettings.pollOfWeek.description}
                                    onChange={(e) => handlePollFieldChange("description", e.target.value)}
                                    rows={2}
                                    placeholder="A quick weekly prompt to get readers interacting before they dive into the rest of the homepage."
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>
                        </div>

                        <div>
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <span className="text-sm font-medium text-[#0F172A] dark:text-white">Answer Options</span>
                                <button
                                    type="button"
                                    onClick={handleAddPollOption}
                                    disabled={siteSettings.pollOfWeek.options.length >= 5}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-[#0F172A] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Add Option
                                </button>
                            </div>
                            <div className="space-y-3">
                                {siteSettings.pollOfWeek.options.map((option, index) => (
                                    <div key={option.id || index} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-black flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePollOption(index)}
                                            disabled={siteSettings.pollOfWeek.options.length <= 2}
                                            className="p-2 rounded-lg text-[#64748B] dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:opacity-40"
                                            title="Remove option"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-300">
                            Publishing a new poll replaces the current live poll and starts every option back at zero votes.
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleSavePollOfWeek}
                                disabled={savingPollOfWeek}
                                className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] disabled:opacity-50"
                            >
                                {savingPollOfWeek ? "Saving..." : "Publish Poll Of The Week"}
                            </button>
                            <button
                                type="button"
                                onClick={handleResetPollDraft}
                                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Clear Draft
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-2">Homepage Preview</p>
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">How the weekly poll will look</h3>
                        <PollWidget
                            pollId={siteSettings.pollOfWeek.id || "poll-preview"}
                            poll={normalizePollOfWeek(siteSettings.pollOfWeek)}
                            title={siteSettings.pollOfWeek.title || "Poll of the Week"}
                            description={siteSettings.pollOfWeek.description}
                            className="my-0"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <RadioTower className="w-5 h-5 text-[#16A34A]" /> Social Wall
                        </h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                            Paste Curator.io or Tagembed code to show a live social feed in your homepage sidebar.
                        </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <span className="text-sm font-medium text-[#0F172A] dark:text-white">Enabled</span>
                        <input
                            type="checkbox"
                            checked={siteSettings.socialWallEnabled}
                            onChange={(e) => setSiteSettings((prev) => ({ ...prev, socialWallEnabled: e.target.checked }))}
                            className="h-4 w-4 accent-[#16A34A]"
                        />
                    </label>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Section Title</label>
                        <input
                            type="text"
                            value={siteSettings.socialWallTitle}
                            onChange={(e) => setSiteSettings((prev) => ({ ...prev, socialWallTitle: e.target.value }))}
                            placeholder="Social Wall"
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Embed Snippet</label>
                        <textarea
                            value={siteSettings.socialWallEmbedCode}
                            onChange={(e) => setSiteSettings((prev) => ({ ...prev, socialWallEmbedCode: e.target.value }))}
                            rows={4}
                            placeholder="<div class='tagembed-widget' ...></div><script src='...'></script>"
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-xs font-mono text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleSaveSocialWall} disabled={savingSiteSettings} className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] disabled:opacity-50">
                            {savingSiteSettings ? "Saving..." : "Save Social Wall"}
                        </button>
                    </div>
                </div>
            </section>

            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <Layout className="w-5 h-5 text-[#16A34A]" /> My Club Intelligence
                        </h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1 max-w-2xl">
                            Enter raw team stats you can copy from FBref. The My Club page will calculate the style snapshot and summary profile from those values.
                        </p>
                    </div>
                    <div className="text-right text-xs text-[#94A3B8]">
                        {selectedClubInsight.updatedAt
                            ? `Updated ${new Date(selectedClubInsight.updatedAt).toLocaleString()}`
                            : "No manual update yet"}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Club</label>
                    <select
                        value={selectedClubForInsights}
                        onChange={(e) => setSelectedClubForInsights(e.target.value)}
                        className="w-full sm:w-[320px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    >
                        {clubOptions.map((club) => (
                            <option key={club} value={club}>{club}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-8">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-[#16A34A] mb-4">FBref Inputs</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { key: "xGPer90", label: "xG / 90", step: "0.01" },
                                    { key: "xGAPer90", label: "xGA / 90", step: "0.01" },
                                    { key: "shotsOnTargetPer90", label: "Shots on Target / 90", step: "0.01" },
                                    { key: "keyPassesPer90", label: "Key Passes / 90", step: "0.01" },
                                    { key: "progressivePassesPer90", label: "Progressive Passes / 90", step: "0.01" },
                                    { key: "progressiveCarriesPer90", label: "Progressive Carries / 90", step: "0.01" },
                                    { key: "possessionPct", label: "Possession %", step: "0.1" },
                                    { key: "tacklesWonPer90", label: "Tackles Won / 90", step: "0.01" },
                                    { key: "interceptionsPer90", label: "Interceptions / 90", step: "0.01" },
                                    { key: "aerialWinPct", label: "Aerial Duel Win %", step: "0.1" },
                                ].map((field: any) => (
                                    <label key={field.key} className="block">
                                        <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">{field.label}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={field.step}
                                            value={selectedClubInsight[field.key as keyof ClubIntelligence] as number}
                                            onChange={(e) => handleClubInsightChange(field.key as keyof ClubIntelligence, e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Editorial Note</label>
                            <textarea
                                value={selectedClubInsight.note}
                                onChange={(e) => handleClubInsightChange("note", e.target.value)}
                                rows={4}
                                placeholder="Add your own summary of the club's state, tactical direction, or key warning signs."
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleSaveClubIntelligence}
                                disabled={savingClubIntelligence}
                                className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] disabled:opacity-50"
                            >
                                {savingClubIntelligence ? "Saving..." : "Save Club Intelligence"}
                            </button>
                            <button
                                onClick={handleResetClubInsight}
                                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Reset This Club
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 p-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-3">Calculated Preview</p>
                        <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-4">{selectedClubForInsights}</h3>

                        <div className="flex flex-wrap gap-2 mb-5">
                            {selectedClubInsightSummary.styleTags.map((tag) => (
                                <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#16A34A]/10 text-[#16A34A]">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-4 mb-6">
                            {selectedClubInsightSummary.styleBars.map((bar) => (
                                <div key={bar.label}>
                                    <div className="flex items-center justify-between text-xs font-semibold text-[#475569] dark:text-gray-300 mb-1">
                                        <span>{bar.label}</span>
                                        <span>{bar.value}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                        <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${bar.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                                { label: "Attack", value: selectedClubInsightSummary.attackIndex },
                                { label: "Control", value: selectedClubInsightSummary.controlIndex },
                                { label: "Defense", value: selectedClubInsightSummary.defensiveIndex },
                                { label: "Overall", value: selectedClubInsightSummary.overallScore },
                            ].map((metric) => (
                                <div key={metric.label} className="rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-[#94A3B8]">{metric.label}</p>
                                    <p className="text-2xl font-black text-[#0F172A] dark:text-white mt-1">{metric.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-xl border border-[#16A34A]/15 bg-[#16A34A]/5 p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-1">Summary Label</p>
                            <p className="text-lg font-bold text-[#0F172A] dark:text-white">{selectedClubInsightSummary.overallLabel}</p>
                            {selectedClubInsight.note && (
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-3">{selectedClubInsight.note}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
