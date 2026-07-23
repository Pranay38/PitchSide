import React from "react";
import { FileText, Star, Flame, X, Plus } from "lucide-react";

interface ArmchairRatingEntry {
    name: string;
    position: string;
    authorRating: number;
    imageUrl?: string;
}

interface InteractiveWidgetsProps {
    usePoll: boolean;
    setUsePoll: (val: boolean) => void;
    poll: { question: string; options: { text: string; votes: number }[] };
    setPoll: (val: { question: string; options: { text: string; votes: number }[] }) => void;
    

    
    useHotTakes: boolean;
    setUseHotTakes: (val: boolean) => void;
    hotTakes: { id: string; statement: string }[];
    setHotTakes: (val: { id: string; statement: string }[]) => void;

    useArmchairRatings: boolean;
    setUseArmchairRatings: (val: boolean) => void;
    armchairRatings: ArmchairRatingEntry[];
    setArmchairRatings: (val: ArmchairRatingEntry[]) => void;
}

export function InteractiveWidgets({
    usePoll, setUsePoll, poll, setPoll,
    useHotTakes, setUseHotTakes, hotTakes, setHotTakes,
    useArmchairRatings, setUseArmchairRatings, armchairRatings, setArmchairRatings
}: InteractiveWidgetsProps) {
    return (
        <>
            {/* Poll Section */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                        <FileText className="w-4 h-4 text-[#16A34A]" />
                        Interactive Poll
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={usePoll} onChange={(e) => setUsePoll(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#16A34A]/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#16A34A]"></div>
                    </label>
                </div>

                {usePoll && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <input
                                type="text"
                                value={poll.question}
                                onChange={(e) => setPoll({ ...poll, question: e.target.value })}
                                placeholder="Poll Question (e.g. Who will win the title?)"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm mb-3 font-semibold"
                            />
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-[#64748B] dark:text-gray-400">Poll Options</p>
                            {poll.options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => {
                                            const newOpts = [...poll.options];
                                            newOpts[idx].text = e.target.value;
                                            setPoll({ ...poll, options: newOpts });
                                        }}
                                        placeholder={`Option ${idx + 1}`}
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                                    />
                                    {poll.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newOpts = poll.options.filter((_, i) => i !== idx);
                                                setPoll({ ...poll, options: newOpts });
                                            }}
                                            className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {poll.options.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => setPoll({ ...poll, options: [...poll.options, { text: "", votes: 0 }] })}
                                    className="text-xs font-semibold text-[#16A34A] hover:text-[#15803d] transition-colors mt-2"
                                >
                                    + Add Option
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>



            {/* Hot Take Heat Index */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Hot Take Heat Index
                    </label>
                    <button
                        type="button"
                        onClick={() => setUseHotTakes(!useHotTakes)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useHotTakes ? 'bg-[#16A34A]' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${useHotTakes ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                </div>
                <p className="text-xs text-[#64748B] dark:text-gray-400 mb-4">Add bold takes. Readers vote to reveal a temperature gauge showing how hot the community thinks your take is.</p>
                {useHotTakes && (
                    <div className="space-y-3">
                        {hotTakes.map((take, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <textarea
                                    placeholder="Enter a bold take or opinion statement…"
                                    value={take.statement}
                                    onChange={(e) => { const t = [...hotTakes]; t[idx] = { ...t[idx], statement: e.target.value }; setHotTakes(t); }}
                                    rows={2}
                                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                                />
                                <button type="button" onClick={() => setHotTakes(hotTakes.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1 flex-shrink-0">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setHotTakes([...hotTakes, { id: `take-${Date.now()}`, statement: "" }])}
                            className="flex items-center gap-1.5 text-sm font-medium text-orange-500 hover:text-orange-400"
                        >
                            <Plus className="w-4 h-4" /> Add Take
                        </button>
                    </div>
                )}
            </div>

            {/* Armchair Ratings */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                        <Star className="w-4 h-4 text-amber-500" />
                        Armchair Ratings
                    </label>
                    <button
                        type="button"
                        onClick={() => setUseArmchairRatings(!useArmchairRatings)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useArmchairRatings ? 'bg-[#16A34A]' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${useArmchairRatings ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                </div>
                <p className="text-xs text-[#64748B] dark:text-gray-400 mb-4">Rate each player 1-10. Readers will be able to submit their own ratings and see the fan average vs yours.</p>
                {useArmchairRatings && (
                    <div className="space-y-3">
                        {armchairRatings.map((entry, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={entry.name}
                                        onChange={(e) => { const r = [...armchairRatings]; r[idx] = { ...r[idx], name: e.target.value }; setArmchairRatings(r); }}
                                        placeholder="Player name"
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={entry.position}
                                        onChange={(e) => { const r = [...armchairRatings]; r[idx] = { ...r[idx], position: e.target.value }; setArmchairRatings(r); }}
                                        placeholder="Position (e.g. CM)"
                                        className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={entry.authorRating || ""}
                                        onChange={(e) => { const r = [...armchairRatings]; r[idx] = { ...r[idx], authorRating: parseFloat(e.target.value) || 0 }; setArmchairRatings(r); }}
                                        placeholder="/10"
                                        className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-sm text-[#0F172A] dark:text-white text-center font-bold"
                                    />
                                    <button type="button" onClick={() => setArmchairRatings(armchairRatings.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <input
                                    type="url"
                                    value={entry.imageUrl || ""}
                                    onChange={(e) => { const r = [...armchairRatings]; r[idx] = { ...r[idx], imageUrl: e.target.value }; setArmchairRatings(r); }}
                                    placeholder="Image URL (optional headshot)"
                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0F172A] text-xs text-[#0F172A] dark:text-white"
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setArmchairRatings([...armchairRatings, { name: "", position: "", authorRating: 0 }])}
                            className="flex items-center gap-1.5 text-sm font-medium text-amber-500 hover:text-amber-400"
                        >
                            <Plus className="w-4 h-4" /> Add Player
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
