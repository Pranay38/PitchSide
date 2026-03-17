import { Plus, Trash2, MessageSquare } from "lucide-react";
import { DebateEditor } from "../DebateEditor";

interface AdminDebatesTabProps {
    debates: any[];
    showDebateEditor: boolean;
    expandedDebateId: string | null;
    onShowDebateEditor: (show: boolean) => void;
    onSaveDebate: (data: any) => Promise<void>;
    onDeleteDebate: (id: string) => void;
    onToggleDebateExpanded: (id: string | null) => void;
    onDeleteArgument: (debateId: string, argumentId: string) => void;
}

export function AdminDebatesTab({
    debates,
    showDebateEditor,
    expandedDebateId,
    onShowDebateEditor,
    onSaveDebate,
    onDeleteDebate,
    onToggleDebateExpanded,
    onDeleteArgument
}: AdminDebatesTabProps) {
    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Debate Corner</h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">{debates.length} hot takes</p>
                </div>
                <button onClick={() => onShowDebateEditor(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]">
                    <Plus className="w-4 h-4" />New Debate
                </button>
            </div>

            {showDebateEditor && (
                <DebateEditor onSave={onSaveDebate} onCancel={() => onShowDebateEditor(false)} />
            )}
            <div className="space-y-3">
                {debates.length === 0 && <p className="text-gray-500">No debates created yet.</p>}
                {debates.map((deb) => (
                    <div key={deb.id} className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden text-left transition-all">
                        <div className="p-5 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-[#0F172A] dark:text-white">{deb.title}</h3>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                    <span className="text-emerald-500 font-medium">{deb.agreeVotes} Agree</span>
                                    <span className="text-red-500 font-medium">{deb.disagreeVotes} Disagree</span>
                                    <span>•</span>
                                    <span>{deb.totalArguments} Arguments</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onToggleDebateExpanded(expandedDebateId === deb.id ? null : deb.id)} 
                                    className={`p-2 rounded-lg transition-colors ${expandedDebateId === deb.id ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"}`}
                                    title="View Comments"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteDebate(deb.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                        
                        {/* Expanded Comments View */}
                        {expandedDebateId === deb.id && deb.arguments && deb.arguments.length > 0 && (
                            <div className="bg-gray-50 dark:bg-[#0F172A] p-4 border-t border-gray-100 dark:border-gray-800 max-h-[300px] overflow-y-auto">
                                <div className="space-y-3">
                                    {deb.arguments.map((arg: any) => (
                                        <div key={arg.id} className="flex items-start justify-between gap-4 p-3 bg-white dark:bg-[#1E293B] rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm text-[#0F172A] dark:text-gray-200">{arg.author}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${arg.side === "agree" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}>
                                                        {arg.side}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{arg.text}</p>
                                            </div>
                                            <button 
                                                onClick={() => onDeleteArgument(deb.id, arg.id)}
                                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                                                title="Delete Comment"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {expandedDebateId === deb.id && (!deb.arguments || deb.arguments.length === 0) && (
                            <div className="bg-gray-50 dark:bg-[#0F172A] p-4 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-500">
                                No comments on this debate yet.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
