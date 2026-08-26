import { useState, useEffect } from "react";
import { Clock, X, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Version {
    version: number;
    title: string;
    savedAt: string;
}

interface VersionHistoryPanelProps {
    postId: string;
    onClose: () => void;
    onRestore: () => void;
}

export function VersionHistoryPanel({ postId, onClose, onRestore }: VersionHistoryPanelProps) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVersionData, setSelectedVersionData] = useState<any>(null);
    const [loadingVersion, setLoadingVersion] = useState(false);
    const [restoring, setRestoring] = useState(false);

    useEffect(() => {
        fetchVersions();
    }, [postId]);

    const fetchVersions = async () => {
        try {
            const res = await fetch(`/api/post-versions?postId=${postId}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("pitchside_admin_auth") || ""}` }
            });
            if (res.ok) {
                setVersions(await res.json());
            }
        } catch {
            toast.error("Failed to load versions");
        } finally {
            setLoading(false);
        }
    };

    const loadVersion = async (version: number) => {
        setLoadingVersion(true);
        try {
            const res = await fetch(`/api/post-versions?postId=${postId}&version=${version}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("pitchside_admin_auth") || ""}` }
            });
            if (res.ok) {
                setSelectedVersionData(await res.json());
            }
        } catch {
            toast.error("Failed to load version data");
        } finally {
            setLoadingVersion(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedVersionData) return;
        if (!window.confirm("Are you sure you want to restore this version? Your current draft will be overwritten.")) return;
        
        setRestoring(true);
        try {
            const res = await fetch(`/api/post-versions`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("pitchside_admin_auth") || ""}` 
                },
                body: JSON.stringify({ postId, version: selectedVersionData.version })
            });
            if (res.ok) {
                toast.success("Version restored successfully");
                onRestore();
                onClose();
            } else {
                toast.error("Failed to restore version");
            }
        } catch {
            toast.error("Error restoring version");
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] max-w-full bg-[#0F172A] border-l border-gray-800 shadow-2xl z-[200] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#16A34A]" />
                    Version History
                </h3>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 text-[#16A34A] animate-spin" />
                    </div>
                ) : versions.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No version history found.</p>
                ) : selectedVersionData ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <button 
                            onClick={() => setSelectedVersionData(null)}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            &larr; Back to list
                        </button>
                        <div className="bg-[#1E293B] p-4 rounded-xl border border-gray-700">
                            <h4 className="text-white font-semibold mb-2">{selectedVersionData.title}</h4>
                            <div 
                                className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto"
                                dangerouslySetInnerHTML={{ __html: selectedVersionData.content }}
                            />
                        </div>
                        <button
                            onClick={handleRestore}
                            disabled={restoring}
                            className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-[#16A34A] text-white rounded-xl text-sm font-medium hover:bg-[#15803d] transition-colors"
                        >
                            {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Restore this version
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-gray-800">
                        {versions.map((v) => (
                            <div key={v.version} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="absolute left-0 top-2.5 w-6 h-6 rounded-full bg-[#1E293B] border border-[#16A34A] flex items-center justify-center shadow-lg shadow-[#16A34A]/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                                </div>
                                <button
                                    onClick={() => loadVersion(v.version)}
                                    className="w-full text-left p-3 rounded-xl bg-[#1E293B] border border-gray-800 hover:border-[#16A34A]/50 transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-semibold text-[#16A34A]">v{v.version}</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(v.savedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">{v.title}</p>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
