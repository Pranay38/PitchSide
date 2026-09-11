import { useState } from "react";
import { Share2, Copy, Check, Loader2 } from "lucide-react";

interface SyndicationSettingsProps {
    syndication: { reddit?: boolean; substack?: boolean; medium?: boolean };
    setSyndication: (val: { reddit?: boolean; substack?: boolean; medium?: boolean }) => void;
    postId?: string;
}

export function SyndicationSettings({ syndication, setSyndication, postId }: SyndicationSettingsProps) {
    const [enabled, setEnabled] = useState(syndication.reddit || syndication.substack || syndication.medium || false);
    const [previewData, setPreviewData] = useState<{ reddit?: string; substack?: string; medium?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const togglePlatform = (platform: 'reddit' | 'substack' | 'medium') => {
        setSyndication({ ...syndication, [platform]: !syndication[platform] });
    };

    const handlePreview = async () => {
        if (!postId) {
            setError("You must save the post first before previewing syndication.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const platforms = [];
            if (syndication.reddit) platforms.push('reddit');
            if (syndication.substack) platforms.push('substack');
            if (syndication.medium) platforms.push('medium');

            const res = await fetch('/api/syndicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId, platforms })
            });

            if (!res.ok) throw new Error("Failed to generate preview");
            
            const data = await res.json();
            setPreviewData(data);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (platform: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(platform);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white">
                    <Share2 className="w-4 h-4 text-purple-500" />
                    Content Syndication
                </label>
                <label className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={enabled}
                            onChange={(e) => {
                                setEnabled(e.target.checked);
                                if (!e.target.checked) {
                                    setSyndication({});
                                }
                            }}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                </label>
            </div>

            {enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={!!syndication.reddit}
                                onChange={() => togglePlatform('reddit')}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-[#0F172A] dark:text-white">Reddit Cross-post (r/soccer, r/PremierLeague)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={!!syndication.substack}
                                onChange={() => togglePlatform('substack')}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-[#0F172A] dark:text-white">Substack Cross-post</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={!!syndication.medium}
                                onChange={() => togglePlatform('medium')}
                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium text-[#0F172A] dark:text-white">Medium Cross-post</span>
                        </label>
                    </div>

                    {(syndication.reddit || syndication.substack || syndication.medium) && (
                        <button
                            type="button"
                            onClick={handlePreview}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                            Generate Syndication Previews
                        </button>
                    )}

                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

                    {previewData && (
                        <div className="space-y-4 mt-4">
                            {previewData.reddit && syndication.reddit && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Reddit Format</h4>
                                        <button onClick={() => handleCopy('reddit', previewData.reddit!)} className="text-gray-500 hover:text-purple-500">
                                            {copied === 'reddit' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans bg-white dark:bg-[#0F172A] p-3 rounded-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                                        {previewData.reddit}
                                    </pre>
                                </div>
                            )}
                            {previewData.substack && syndication.substack && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Substack Format</h4>
                                        <button onClick={() => handleCopy('substack', previewData.substack!)} className="text-gray-500 hover:text-purple-500">
                                            {copied === 'substack' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-[#0F172A] p-3 rounded-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewData.substack }} />
                                </div>
                            )}
                            {previewData.medium && syndication.medium && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Medium Format</h4>
                                        <button onClick={() => handleCopy('medium', previewData.medium!)} className="text-gray-500 hover:text-purple-500">
                                            {copied === 'medium' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-[#0F172A] p-3 rounded-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewData.medium }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
