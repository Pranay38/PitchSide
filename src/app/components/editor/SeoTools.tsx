import { toast } from "sonner";
import { Search } from "lucide-react";

interface SeoToolsProps {
    excerpt: string;
    setExcerpt: (val: string) => void;
    content: string;
    errors: Record<string, string>;
}

export function SeoTools({ excerpt, setExcerpt, content, errors }: SeoToolsProps) {
    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                    <Search className="w-4 h-4 text-[#16A34A]" />
                    SEO & Meta
                </label>
            </div>

            <textarea
                value={excerpt}
                onChange={(e) => {
                    setExcerpt(e.target.value);
                    if (errors.excerpt) delete errors.excerpt;
                }}
                placeholder="Brief summary of the article (shown on cards and in search results)..."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border ${errors.excerpt ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm resize-none`}
            />
            {errors.excerpt && <p className="text-red-500 text-xs mt-1">{errors.excerpt}</p>}
            
            <button
                type="button"
                onClick={async () => {
                    if (!content.trim()) {
                        toast.error("Write some content first so AI can generate a description.");
                        return;
                    }
                    toast.loading("Generating meta description...", { id: "meta-gen" });
                    try {
                        const res = await fetch("/api/ai-generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "meta-description", text: content.slice(0, 3000) }),
                        });
                        const data = await res.json();
                        if (data.data) {
                            setExcerpt(data.data.trim());
                            toast.success("Meta description generated!", { id: "meta-gen" });
                        } else {
                            toast.error(data.error || "Failed", { id: "meta-gen" });
                        }
                    } catch {
                        toast.error("AI generation failed", { id: "meta-gen" });
                    }
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
            >
                🪄 AI Meta Description
            </button>
        </div>
    );
}
