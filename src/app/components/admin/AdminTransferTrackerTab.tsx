import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, Repeat2, CheckCircle2, Save, Loader2, Edit3, ShieldQuestion, ImagePlus, X, LoaderCircle as LoaderCircleIcon, Edit2, Copy, Check, Link as LinkIcon, AlertCircle } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";
import { getAllClubNames, getClubByName, addCustomClub } from "../../data/clubs";

export type TransferStatus = "rumour" | "talks" | "medical" | "done";

export interface TransferRecord {
    id: string;
    player: string;
    playerImageUrl?: string;
    fromClub: string;
    toClub: string;
    fee: string;
    source: string;
    status: TransferStatus;
    updatedAt: string;
    createdAt: string;
}

const STATUS_STAGES: TransferStatus[] = ["rumour", "talks", "medical", "done"];
const STATUS_LABELS = ["Rumour", "Talks", "Medical", "Done"];

const STATUS_COLORS: Record<TransferStatus, string> = {
    rumour: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    talks: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    medical: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    done: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
};

export function AdminTransferTrackerTab() {
    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [player, setPlayer] = useState("");
    const [playerImageUrl, setPlayerImageUrl] = useState("");
    const [fromClub, setFromClub] = useState("");
    const [customFromClub, setCustomFromClub] = useState("");
    const [customFromClubLogo, setCustomFromClubLogo] = useState("");
    const [toClub, setToClub] = useState("");
    const [customToClub, setCustomToClub] = useState("");
    const [customToClubLogo, setCustomToClubLogo] = useState("");
    const [fee, setFee] = useState("");
    const [source, setSource] = useState("");
    const [status, setStatus] = useState<TransferStatus>("rumour");
    const [submitting, setSubmitting] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
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
            setPlayerImageUrl(dataUrl);
        } catch {
            console.error("Failed to process image");
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const clubOptions = [...getAllClubNames().sort((a, b) => a.localeCompare(b)), "Other..."];

    const fetchTransfers = useCallback(async () => {
        try {
            const res = await fetch("/api/transfers");
            if (res.ok) {
                const data = await res.json();
                setTransfers(data);
            }
        } catch (e) {
            console.error("Failed to fetch transfers:", e);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("pitchside_admin_auth") || "";
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        };
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalFromClub = fromClub === "Other..." ? customFromClub : fromClub;
        const finalToClub = toClub === "Other..." ? customToClub : toClub;

        if (!player || !finalFromClub || !finalToClub) return;

        // Persist custom clubs if specified
        if (fromClub === "Other..." && finalFromClub) {
            addCustomClub({ name: finalFromClub, league: "Unknown", logo: customFromClubLogo });
        }
        if (toClub === "Other..." && finalToClub) {
            addCustomClub({ name: finalToClub, league: "Unknown", logo: customToClubLogo });
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/transfers", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    id: editId || undefined,
                    player,
                    playerImageUrl,
                    fromClub: finalFromClub,
                    toClub: finalToClub,
                    fee,
                    source,
                    status
                })
            });

            if (res.ok) {
                setShowForm(false);
                setPlayer("");
                setPlayerImageUrl("");
                setFromClub("");
                setCustomFromClub("");
                setCustomFromClubLogo("");
                setToClub("");
                setCustomToClub("");
                setCustomToClubLogo("");
                setFee("");
                setSource("");
                setStatus("rumour");
                setEditId(null);
                fetchTransfers();
            }
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);
    };

    const handleEdit = (t: TransferRecord) => {
        setPlayer(t.player);
        setPlayerImageUrl(t.playerImageUrl || "");
        
        if (clubOptions.includes(t.fromClub)) {
            setFromClub(t.fromClub);
            setCustomFromClub("");
            setCustomFromClubLogo("");
        } else {
            setFromClub("Other...");
            setCustomFromClub(t.fromClub);
            setCustomFromClubLogo(getClubByName(t.fromClub)?.logo || "");
        }

        if (clubOptions.includes(t.toClub)) {
            setToClub(t.toClub);
            setCustomToClub("");
            setCustomToClubLogo("");
        } else {
            setToClub("Other...");
            setCustomToClub(t.toClub);
            setCustomToClubLogo(getClubByName(t.toClub)?.logo || "");
        }

        setFee(t.fee || "");
        setSource(t.source || "");
        setStatus(t.status);
        setEditId(t.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this transfer record?")) return;
        try {
            const res = await fetch(`/api/transfers?id=${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
            });
            if (res.ok) fetchTransfers();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatusChange = async (id: string, newStatusIndex: number) => {
        const newStatus = STATUS_STAGES[newStatusIndex];
        
        // Optimistic UI update
        setTransfers(prev => prev.map(t => 
            t.id === id ? { ...t, status: newStatus } : t
        ));

        // Background sync
        try {
            await fetch("/api/transfers", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ id, status: newStatus })
            });
        } catch (e) {
            console.error("Failed to update status, reverting...");
            fetchTransfers();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <Repeat2 className="w-6 h-6 text-[#16A34A]" />
                        Transfer Tracker
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Use the sliders below to move deals through their lifecycle stages.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        if (showForm) setEditId(null);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Transfer
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-white dark:bg-[#1E293B] rounded-[2rem] p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-6">
                        {editId ? "Update Transfer Record" : "Add Transfer Rumour"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Player Name *</label>
                            <input type="text" value={player} onChange={e => setPlayer(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm" placeholder="e.g. Jude Bellingham" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Player Photo</label>
                            <div className="flex items-center gap-3">
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center cursor-pointer hover:border-[#16A34A] overflow-hidden relative group"
                                >
                                    {uploadingImage ? (
                                        <LoaderCircleIcon className="w-5 h-5 text-gray-400 animate-spin" />
                                    ) : playerImageUrl ? (
                                        <>
                                            <img src={playerImageUrl} alt="Player" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 className="w-4 h-4 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-[#16A34A] transition-colors" />
                                    )}
                                </div>
                                {playerImageUrl && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setPlayerImageUrl("");
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
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
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Source (Journalist/Outlet)</label>
                            <input type="text" value={source} onChange={e => setSource(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm" placeholder="e.g. Fabrizio Romano" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Initial Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as TransferStatus)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
                                <option value="rumour">Rumour</option>
                                <option value="talks">Talks Ongoing</option>
                                <option value="medical">Medical Booked</option>
                                <option value="done">Done Deal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">From Club *</label>
                            <select value={fromClub} onChange={e => setFromClub(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm mb-2">
                                <option value="" disabled>Select club</option>
                                {clubOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {fromClub === "Other..." && (
                                <div className="space-y-2 mt-2 flex items-center gap-2">
                                    <div className="flex-1 space-y-2">
                                        <input type="text" value={customFromClub} onChange={e => setCustomFromClub(e.target.value)} required placeholder="Type custom club name..." className="w-full px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#16A34A] focus:outline-none" />
                                        <input type="text" value={customFromClubLogo} onChange={e => setCustomFromClubLogo(e.target.value)} placeholder="Logo URL (optional)..." className="w-full px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#16A34A] focus:outline-none" />
                                    </div>
                                    {customFromClubLogo && (
                                        <div className="w-10 h-10 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center p-1">
                                            <img src={customFromClubLogo} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">To Club *</label>
                            <select value={toClub} onChange={e => setToClub(e.target.value)} required className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm mb-2">
                                <option value="" disabled>Select club</option>
                                {clubOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            {toClub === "Other..." && (
                                <div className="space-y-2 mt-2 flex items-center gap-2">
                                    <div className="flex-1 space-y-2">
                                        <input type="text" value={customToClub} onChange={e => setCustomToClub(e.target.value)} required placeholder="Type custom club name..." className="w-full px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#16A34A] focus:outline-none" />
                                        <input type="text" value={customToClubLogo} onChange={e => setCustomToClubLogo(e.target.value)} placeholder="Logo URL (optional)..." className="w-full px-4 py-2.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#16A34A] focus:outline-none" />
                                    </div>
                                    {customToClubLogo && (
                                        <div className="w-10 h-10 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center p-1">
                                            <img src={customToClubLogo} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Transfer Fee</label>
                            <input type="text" value={fee} onChange={e => setFee(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm" placeholder="e.g. €103m + add-ons" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#15803d] transition-all disabled:opacity-50">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {editId ? "Update Record" : "Create Record"}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {transfers.length === 0 && (
                    <AdminEmptyState
                        icon={Repeat2}
                        title="No active transfers"
                        description="Add a player to start tracking the transfer window."
                    />
                )}

                {transfers.map(t => {
                    const statusIndex = STATUS_STAGES.indexOf(t.status);
                    const fromClubInfo = getClubByName(t.fromClub);
                    const toClubInfo = getClubByName(t.toClub);
                    
                    return (
                        <div key={t.id} className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row gap-6 md:items-center relative transition-colors duration-500 hover:border-[#16A34A]/30">
                            {/* Left side: Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    {t.playerImageUrl && (
                                        <img src={t.playerImageUrl} alt={t.player} className="w-8 h-8 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800" />
                                    )}
                                    <h3 className="text-lg font-bold font-outfit text-[#0F172A] dark:text-white truncate">
                                        {t.player}
                                    </h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${STATUS_COLORS[t.status]}`}>
                                        {STATUS_LABELS[statusIndex]}
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        {fromClubInfo?.logo ? (
                                            <img src={fromClubInfo.logo} alt={t.fromClub} className="w-4 h-4 object-contain" />
                                        ) : (
                                            <ShieldQuestion className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className="text-rose-500">{t.fromClub}</span>
                                        <ArrowRightIcon className="w-3.5 h-3.5 text-gray-300" />
                                        {toClubInfo?.logo ? (
                                            <img src={toClubInfo.logo} alt={t.toClub} className="w-4 h-4 object-contain" />
                                        ) : (
                                            <ShieldQuestion className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className="text-emerald-500">{t.toClub}</span>
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                    <span>{t.fee}</span>
                                    <span className="text-gray-300 dark:text-gray-700">•</span>
                                    <span className="text-xs">via {t.source}</span>
                                </div>
                            </div>

                            {/* Right side: Slider & Actions */}
                            <div className="flex-1 flex items-center justify-between md:justify-end gap-6">
                                <div className="w-full max-w-[280px]">
                                    <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400 mb-2 px-1">
                                        <span>Rumour</span>
                                        <span className="text-center">Talks</span>
                                        <span className="text-center">Medical</span>
                                        <span className="text-right">Done</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="3" 
                                        step="1" 
                                        value={statusIndex}
                                        onChange={(e) => handleStatusChange(t.id, parseInt(e.target.value))}
                                        className="w-full accent-[#16A34A] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    />
                                </div>
                                
                                <button 
                                    onClick={() => handleEdit(t)}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors flex-shrink-0"
                                    title="Edit transfer"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>

                                <button 
                                    onClick={() => handleDelete(t.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                                    title="Delete transfer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Done overlay logic? If done, maybe throw some confetti or checkmark */}
                            {t.status === "done" && (
                                <div className="absolute top-4 right-4 text-emerald-500/20 pointer-events-none hidden md:block">
                                    <CheckCircle2 className="w-16 h-16" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
