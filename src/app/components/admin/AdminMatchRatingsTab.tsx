import { Plus, Edit3, Trash2, HelpCircle } from "lucide-react";
import { AdminEmptyState } from "./AdminEmptyState";

interface AdminMatchRatingsTabProps {
    serverSessions: any[];
    editingSession: any | null;
    savingSession: boolean;
    setEditingSession: (session: any | null) => void;
    onSaveSession: () => Promise<void>;
    onDeleteSession: (id: string) => Promise<void>;
}

export function AdminMatchRatingsTab({
    serverSessions,
    editingSession,
    savingSession,
    setEditingSession,
    onSaveSession,
    onDeleteSession
}: AdminMatchRatingsTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Admin-Managed Match Ratings</h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        Create and manage fan rating sessions for post-match reactions.
                    </p>
                </div>
                <button
                    onClick={() => setEditingSession({ title: "", players: [{id: Date.now().toString(), name: "", imageUrl: ""}], isActive: false })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all"
                >
                    <Plus className="w-4 h-4" /> Create Session
                </button>
            </div>

            {editingSession && (
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">{editingSession._id ? "Edit Session" : "New Session"}</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm font-bold text-[#16A34A]">Set as Active (Live)</span>
                            <input
                                type="checkbox"
                                checked={editingSession.isActive}
                                onChange={e => setEditingSession({...editingSession, isActive: e.target.checked})}
                                className="w-4 h-4 accent-[#16A34A]"
                            />
                        </label>
                    </div>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="block text-sm font-medium mb-1">Match Title</span>
                            <input
                                type="text"
                                value={editingSession.title}
                                onChange={e => setEditingSession({...editingSession, title: e.target.value})}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5"
                                placeholder="E.g. Arsenal vs Liverpool - Player Ratings"
                            />
                        </label>
                        
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Players</span>
                                <button 
                                    onClick={() => setEditingSession({...editingSession, players: [...editingSession.players, {id: Date.now().toString(), name:"", imageUrl: ""}]})}
                                    className="text-xs text-[#16A34A] font-bold"
                                >+ Add Player</button>
                            </div>
                            <div className="space-y-3">
                                {editingSession.players.map((player:any, i:number) => (
                                    <div key={i} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                        {player.imageUrl ? (
                                             <img src={player.imageUrl} alt={player.name} className="w-10 h-10 object-cover rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                                        ) : (
                                             <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                                        )}
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={player.name}
                                                onChange={e => {
                                                    const newOps = [...editingSession.players];
                                                    newOps[i].name = e.target.value;
                                                    setEditingSession({...editingSession, players: newOps});
                                                }}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0F172A] px-3 py-1.5 text-sm"
                                                placeholder={`Player Name (e.g. Bukayo Saka)`}
                                            />
                                            <input
                                                type="text"
                                                value={player.imageUrl}
                                                onChange={e => {
                                                    const newOps = [...editingSession.players];
                                                    newOps[i].imageUrl = e.target.value;
                                                    setEditingSession({...editingSession, players: newOps});
                                                }}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#0F172A] px-3 py-1.5 text-sm"
                                                placeholder={`Image URL (Headshot)`}
                                            />
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const newOps = [...editingSession.players];
                                                newOps.splice(i, 1);
                                                setEditingSession({...editingSession, players: newOps});
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1"
                                        ><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-end mt-6">
                            <button onClick={() => setEditingSession(null)} className="px-5 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
                            <button 
                                disabled={savingSession}
                                onClick={onSaveSession}
                                className="px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]"
                            >
                                {savingSession ? "Saving..." : "Save Session"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!editingSession && (
                <div className="space-y-4">
                    {serverSessions.map(session => (
                        <div key={session._id} className={`bg-white dark:bg-[#1E293B] rounded-2xl border ${session.isActive ? 'border-[#16A34A] shadow-[#16A34A]/10' : 'border-gray-100 dark:border-gray-800'} p-5 shadow-sm flex items-center justify-between`}>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    {session.isActive && <span className="px-2 py-0.5 text-[10px] uppercase font-black bg-[#16A34A] text-white rounded-md">Active Live</span>}
                                    <h3 className="font-bold text-lg">{session.title}</h3>
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>{session.players.length} players</span>
                                    <span>•</span>
                                    <span>{session.players.reduce((sum:number, p:any) => sum + (p.voteCount||0), 0)} total fan votes</span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingSession(session)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                    <Edit3 className="w-5 h-5"/>
                                </button>
                                <button 
                                    onClick={() => onDeleteSession(session._id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {serverSessions.length === 0 && (
                        <AdminEmptyState
                            icon={HelpCircle}
                            title="No sessions found in database"
                            description="Create a session to let fans rate player performances."
                        />
                    )}
                </div>
            )}
        </div>
    );
}
