import { useState } from "react";
import { Link, FileText, Tag, ArrowLeft } from "lucide-react";

interface DebateEditorProps {
    onSave: (data: { title: string; description: string; category: string; coverImage: string }) => void;
    onCancel: () => void;
}

export function DebateEditor({ onSave, onCancel }: DebateEditorProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [coverImage, setCoverImage] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!title.trim()) errs.title = "Title is required (e.g. Is Salah the best PL player ever?)";
        if (!description.trim()) errs.description = "Please provide some context for the debate.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            title: title.trim(),
            description: description.trim(),
            category: category.trim() || "General",
            coverImage: coverImage.trim() || "https://images.unsplash.com/photo-1549923015-badf41b04831?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb290YmFsbCUyMHN0YWRpdW0lMjBtYXRjaHxlbnwxfHx8fDE3NzIyOTU0ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E293B] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0F172A]/50">
                    <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#16A34A]" />
                        Create New Debate
                    </h2>
                    <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Debate Topic / Question</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: "" }); }}
                            placeholder="e.g. Is Salah the best PL player ever?"
                            className={`w-full px-4 py-3 rounded-xl border ${errors.title ? "border-red-400" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 transition-all font-medium`}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Context / Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); setErrors({ ...errors, description: "" }); }}
                            placeholder="Provide some background information setting up the debate..."
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl border ${errors.description ? "border-red-400" : "border-gray-200 dark:border-gray-700"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 transition-all text-sm resize-none`}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1.5">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        {/* Category */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">
                                <Tag className="w-4 h-4 text-[#16A34A]" /> Category
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g. Premier League"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 transition-all text-sm"
                            />
                        </div>

                        {/* Image URL */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">
                                <Link className="w-4 h-4 text-[#16A34A]" /> Image URL
                            </label>
                            <input
                                type="url"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="Optional Unsplash URL..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 text-sm font-medium text-[#64748B] hover:text-[#0F172A] dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all hover:shadow-lg hover:shadow-[#16A34A]/25"
                        >
                            Create Debate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
