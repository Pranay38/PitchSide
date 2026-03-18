import { useState, useEffect } from "react";
import { Send, Eye, Loader2, Mail, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { getPublishedPosts } from "../../lib/postStorage";

interface NewsletterArticle {
    title: string;
    excerpt: string;
    url: string;
}

export function AdminNewsletterTab() {
    const [subject, setSubject] = useState("⚽ This Week on The Touchline Dribble");
    const [intro, setIntro] = useState("Here are the top articles from this week — sharp analysis, bold opinions, and football stories you won't want to miss.");
    const [articles, setArticles] = useState<NewsletterArticle[]>([]);
    const [previewHtml, setPreviewHtml] = useState("");
    const [sending, setSending] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
    const [subscriberCount, setSubscriberCount] = useState(0);

    // Fetch subscriber count
    useEffect(() => {
        const pwd = localStorage.getItem("admin-password") || "";
        fetch(`/api/sys?route=subscribers`, {
            headers: { Authorization: `Bearer ${pwd}` },
        })
            .then(r => r.json())
            .then(data => setSubscriberCount(data.count || 0))
            .catch(() => { });
    }, []);

    // Auto-populate trending articles
    const autoPopulate = () => {
        const posts = getPublishedPosts();
        const topPosts = posts.slice(0, 3).map(p => ({
            title: p.title,
            excerpt: p.excerpt || p.content?.slice(0, 150) || "",
            url: `https://pitchside-orcin.vercel.app/post/${p.id}`,
        }));
        setArticles(topPosts);
    };

    const addArticle = () => {
        setArticles([...articles, { title: "", excerpt: "", url: "" }]);
    };

    const removeArticle = (index: number) => {
        setArticles(articles.filter((_, i) => i !== index));
    };

    const updateArticle = (index: number, field: keyof NewsletterArticle, value: string) => {
        setArticles(articles.map((a, i) => i === index ? { ...a, [field]: value } : a));
    };

    const handlePreview = async () => {
        if (articles.length === 0) return;
        setPreviewing(true);
        setPreviewHtml("");
        try {
            const pwd = localStorage.getItem("admin-password") || "";
            const res = await fetch("/api/sys?route=newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${pwd}` },
                body: JSON.stringify({ action: "preview", subject, intro, articles }),
            });
            const data = await res.json();
            if (res.ok) setPreviewHtml(data.html);
        } catch (e) { console.error(e); }
        setPreviewing(false);
    };

    const handleSend = async () => {
        if (articles.length === 0 || sending) return;
        if (!confirm(`Send newsletter to ${subscriberCount} subscribers? This cannot be undone.`)) return;

        setSending(true);
        setResult(null);
        try {
            const pwd = localStorage.getItem("admin-password") || "";
            const res = await fetch("/api/sys?route=newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${pwd}` },
                body: JSON.stringify({ action: "send", subject, intro, articles }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                alert(data.error || "Failed to send newsletter");
            }
        } catch (e) { console.error(e); }
        setSending(false);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <Mail className="w-6 h-6 text-[#16A34A]" /> Newsletter
                    </h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    onClick={autoPopulate}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#16A34A] bg-[#16A34A]/10 rounded-xl hover:bg-[#16A34A]/20 transition-colors"
                >
                    Auto-populate trending
                </button>
            </div>

            {/* Result banner */}
            {result && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${result.failed === 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-orange-500/10 border border-orange-500/20"}`}>
                    {result.failed === 0 ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-orange-500" />}
                    <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                        Newsletter sent to {result.sent} subscriber{result.sent !== 1 ? "s" : ""}
                        {result.failed > 0 && <span className="text-orange-500"> ({result.failed} failed)</span>}
                    </p>
                </div>
            )}

            <div className="space-y-5">
                {/* Subject */}
                <div>
                    <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Subject Line</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 transition-all font-medium"
                    />
                </div>

                {/* Intro */}
                <div>
                    <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Intro Text</label>
                    <textarea
                        value={intro}
                        onChange={e => setIntro(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 transition-all text-sm resize-none"
                    />
                </div>

                {/* Articles */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-[#0F172A] dark:text-gray-300">Articles ({articles.length})</label>
                        <button onClick={addArticle} className="flex items-center gap-1 text-xs font-semibold text-[#16A34A] hover:underline">
                            <Plus className="w-3 h-3" /> Add article
                        </button>
                    </div>
                    {articles.length === 0 && (
                        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            No articles yet. Click "Auto-populate trending" or add manually.
                        </p>
                    )}
                    <div className="space-y-3">
                        {articles.map((article, i) => (
                            <div key={i} className="p-4 bg-gray-50 dark:bg-[#0F172A]/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <input
                                        type="text"
                                        value={article.title}
                                        onChange={e => updateArticle(i, "title", e.target.value)}
                                        placeholder="Article title"
                                        className="flex-1 bg-transparent text-sm font-semibold text-[#0F172A] dark:text-white focus:outline-none placeholder:text-gray-400"
                                    />
                                    <button onClick={() => removeArticle(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={article.excerpt}
                                    onChange={e => updateArticle(i, "excerpt", e.target.value)}
                                    placeholder="Short excerpt..."
                                    className="w-full bg-transparent text-xs text-gray-500 dark:text-gray-400 focus:outline-none placeholder:text-gray-400"
                                />
                                <input
                                    type="url"
                                    value={article.url}
                                    onChange={e => updateArticle(i, "url", e.target.value)}
                                    placeholder="https://pitchside-orcin.vercel.app/post/..."
                                    className="w-full bg-transparent text-xs text-[#16A34A] focus:outline-none placeholder:text-gray-400"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handlePreview}
                        disabled={previewing || articles.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#0F172A] dark:text-white bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                    >
                        {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Preview
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || articles.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#16A34A] rounded-xl hover:bg-[#15803d] transition-colors disabled:opacity-40 shadow-lg shadow-[#16A34A]/20"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send to {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
                    </button>
                </div>

                {/* Preview */}
                {previewHtml && (
                    <div className="mt-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Email Preview
                        </div>
                        <div className="p-4 bg-white dark:bg-[#1a1f2e]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                )}
            </div>
        </>
    );
}
