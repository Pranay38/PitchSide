import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";
import { Bookmark, MessageSquare, Heart, ArrowLeft, User, Settings, Calendar, Share, Sparkles } from "lucide-react";

interface SavedArticle {
    id: string;
    title: string;
    excerpt?: string;
    savedAt: number;
}

export function ProfilePage() {
    const [activeTab, setActiveTab] = useState<"saved" | "activity" | "settings">("saved");
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
    const [favoriteClub, setFavoriteClub] = useState<string | null>(null);
    const [followedClubsCount, setFollowedClubsCount] = useState(0);
    const [votesCount, setVotesCount] = useState(0);
    const [wrappedUrl, setWrappedUrl] = useState<string | null>(null);

    useEffect(() => {
        // Load saved articles from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem("saved-posts") || "[]");
            setSavedArticles(saved);
        } catch { /* empty */ }

        setFavoriteClub(localStorage.getItem("favoriteClub") || null);

        try {
            const clubs = JSON.parse(localStorage.getItem("pitchside_followed_clubs") || "[]");
            setFollowedClubsCount(clubs.length);
        } catch { /* empty */ }

        // Count votes by looking at localStorage keys starting with specific patterns if tracked locally
        let vCount = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith("hasVoted") || key.startsWith("pitchside_voted"))) {
                vCount++;
            }
        }
        setVotesCount(vCount);
    }, []);

    const userName = localStorage.getItem("pitchside-username") || "Football Fan";

    const tabs = [
        { id: "saved" as const, label: "Saved", icon: Bookmark, count: savedArticles.length },
        { id: "activity" as const, label: "Activity", icon: MessageSquare },
        { id: "settings" as const, label: "Settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0e1a] transition-colors">
            <SEO title="Your Profile" description="Manage your saved articles, activity, and preferences." />
            <Header />

            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Profile header */}
                <div className="relative rounded-2xl bg-gradient-to-br from-[#16A34A]/10 via-emerald-500/5 to-transparent border border-[#16A34A]/10 p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#4ade80] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#16A34A]/20">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-[#0F172A] dark:text-white">{userName}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                {favoriteClub && (
                                    <span className="text-xs font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full">
                                        ⚽ {favoriteClub}
                                    </span>
                                )}
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Joined recently
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-6 mt-6 pt-4 border-t border-[#16A34A]/10">
                        <div className="text-center">
                            <p className="text-lg font-black text-[#0F172A] dark:text-white">{savedArticles.length}</p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Saved</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-[#0F172A] dark:text-white">0</p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Comments</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-[#0F172A] dark:text-white">{votesCount}</p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Votes</p>
                        </div>
                    </div>
                </div>

                {/* Pitchside Wrapped Banner (Only from June 16th onwards each year) */}
                {(new Date().getMonth() > 5 || (new Date().getMonth() === 5 && new Date().getDate() >= 16) || localStorage.getItem("dev_force_wrapped") === "true") && (
                    <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-[#0F172A] to-[#1E293B] border border-gray-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A] opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" /> Season in Review
                                </p>
                                <h2 className="text-2xl sm:text-3xl font-black font-outfit text-white mb-2">Pitchside Wrapped</h2>
                                <p className="text-sm text-gray-400">Your personalized end-of-season graphic is ready.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    const url = `/api/wrapped?username=${encodeURIComponent(userName)}&saved=${savedArticles.length}&clubs=${followedClubsCount}&debates=${votesCount}&year=${new Date().getFullYear()}`;
                                    setWrappedUrl(url);
                                }}
                                className="bg-[#16A34A] hover:bg-[#15803d] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#16A34A]/30 transition-all active:scale-95 whitespace-nowrap"
                            >
                                Generate My Wrapped
                            </button>
                        </div>

                        {wrappedUrl && (
                            <div className="mt-8 relative z-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <h3 className="text-white text-sm font-bold mb-3">Your Graphic is Ready:</h3>
                                <div className="rounded-xl overflow-hidden border border-gray-800 bg-black/50 aspect-[1200/630] relative shadow-2xl">
                                    <img src={wrappedUrl} alt="Pitchside Wrapped Graphic" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <a 
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Here's my Pitchside Wrapped for ${new Date().getFullYear()}! ⚽🔥\n\nGenerate yours:`)}&url=${encodeURIComponent(window.location.origin)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-black hover:bg-gray-900 border border-gray-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        <Share className="w-4 h-4" /> Share to X
                                    </a>
                                    <a 
                                        href={wrappedUrl}
                                        download={`pitchside-wrapped-${new Date().getFullYear()}.svg`}
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Download SVG
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab bar */}
                <div className="flex gap-1 mb-6 bg-gray-100/50 dark:bg-white/5 rounded-xl p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === tab.id
                                    ? "bg-white dark:bg-[#1E293B] text-[#16A34A] shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="text-[10px] bg-[#16A34A]/10 text-[#16A34A] px-1.5 py-0.5 rounded-full font-bold">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === "saved" && (
                    <div>
                        {savedArticles.length === 0 ? (
                            <div className="text-center py-16">
                                <Bookmark className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                                <p className="text-gray-400 font-medium">No saved articles yet</p>
                                <p className="text-gray-500 text-sm mt-1">Tap the bookmark icon on any article to save it here.</p>
                                <Link to="/" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#16A34A] hover:underline">
                                    <ArrowLeft className="w-4 h-4" /> Browse articles
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedArticles.map((article) => (
                                    <Link
                                        key={article.id}
                                        to={`/post/${article.id}`}
                                        className="block p-4 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50 hover:border-[#16A34A]/30 transition-all group"
                                    >
                                        <h3 className="font-semibold text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">
                                            {article.title}
                                        </h3>
                                        {article.excerpt && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            Saved {new Date(article.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "activity" && (
                    <div className="text-center py-16">
                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-gray-400 font-medium">No activity yet</p>
                        <p className="text-gray-500 text-sm mt-1">Your comments and votes will appear here.</p>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="space-y-4">
                        {/* Username */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50">
                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Display Name</label>
                            <input
                                type="text"
                                defaultValue={userName}
                                onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val) localStorage.setItem("pitchside-username", val);
                                }}
                                maxLength={30}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 transition-all text-sm"
                            />
                        </div>

                        {/* Favorite Club */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50">
                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Favorite Club</label>
                            <p className="text-sm text-gray-500">
                                {favoriteClub ? (
                                    <span className="text-[#16A34A] font-semibold">⚽ {favoriteClub}</span>
                                ) : (
                                    "No club selected"
                                )}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Change your club from the homepage header.</p>
                        </div>

                        {/* Notification preference info */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50">
                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Push Notifications</label>
                            <p className="text-sm text-gray-500">
                                Manage notifications from the 🔔 bell icon in the header.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
