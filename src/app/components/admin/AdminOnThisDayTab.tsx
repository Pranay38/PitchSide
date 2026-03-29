import { Trash2, CalendarDays } from "lucide-react";
import type { SupplementalEvent } from "../../data/supplementalEvents";
import { AdminEmptyState } from "./AdminEmptyState";

interface AdminOnThisDayTabProps {
    siteSettings: any;
    eventDraft: any;
    savingSupplementalEvent: boolean;
    setEventDraft: React.Dispatch<React.SetStateAction<any>>;
    handleAddSupplementalEvent: () => void;
    handleSaveSupplementalEvents: () => Promise<void>;
    handleDeleteSupplementalEvent: (id: string) => void;
}

export function AdminOnThisDayTab({
    siteSettings,
    eventDraft,
    savingSupplementalEvent,
    setEventDraft,
    handleAddSupplementalEvent,
    handleSaveSupplementalEvents,
    handleDeleteSupplementalEvent
}: AdminOnThisDayTabProps) {
    return (
        <div className="space-y-8">
            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            📅 On This Day (Overrides)
                        </h1>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2 max-w-2xl">
                            The widget automatically fetches data from Wikipedia every day. Use this tab <strong>ONLY</strong> to manually inject major football events that Wikipedia consistently misses on specific dates (e.g., Fabrice Muamba collapse on 03-17).
                        </p>
                    </div>
                    <div className="rounded-xl bg-[#16A34A]/5 border border-[#16A34A]/10 px-4 py-3 text-sm text-[#0F172A] dark:text-white">
                        <strong className="text-[#16A34A]">{siteSettings.supplementalEvents?.length || 0}</strong> manual events saved
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-8">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Filter Date (MM-DD)</span>
                                <input
                                    type="text"
                                    value={eventDraft.dateMMDD}
                                    onChange={(e) => setEventDraft((prev: any) => ({ ...prev, dateMMDD: e.target.value }))}
                                    placeholder="e.g. 03-17"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm font-mono text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Year</span>
                                <input
                                    type="number"
                                    value={eventDraft.year}
                                    onChange={(e) => setEventDraft((prev: any) => ({ ...prev, year: Number(e.target.value) }))}
                                    placeholder="e.g. 2012"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>
                            <label className="block md:col-span-2">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Event Text</span>
                                <textarea
                                    value={eventDraft.text}
                                    onChange={(e) => setEventDraft((prev: any) => ({ ...prev, text: e.target.value }))}
                                    rows={3}
                                    placeholder="During an FA Cup quarter-final..."
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Category</span>
                                <select
                                    value={eventDraft.category}
                                    onChange={(e) => setEventDraft((prev: any) => ({ ...prev, category: e.target.value as SupplementalEvent["category"] }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                >
                                    <option value="event">Event ⚽</option>
                                    <option value="birthday">Birthday 🎂</option>
                                    <option value="death">Death 🕊️</option>
                                    <option value="selected">Selected Highlight ⭐</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Wikipedia Article URL (optional)</span>
                                <input
                                    type="text"
                                    value={eventDraft.articleUrl}
                                    onChange={(e) => setEventDraft((prev: any) => ({ ...prev, articleUrl: e.target.value }))}
                                    placeholder="https://en.wikipedia.org/..."
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>
                            <label className="block md:col-span-2">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Direct Thumbnail Image URL (optional)</span>
                                <input
                                    type="text"
                                    value={eventDraft.thumbnail}
                                    onChange={(e) => setEventDraft((prev: any) => ({ ...prev, thumbnail: e.target.value }))}
                                    placeholder="https://upload.wikimedia.org/..."
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleAddSupplementalEvent}
                                className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]"
                            >
                                Add To Manual Events
                            </button>
                            <button
                                onClick={handleSaveSupplementalEvents}
                                disabled={savingSupplementalEvent}
                                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                {savingSupplementalEvent ? "Saving..." : "Save Events to Database"}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 p-5 max-h-[600px] overflow-y-auto">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-4">Saved Overrides</p>
                        
                        <div className="space-y-3">
                            {(!siteSettings.supplementalEvents || siteSettings.supplementalEvents.length === 0) ? (
                                <AdminEmptyState
                                    icon={CalendarDays}
                                    title="No manual overrides injected yet"
                                    description="Events added here will override or supplement the automated Wikipedia feed for the specified date."
                                />
                            ) : (
                                siteSettings.supplementalEvents.map((evt: any) => (
                                    <div key={evt.id} className="rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                        {evt.dateMMDD}
                                                    </span>
                                                    <span className="font-bold text-[#0F172A] dark:text-white">{evt.year}</span>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-[#16A34A] bg-[#16A34A]/10">
                                                        {evt.category}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#0F172A] dark:text-white line-clamp-3">{evt.text}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSupplementalEvent(evt.id)}
                                                className="p-1.5 rounded-lg text-[#64748B] dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 flex-shrink-0"
                                                title="Delete event"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
