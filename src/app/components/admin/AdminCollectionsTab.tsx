import { Plus, Trash2 } from "lucide-react";

interface AdminCollectionsTabProps {
    collections: any[];
    onCreateCollection: () => void;
    onDeleteCollection: (id: string) => void;
}

export function AdminCollectionsTab({ collections, onCreateCollection, onDeleteCollection }: AdminCollectionsTabProps) {
    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Collections</h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">{collections.length} Reading Lists</p>
                </div>
                <button onClick={onCreateCollection} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]">
                    <Plus className="w-4 h-4" />New Collection
                </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {collections.length === 0 && <p className="text-gray-500">No collections created yet.</p>}
                {collections.map((col) => (
                    <div key={col.id} className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-3xl mb-2 block">{col.emoji}</span>
                                <h3 className="font-bold text-[#0F172A] dark:text-white">{col.title}</h3>
                                <p className="text-sm text-gray-400 mt-1">{col.description}</p>
                            </div>
                            <button onClick={() => onDeleteCollection(col.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                            {col.postCount} post{col.postCount !== 1 ? 's' : ''} inside
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
