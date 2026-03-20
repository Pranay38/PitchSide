import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";
import { Bookmark, MessageSquare, Heart, ArrowLeft, User, Settings, Calendar, Share, Sparkles, Bell, Search, Shield, X } from "lucide-react";
import { getAllClubs, getClubByName, searchClubsOnline, type Club, type SearchResult } from "../data/clubs";

interface SavedArticle {
    id: string;
    title: string;
    excerpt?: string;
    savedAt: number;
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function ProfilePage() {
    const [activeTab, setActiveTab] = useState<"saved" | "activity" | "settings">("saved");
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
    const [favoriteClub, setFavoriteClub] = useState<string | null>(null);
    const [fanClub, setFanClub] = useState<{ name: string; logoUrl: string | null; league?: string } | null>(null);
    const [followedClubsCount, setFollowedClubsCount] = useState(0);
    const [votesCount, setVotesCount] = useState(0);
    const [wrappedUrl, setWrappedUrl] = useState<string | null>(null);
    const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">("default");

    // Club selector state
    const [clubSearchTerm, setClubSearchTerm] = useState("");
    const [showClubPicker, setShowClubPicker] = useState(false);
    const [onlineResults, setOnlineResults] = useState<SearchResult[]>([]);
    const [searchingOnline, setSearchingOnline] = useState(false);

    useEffect(() => {
        if ("Notification" in window) {
            setPushStatus(Notification.permission);
        }
        // Load saved articles from localStorage
        try {
            const saved = JSON.parse(localStorage.getItem("saved-posts") || "[]");
            setSavedArticles(saved);
        } catch { /* empty */ }

        setFavoriteClub(localStorage.getItem("favoriteClub") || null);

        // Load fan club badge
        try {
            const raw = localStorage.getItem("pitchside_fan_club");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.name) setFanClub(parsed);
            }
        } catch { /* empty */ }

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

    const subscribeToPush = async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            alert("Push notifications are not supported by your browser.");
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setPushStatus("denied");
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            if (!publicVapidKey) throw new Error("VAPID public key missing from env");
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription)
            });

            setPushStatus("granted");
            alert("Successfully configured Web Push Alerts.");
        } catch (e: any) {
            console.error("Failed to subscribe to push notifications:", e);
            alert("Something went wrong enabling notifications.");
        }
    };

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
                            {(fanClub || favoriteClub) && (
                                    <span className="text-xs font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                        {fanClub?.logoUrl && (
                                            <img src={fanClub.logoUrl} alt="" className="w-4 h-4 object-contain" />
                                        )}
                                        ⚽ {fanClub?.name || favoriteClub}
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

                        {/* Fan Club Badge Selector */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50">
                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#16A34A]" />
                                Club Allegiance
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                Your club badge appears on your comments for everyone to see.
                            </p>

                            {/* Current selection */}
                            {fanClub && (
                                <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-[#16A34A]/5 border border-[#16A34A]/20">
                                    {fanClub.logoUrl && (
                                        <img src={fanClub.logoUrl} alt={fanClub.name} className="w-8 h-8 object-contain" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">{fanClub.name}</p>
                                        {fanClub.league && <p className="text-[10px] text-gray-500">{fanClub.league}</p>}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setFanClub(null);
                                            localStorage.removeItem("pitchside_fan_club");
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Search / Picker */}
                            <div className="relative">
                                <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#0F172A] px-3 py-2">
                                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={clubSearchTerm}
                                        onChange={(e) => {
                                            setClubSearchTerm(e.target.value);
                                            setShowClubPicker(true);
                                            // Online search debounce
                                            if (e.target.value.length >= 3) {
                                                setSearchingOnline(true);
                                                searchClubsOnline(e.target.value).then((r) => {
                                                    setOnlineResults(r);
                                                    setSearchingOnline(false);
                                                });
                                            } else {
                                                setOnlineResults([]);
                                            }
                                        }}
                                        onFocus={() => setShowClubPicker(true)}
                                        placeholder="Search for your club..."
                                        className="w-full bg-transparent text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400 focus:outline-none"
                                    />
                                </div>

                                {showClubPicker && clubSearchTerm.length > 0 && (
                                    <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                                        {(() => {
                                            const localClubs = getAllClubs().filter((c) =>
                                                c.name.toLowerCase().includes(clubSearchTerm.toLowerCase())
                                            );
                                            const localNames = new Set(localClubs.map((c) => c.name.toLowerCase()));
                                            const uniqueOnline = onlineResults.filter(
                                                (r) => !localNames.has(r.name.toLowerCase())
                                            );
                                            const allResults = [
                                                ...localClubs.map((c) => ({ name: c.name, league: c.league, logo: c.logo })),
                                                ...uniqueOnline.map((r) => ({ name: r.name, league: r.league, logo: r.logo })),
                                            ];

                                            if (allResults.length === 0) {
                                                return (
                                                    <div className="px-4 py-3 text-sm text-gray-500">
                                                        {searchingOnline ? "Searching..." : "No clubs found"}
                                                    </div>
                                                );
                                            }

                                            return allResults.slice(0, 8).map((club) => (
                                                <button
                                                    key={club.name}
                                                    onClick={() => {
                                                        const badge = { name: club.name, logoUrl: club.logo || null, league: club.league };
                                                        setFanClub(badge);
                                                        localStorage.setItem("pitchside_fan_club", JSON.stringify(badge));
                                                        setClubSearchTerm("");
                                                        setShowClubPicker(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                                >
                                                    {club.logo ? (
                                                        <img src={club.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                            {club.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">{club.name}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{club.league}</p>
                                                    </div>
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notification preference info */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50">
                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2">Push Notifications</label>
                            <p className="text-sm text-gray-500 mb-4">
                                Receive instant alerts when major transfer bombs drop or your favorite clubs make news.
                            </p>
                            
                            {pushStatus === "granted" ? (
                                <div className="inline-flex items-center gap-2 bg-[#16A34A]/10 text-[#16A34A] px-4 py-2 rounded-lg text-sm font-bold">
                                    <Bell className="w-4 h-4" /> Receive Alerts Actively
                                </div>
                            ) : pushStatus === "denied" ? (
                                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-sm font-bold">
                                    Needs System Permission
                                </div>
                            ) : (
                                <button
                                    onClick={subscribeToPush}
                                    className="bg-[#16A34A] hover:bg-[#15803d] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
                                >
                                    <Bell className="w-4 h-4" /> Enable Web Push
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
