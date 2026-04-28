import { FileText } from "lucide-react";
import { EditorCanvas } from "./EditorCanvas";

interface RichTextCanvasProps {
    title: string;
    setTitle: (val: string) => void;
    format: "article" | "quick-take";
    setFormat: (val: "article" | "quick-take") => void;
    content: string;
    setContent: React.Dispatch<React.SetStateAction<string>>;
    errors: Record<string, string>;
    handleCopyAsThread: () => void;
    copiedThread: boolean;
}

export function RichTextCanvas({
    title,
    setTitle,
    format,
    setFormat,
    content,
    setContent,
    errors,
    handleCopyAsThread,
    copiedThread
}: RichTextCanvasProps) {
    return (
        <div className="space-y-6">
            {/* Title & Format */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                        <FileText className="w-4 h-4 text-[#16A34A]" />
                        Article Title
                    </label>
                    
                    <div className="flex bg-gray-100 dark:bg-[#0F172A] p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setFormat("article")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                format === "article" 
                                    ? "bg-white dark:bg-[#1E293B] shadow-sm text-[#0F172A] dark:text-white" 
                                    : "text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                            }`}
                        >
                            Full Article
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormat("quick-take")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                                format === "quick-take" 
                                    ? "bg-white dark:bg-[#1E293B] shadow-sm text-[#16A34A] dark:text-[#16A34A]" 
                                    : "text-[#64748B] hover:text-[#16A34A]"
                            }`}
                        >
                            Quick Take ⚡
                        </button>
                    </div>
                </div>

                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) delete errors.title;
                    }}
                    placeholder="Your article title..."
                    className={`w-full px-4 py-3 rounded-xl border ${errors.title ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-lg font-semibold`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-2">{errors.title}</p>}
            </div>

            {/* Rich Text Editor */}
            <EditorCanvas
                content={content}
                setContent={setContent}
                errors={errors}
                handleCopyAsThread={handleCopyAsThread}
                copiedThread={copiedThread}
            />
        </div>
    );
}
