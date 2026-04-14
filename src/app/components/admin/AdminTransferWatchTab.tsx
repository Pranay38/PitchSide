import { useState, useRef } from "react";
import { Repeat2, Trash2, Sparkles, LoaderCircle, Edit3, ImagePlus, X, TrendingUp } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";
import { toast } from "sonner";
import { getAllClubNames, getClubByName, addCustomClub } from "../../data/clubs";
import { getTransferTierLabel, type TransferWatchEntry, type TransferFeeMode, type TransferWatchStatus } from "../../lib/transferWatch";

interface AdminTransferWatchTabProps {
    siteSettings: any;
    transferDraft: any;
    transferFilterClub: string;
    filteredTransferWatchEntries: TransferWatchEntry[];
    savingTransferWatch: boolean;
    setTransferDraft: React.Dispatch<React.SetStateAction<any>>;
    setTransferFilterClub: (club: string) => void;
    handleAddTransferWatchEntry: () => void;
    handleEditTransferWatchEntry: (entry: TransferWatchEntry) => void;
    handleCancelTransferWatchEdit: () => void;
    handleSaveTransferWatch: () => Promise<void>;
    handleDeleteTransferWatchEntry: (id: string) => void;
    formatTransferWatchAmount: (entry: TransferWatchEntry) => string;
    transferEditId: string | null;
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
    handleEditTransferWatchEntry,
    handleCancelTransferWatchEdit,
    handleSaveTransferWatch,
    handleDeleteTransferWatchEntry,
    formatTransferWatchAmount,
    transferEditId
}: AdminTransferWatchTabProps) {
    const [generatingLine, setGeneratingLine] = useState(false);
    const [isCustomClub, setIsCustomClub] = useState(false);
    const [isCustomFromClub, setIsCustomFromClub] = useState(false);
    const [customClubLogo, setCustomClubLogo] = useState("");
    const [customFromClubLogo, setCustomFromClubLogo] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const compressImage = (file: File, maxWidth = 900, quality = 0.75): Promise<string> => {
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
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        setUploadingImage(true);
        try {
            const dataUrl = await compressImage(file);
            setTransferDraft((prev: any) => ({ ...prev, playerImageUrl: dataUrl }));
            toast.success("Image attached successfully!");
        } catch {
            toast.error("Failed to process image");
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const baseClubOptions = getAllClubNames().sort((left, right) => left.localeCompare(right));
    const clubOptions = [...baseClubOptions, "Other..."];

    const handleGeneratePunchyLine = async () => {
        if (!transferDraft.player || !transferDraft.club) {
            toast.error("Enter a player and club first.");
            return;
        }
        setGeneratingLine(true);
        try {
            const res = await fetch("/api/ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "rumour-rater",
                    player: transferDraft.player,
                    club: transferDraft.club,
                    fee: transferDraft.feeMode === "not-disclosed" ? "undisclosed" : `$${transferDraft.feeMillions}m`,
                    tier: transferDraft.tier || 3,
                }),
            });
            const data = await res.json();
            if (data.data) {
                setTransferDraft((prev: any) => ({ ...prev, punchyLine: data.data.trim() }));
                toast.success("Punchy line generated!");
            } else {
                toast.error(data.error || "AI generation failed.");
            }
        } catch {
            toast.error("AI generation failed.");
        } finally {
            setGeneratingLine(false);
        }
    };

    const handleEditClick = (entry: TransferWatchEntry) => {
        if (!baseClubOptions.includes(entry.club)) {
            setIsCustomClub(true);
            setCustomClubLogo(getClubByName(entry.club)?.logo || "");
        } else {
            setIsCustomClub(false);
        }
        if (entry.fromClub && !baseClubOptions.includes(entry.fromClub)) {
            setIsCustomFromClub(true);
            setCustomFromClubLogo(getClubByName(entry.fromClub)?.logo || "");
        } else {
            setIsCustomFromClub(false);
        }
        handleEditTransferWatchEntry(entry);
    };

    const handleAddClick = () => {
        // Validation check for empty clubs
        if (!transferDraft.club || (!isCustomFromClub && !transferDraft.fromClub && transferDraft.fromClub !== "")) {
            toast.error("Both 'From Club' and 'Club' are required.");
            return;
        }
        
        // Persist custom clubs if specified
        if (isCustomFromClub && transferDraft.fromClub) {
            addCustomClub({ name: transferDraft.fromClub, league: "Unknown", logo: customFromClubLogo });
        }
        if (isCustomClub && transferDraft.club) {
            addCustomClub({ name: transferDraft.club, league: "Unknown", logo: customClubLogo });
        }

        handleAddTransferWatchEntry();
        // Reset custom states after a successful add
        setIsCustomClub(false);
        setIsCustomFromClub(false);
        setCustomClubLogo("");
        setCustomFromClubLogo("");
    };

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
                            <div className="md:col-span-2 flex items-start gap-4">
                                <label className="block flex-1">
                                    <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Player Name</span>
                                    <input
                                        type="text"
                                        value={transferDraft.player}
                                        onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, player: e.target.value }))}
                                        placeholder="Victor Osimhen"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                    />
                                </label>
                                <div className="flex-shrink-0">
                                    <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Player Photo</label>
                                    <div className="flex items-center gap-2">
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-11 h-11 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center cursor-pointer hover:border-[#16A34A] overflow-hidden relative group"
                                        >
                                            {uploadingImage ? (
                                                <LoaderCircle className="w-5 h-5 text-gray-400 animate-spin" />
                                            ) : transferDraft.playerImageUrl ? (
                                                <>
                                                    <img src={transferDraft.playerImageUrl} alt="Player" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit3 className="w-4 h-4 text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-[#16A34A] transition-colors" />
                                            )}
                                        </div>
                                        {transferDraft.playerImageUrl && (
                                            <button 
                                                onClick={() => {
                                                    setTransferDraft((prev: any) => ({ ...prev, playerImageUrl: "" }));
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleImageUpload} 
                                            accept="image/*" 
                                            className="hidden" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">From Club</span>
                                {!isCustomFromClub ? (
                                    <select
                                        value={baseClubOptions.includes(transferDraft.fromClub) ? transferDraft.fromClub : transferDraft.fromClub ? "Other..." : ""}
                                        onChange={(e) => {
                                            if (e.target.value === "Other...") {
                                                setIsCustomFromClub(true);
                                                setTransferDraft((prev: any) => ({ ...prev, fromClub: "" }));
                                            } else {
                                                setTransferDraft((prev: any) => ({ ...prev, fromClub: e.target.value }));
                                            }
                                        }}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                    >
                                        <option value="" disabled>Select club</option>
                                        {clubOptions.map((club) => (
                                            <option key={club} value={club}>{club}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="space-y-2 mt-2 flex items-center gap-2">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={transferDraft.fromClub}
                                                onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, fromClub: e.target.value }))}
                                                placeholder="Custom club name..."
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                                autoFocus
                                            />
                                            <input
                                                type="text"
                                                value={customFromClubLogo}
                                                onChange={(e) => setCustomFromClubLogo(e.target.value)}
                                                placeholder="Logo URL (optional)..."
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {customFromClubLogo && (
                                                <div className="w-10 h-10 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center p-1">
                                                    <img src={customFromClubLogo} alt="Preview" className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                            <button onClick={() => { setIsCustomFromClub(false); setTransferDraft((prev: any) => ({ ...prev, fromClub: "" })); setCustomFromClubLogo(""); }} className="text-xs text-gray-500 hover:text-gray-700 self-center">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">To Club (Destination)</span>
                                {!isCustomClub ? (
                                    <select
                                        value={baseClubOptions.includes(transferDraft.club) ? transferDraft.club : transferDraft.club ? "Other..." : ""}
                                        onChange={(e) => {
                                            if (e.target.value === "Other...") {
                                                setIsCustomClub(true);
                                                setTransferDraft((prev: any) => ({ ...prev, club: "" }));
                                            } else {
                                                setTransferDraft((prev: any) => ({ ...prev, club: e.target.value }));
                                            }
                                        }}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                    >
                                        <option value="" disabled>Select club</option>
                                        {clubOptions.map((club) => (
                                            <option key={club} value={club}>{club}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="space-y-2 mt-2 flex items-center gap-2">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={transferDraft.club}
                                                onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, club: e.target.value }))}
                                                placeholder="Custom club name..."
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                                autoFocus
                                            />
                                            <input
                                                type="text"
                                                value={customClubLogo}
                                                onChange={(e) => setCustomClubLogo(e.target.value)}
                                                placeholder="Logo URL (optional)..."
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {customClubLogo && (
                                                <div className="w-10 h-10 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center p-1">
                                                    <img src={customClubLogo} alt="Preview" className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                            <button onClick={() => { setIsCustomClub(false); setTransferDraft((prev: any) => ({ ...prev, club: "Arsenal" })); setCustomClubLogo(""); }} className="text-xs text-gray-500 hover:text-gray-700 self-center">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">Status</span>
                                <select
                                    value={transferDraft.status}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, status: e.target.value as TransferWatchStatus }))}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                >
                                    <option value="rumor">Rumour</option>
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
                                    <option value="million-eur">Million EUR</option>
                                    <option value="million-gbp">Million GBP</option>
                                    <option value="not-disclosed">Not disclosed</option>
                                    <option value="free">Free Transfer</option>
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
                                    disabled={transferDraft.feeMode === "not-disclosed" || transferDraft.feeMode === "free"}
                                    placeholder={transferDraft.feeMode === "not-disclosed" ? "Not disclosed" : transferDraft.feeMode === "free" ? "Free" : "45"}
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

                            {/* Scout Grades */}
                            <div className="md:col-span-2 border-t border-gray-100 dark:border-gray-800 pt-5 mt-3">
                                <h3 className="text-sm font-medium text-[#0F172A] dark:text-white mb-3">Scout Grades (1-10)</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <label className="block">
                                        <span className="block text-xs font-medium text-[#64748B] dark:text-gray-400 mb-1">Pace</span>
                                        <input
                                            type="number" min={1} max={10}
                                            value={transferDraft.scoutGrades?.pace || ""}
                                            onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, scoutGrades: { ...prev.scoutGrades, pace: Number(e.target.value) } }))}
                                            placeholder="8"
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-3 py-2 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-medium text-[#64748B] dark:text-gray-400 mb-1">Physicality</span>
                                        <input
                                            type="number" min={1} max={10}
                                            value={transferDraft.scoutGrades?.physicality || ""}
                                            onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, scoutGrades: { ...prev.scoutGrades, physicality: Number(e.target.value) } }))}
                                            placeholder="7"
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-3 py-2 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-medium text-[#64748B] dark:text-gray-400 mb-1">Passing</span>
                                        <input
                                            type="number" min={1} max={10}
                                            value={transferDraft.scoutGrades?.passing || ""}
                                            onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, scoutGrades: { ...prev.scoutGrades, passing: Number(e.target.value) } }))}
                                            placeholder="9"
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-3 py-2 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-medium text-[#64748B] dark:text-gray-400 mb-1">Defensive IQ</span>
                                        <input
                                            type="number" min={1} max={10}
                                            value={transferDraft.scoutGrades?.defensiveIQ || ""}
                                            onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, scoutGrades: { ...prev.scoutGrades, defensiveIQ: Number(e.target.value) } }))}
                                            placeholder="5"
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-3 py-2 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="block text-xs font-medium text-[#64748B] dark:text-gray-400 mb-1">Final Third</span>
                                        <input
                                            type="number" min={1} max={10}
                                            value={transferDraft.scoutGrades?.finalThird || ""}
                                            onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, scoutGrades: { ...prev.scoutGrades, finalThird: Number(e.target.value) } }))}
                                            placeholder="8"
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-3 py-2 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* AI Punchy Line */}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mt-5">
                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    AI Punchy Line
                                </span>
                                <textarea
                                    value={transferDraft.punchyLine || ""}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, punchyLine: e.target.value }))}
                                    placeholder='e.g. "Here we go — Mbappe to Arsenal is 7/10 on the believability meter"'
                                    rows={2}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none italic"
                                />
                            </label>
                            <button
                                onClick={handleGeneratePunchyLine}
                                disabled={generatingLine || !transferDraft.player}
                                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                            >
                                {generatingLine ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {generatingLine ? "Generating..." : "🪄 Generate AI Line"}
                            </button>
                        </div>

                        {/* My Take / Market Context */}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mt-5">
                            <label className="block">
                                <span className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                                    My Take / Market Context
                                </span>
                                <textarea
                                    value={transferDraft.myTake || ""}
                                    onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, myTake: e.target.value }))}
                                    placeholder='Write a detailed talk about the transfer, market context, etc...'
                                    rows={6}
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] resize-y"
                                />
                            </label>
                        </div>

                        {/* AI Dossier Analysis */}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mt-5">
                            <h3 className="text-sm font-medium text-[#0F172A] dark:text-white mb-3">AI Dossier Analysis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="block md:col-span-2">
                                    <span className="block text-xs font-medium text-[#64748B] dark:text-gray-400 mb-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-purple-500" />
                                        AI Take
                                    </span>
                                    <textarea
                                        value={transferDraft.aiTake || ""}
                                        onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, aiTake: e.target.value }))}
                                        placeholder='e.g. "The AI views this transfer as highly probable due to..."'
                                        rows={3}
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-medium text-[#64748B] dark:text-gray-400 mb-1 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-purple-500" />
                                        AI Score (1-100)
                                    </span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={transferDraft.aiScore || ""}
                                        onChange={(e) => setTransferDraft((prev: any) => ({ ...prev, aiScore: e.target.value ? Number(e.target.value) : undefined }))}
                                        placeholder="85"
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-5">
                            <button
                                onClick={handleAddClick}
                                className="px-4 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]"
                            >
                                {transferEditId ? "Update Entry" : "Add To Transfer Watch"}
                            </button>
                            {transferEditId && (
                                <button
                                    onClick={() => {
                                        handleCancelTransferWatchEdit();
                                        setIsCustomClub(false);
                                        setIsCustomFromClub(false);
                                        setCustomClubLogo("");
                                        setCustomFromClubLogo("");
                                    }}
                                    className="px-4 py-2.5 text-[#64748B] dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                            )}
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
                                {baseClubOptions.map((club) => (
                                    <option key={club} value={club}>{club}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            {filteredTransferWatchEntries.length === 0 ? (
                                <AdminEmptyState
                                    icon={TrendingUp}
                                    title="No manual transfer watch items yet"
                                    description="Add items here that will be shown in the transfer watch components."
                                />
                            ) : (
                                filteredTransferWatchEntries.map((entry) => (
                                    <div key={entry.id} className="rounded-xl bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-[#0F172A] dark:text-white">{entry.player}</p>
                                                <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
                                                    {entry.fromClub && <span className="text-rose-500 font-medium">{entry.fromClub} → </span>}
                                                    {entry.club} · <span className="font-bold text-[#0F172A] dark:text-white">{formatTransferWatchAmount(entry)}</span>
                                                </p>
                                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                                                    {getTransferTierLabel(entry.tier, entry.status)}
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
                                                    onClick={() => handleEditClick(entry)}
                                                    className="p-1.5 rounded-lg text-[#64748B] dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                                    title="Edit entry"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
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
                                        {entry.punchyLine && (
                                            <p className="mt-2 text-sm italic text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-100 dark:border-purple-500/20">
                                                "{entry.punchyLine}"
                                            </p>
                                        )}
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