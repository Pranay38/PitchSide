import { Repeat2, Trash2 } from "lucide-react";
import { getAllClubNames } from "../../data/clubs";
const clubOptions = getAllClubNames().sort((left, right) => left.localeCompare(right));
import type { TransferWatchEntry, TransferFeeMode, TransferWatchStatus } from "../../data/transferWatch";

interface AdminTransferWatchTabProps {
    siteSettings: any;
    transferDraft: any;
    transferFilterClub: string;
    filteredTransferWatchEntries: TransferWatchEntry[];
    savingTransferWatch: boolean;
    setTransferDraft: React.Dispatch<React.SetStateAction<any>>;
    setTransferFilterClub: (club: string) => void;
    handleAddTransferWatchEntry: () => void;
    handleSaveTransferWatch: () => Promise<void>;
    handleDeleteTransferWatchEntry: (id: string) => void;
    formatTransferWatchAmount: (entry: TransferWatchEntry) => string;
}

export function AdminTransferWatchTab({
    siteSettings,
    transferDraft,
    transferFilterClub,
    filteredTransferWatchEntries,
    savingTransferWatch,
    setTransferDraft,
    setTransferFilterClub,
    handleAddTransferWatchEntry,
    handleSaveTransferWatch,
    handleDeleteTransferWatchEntry,
    formatTransferWatchAmount
}: AdminTransferWatchTabProps) {
    return (
        <div className="space-y-8">
            <section className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <Repeat2 className="w-5 h-5 text-[#16A34A]" /> Transfer Watch
                        </h1>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2 max-w-2xl">
                            Add simple club-linked transfer items here. Each entry needs only the player name, club, fee, and whether it is a confirmed move or a rumor.
                        </p>
                    </div>
                    <div className="rounded-xl bg-[#16A34A]/5 border border-[#16A34A]/10 px-4 py-3 text-sm text-[#0F172A] dark:text-white">
                        <strong className="text-[#16A34A]">{siteSettings.transferWatch.length}</strong> transfer watch item{siteSettings.transferWatch.length !== 1 ? "s" : ""} in the manual feed
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-8">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="block md:col-span-2">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Player Name</span>
                                <input
                                    type="text"
                                    value={transferDraft.player}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, player: e.target.value }))}
                                    placeholder="Victor Osimhen"
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Club</span>
                                <select
                                    value={transferDraft.club}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, club: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                >
                                    {clubOptions.map((club) => (
                                        <option key={club} value={club}>{club}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Status</span>
                                <select
                                    value={transferDraft.status}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, status: e.target.value as TransferWatchStatus }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                >
                                    <option value="rumor">Rumor</option>
                                    <option value="confirmed">Confirmed</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Fee Format</span>
                                <select
                                    value={transferDraft.feeMode}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, feeMode: e.target.value as TransferFeeMode }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                >
                                    <option value="million-usd">Million USD</option>
                                    <option value="not-disclosed">Not disclosed</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Fee Amount</span>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={transferDraft.feeMillions}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, feeMillions: e.target.value }))}
                                    disabled={transferDraft.feeMode === "not-disclosed"}
                                    placeholder={transferDraft.feeMode === "not-disclosed" ? "Not disclosed" : "45"}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] disabled:opacity-50"
                                />
                            </label>
                            <label className="block lg:col-span-2">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Reliability Tier</span>
                                <select
                                    value={transferDraft.tier || 3}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, tier: Number(e.target.value) }))}
                                    disabled={transferDraft.status === "confirmed"}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] disabled:opacity-50"
                                >
                                    <option value={1}>Tier 1 (Fabrizio, Ornstein - Incredible)</option>
                                    <option value={2}>Tier 2 (Reliable Local Journalists)</option>
                                    <option value={3}>Tier 3 (Mainstream/Mixed Relentless)</option>
                                    <option value={4}>Tier 4 (Aggregators, Tabloids)</option>
                                    <option value={5}>Tier 5 (Unreliable/Banter)</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleAddTransferWatchEntry}
                                className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]"
                            >
                                Add To Transfer Watch
                            </button>
                            <button
                                onClick={handleSaveTransferWatch}
                                disabled={savingTransferWatch}
                                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#0F172A] dark:text-white rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                {savingTransferWatch ? "Saving..." : "Save Transfer Watch"}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-1">Preview Feed</p>
                                <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">What lands on club pages</h2>
                            </div>
                            <select
                                value={transferFilterClub}
                                onChange={(e) => setTransferFilterClub(e.target.value)}
                                className="w-full sm:w-[220px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E293B] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                            >
                                <option value="all">All clubs</option>
                                {clubOptions.map((club) => (
                                    <option key={club} value={club}>{club}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            {filteredTransferWatchEntries.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-8 text-center text-sm text-[#64748B] dark:text-gray-400">
                                    No manual transfer watch items yet.
                                </div>
                            ) : (
                                filteredTransferWatchEntries.map((entry) => (
                                    <div key={entry.id} className="rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-[#0F172A] dark:text-white">{entry.player}</p>
                                                <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
                                                    {entry.club} · {formatTransferWatchAmount(entry)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${entry.status === "confirmed"
                                                    ? "bg-[#16A34A]/10 text-[#16A34A]"
                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                    }`}>
                                                    {entry.status}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteTransferWatchEntry(entry.id)}
                                                    className="p-1.5 rounded-lg text-[#64748B] dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                                    title="Delete entry"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[11px] uppercase tracking-wider text-[#94A3B8] mt-3">
                                            Updated {new Date(entry.updatedAt).toLocaleString()}
                                        </p>
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
