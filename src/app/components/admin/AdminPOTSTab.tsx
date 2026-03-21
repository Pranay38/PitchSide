import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Save, X, GripVertical, BarChart3, TrendingUp, Info } from 'lucide-react';
import { type POTSSettings, type POTSContender } from '../../lib/pots';
import { toast } from 'sonner';

interface AdminPOTSTabProps {
    settings: POTSSettings;
    onSave: (settings: POTSSettings) => Promise<void>;
}

export function AdminPOTSTab({ settings, onSave }: AdminPOTSTabProps) {
    const [draft, setDraft] = useState<POTSSettings>(settings);
    const [saving, setSaving] = useState(false);

    const handleFieldChange = (field: keyof POTSSettings, value: any) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const handleContenderChange = (index: number, updates: Partial<POTSContender>) => {
        const newContenders = [...draft.contenders];
        newContenders[index] = { ...newContenders[index], ...updates };
        setDraft(prev => ({ ...prev, contenders: newContenders }));
    };

    const addContender = () => {
        if (draft.contenders.length >= 8) {
            toast.error("Maximum 8 contenders allowed.");
            return;
        }
        const newContender: POTSContender = {
            id: Math.random().toString(36).substring(7),
            name: "New Player",
            club: "Club Name",
            image: "",
            votes: 0,
            stats: [{ label: "Goals", value: 0 }, { label: "Assists", value: 0 }],
            verdict: "Manual verdict goes here...",
            highlights: []
        };
        setDraft(prev => ({ ...prev, contenders: [...prev.contenders, newContender] }));
    };

    const removeContender = (index: number) => {
        const newContenders = draft.contenders.filter((_, i) => i !== index);
        setDraft(prev => ({ ...prev, contenders: newContenders }));
    };

    const addStat = (contenderIndex: number) => {
        const newContenders = [...draft.contenders];
        newContenders[contenderIndex].stats.push({ label: "Stat Label", value: 0 });
        setDraft(prev => ({ ...prev, contenders: newContenders }));
    };

    const removeStat = (contenderIndex: number, statIndex: number) => {
        const newContenders = [...draft.contenders];
        newContenders[contenderIndex].stats = newContenders[contenderIndex].stats.filter((_, i) => i !== statIndex);
        setDraft(prev => ({ ...prev, contenders: newContenders }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(draft);
            toast.success("POTS settings saved!");
        } catch (err) {
            toast.error("Failed to save POTS settings.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* General Settings */}
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">POTS General Settings</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={draft.enabled}
                            onChange={e => handleFieldChange('enabled', e.target.checked)}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#16A34A]"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{draft.enabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Vote Title</label>
                        <input 
                            type="text" 
                            value={draft.title}
                            onChange={e => handleFieldChange('title', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] font-medium"
                            placeholder="e.g. Player of the Season 2026"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Description</label>
                        <textarea 
                            value={draft.description}
                            onChange={e => handleFieldChange('description', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] font-medium min-h-[100px]"
                            placeholder="SEO description and hero text..."
                        />
                    </div>
                </div>
            </div>

            {/* Contenders List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#16A34A]" />
                        Contenders Shortlist ({draft.contenders.length}/8)
                    </h3>
                    <button 
                        onClick={addContender}
                        className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] text-white rounded-xl text-sm font-bold hover:scale-[1.02] transition-all"
                    >
                        <Plus className="w-4 h-4" /> Add Player
                    </button>
                </div>

                <div className="grid gap-6">
                    {draft.contenders.map((contender, idx) => (
                        <div key={contender.id} className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                        {contender.image && <img src={contender.image} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="font-bold text-sm">{contender.name || "Unnamed Player"}</span>
                                </div>
                                <button onClick={() => removeContender(idx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Name</label>
                                            <input 
                                                type="text" 
                                                value={contender.name}
                                                onChange={e => handleContenderChange(idx, { name: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Club</label>
                                            <input 
                                                type="text" 
                                                value={contender.club}
                                                onChange={e => handleContenderChange(idx, { club: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Image URL</label>
                                        <input 
                                            type="text" 
                                            value={contender.image}
                                            onChange={e => handleContenderChange(idx, { image: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] text-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Verdict (Manual)</label>
                                        <textarea 
                                            value={contender.verdict}
                                            onChange={e => handleContenderChange(idx, { verdict: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] text-sm min-h-[80px]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[10px] font-black uppercase text-gray-400">Stats</label>
                                        <button onClick={() => addStat(idx)} className="text-[10px] font-black text-[#16A34A] uppercase hover:underline">Add Stat</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {contender.stats.map((stat, sIdx) => (
                                            <div key={sIdx} className="flex gap-1">
                                                <input 
                                                    type="text" 
                                                    value={stat.label}
                                                    onChange={e => {
                                                        const newStats = [...contender.stats];
                                                        newStats[sIdx].label = e.target.value;
                                                        handleContenderChange(idx, { stats: newStats });
                                                    }}
                                                    className="flex-1 px-2 py-1.5 rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] text-[10px]"
                                                    placeholder="Label"
                                                />
                                                <input 
                                                    type="text" 
                                                    value={stat.value}
                                                    onChange={e => {
                                                        const newStats = [...contender.stats];
                                                        newStats[sIdx].value = e.target.value;
                                                        handleContenderChange(idx, { stats: newStats });
                                                    }}
                                                    className="w-12 px-2 py-1.5 rounded border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] text-[10px] font-bold"
                                                    placeholder="Val"
                                                />
                                                <button onClick={() => removeStat(idx, sIdx)} className="text-gray-400 hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Starting Votes (Caution)</label>
                                        <input 
                                            type="number" 
                                            value={contender.votes}
                                            onChange={e => handleContenderChange(idx, { votes: parseInt(e.target.value) || 0 })}
                                            className="w-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Action */}
            <div className="flex justify-end pt-4">
                <button
                    disabled={saving}
                    onClick={handleSave}
                    className="flex items-center gap-2 px-8 py-3 bg-[#16A34A] text-white rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#16A34A]/20"
                >
                    {saving ? "Saving..." : <><Save className="w-5 h-5" /> Save POTS Configuration</>}
                </button>
            </div>
        </div>
    );
}
