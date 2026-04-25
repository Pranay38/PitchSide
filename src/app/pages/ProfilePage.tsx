"use client";
import { useState, useEffect, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { Header } from "../components/Header";
import { SEO } from "../components/SEO";
import { Bookmark, MessageSquare, Heart, ArrowLeft, User, Settings, Calendar, Share, Sparkles, Bell, Search, Shield, X, Mail, Clock } from "lucide-react";
import { getAllClubs, getClubByName, searchClubsOnline, type Club, type SearchResult } from "../data/clubs";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { getAllPosts } from "../lib/postStorage";
import { getAvatarUrl } from "../lib/avatar";

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
    const { user } = useUser();
    const { 
        savedPosts, 
        fanClub, 
        setFanClub, 
        newsletterOptIn, 
        setNewsletterOptIn,
        loading: preferencesLoading,
        followedClubs,
        readingHistory
    } = useUserPreferences();

    const [activeTab, setActiveTab] = useState<"history" | "saved" | "activity" | "settings" | "ai">("history");
    const [userComments, setUserComments] = useState<any[]>([]);
    const [userCommentsLoading, setUserCommentsLoading] = useState(false);
    const [aiHistory, setAiHistory] = useState<any[]>([]);
    const [aiHistoryLoading, setAiHistoryLoading] = useState(false);
    
    // Derived saved articles
    const savedArticles = useMemo(() => {
        const all = getAllPosts();
        return all.filter(p => savedPosts.includes(p.id));
    }, [savedPosts]);

    const historyArticles = useMemo(() => {
        const all = getAllPosts();
        return readingHistory
            .map(h => {
                const post = all.find(p => p.id === h.postId);
                return post ? { ...post, viewedAt: h.viewedAt } : null;
            })
            .filter(Boolean);
    }, [readingHistory]);

    const [wrappedUrl, setWrappedUrl] = useState<string | null>(null);
    const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied">("default");
    const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

    const [clubSearchTerm, setClubSearchTerm] = useState("");
    const [showClubPicker, setShowClubPicker] = useState(false);
    const [onlineResults, setOnlineResults] = useState<SearchResult[]>([]);
    const [searchingOnline, setSearchingOnline] = useState(false);

    // Football Philosophy
    const [philosophy, setPhilosophy] = useState<"control" | "chaos" | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPhil = localStorage.getItem("pitchside_philosophy") as "control" | "chaos" | null;
            if (savedPhil) setPhilosophy(savedPhil);
        }
    }, []);

    const handlePhilosophyChange = (phil: "control" | "chaos") => {
        setPhilosophy(phil);
        localStorage.setItem("pitchside_philosophy", phil);
        toast.success(`Football philosophy set to: ${phil === 'control' ? 'Juego de Posición (Control)' : 'Heavy Metal Football (Chaos)'}`);
    };

    useEffect(() => {
        if ("Notification" in window) {
            setPushStatus(Notification.permission);
        }
    }, []);

    useEffect(() => {
        if (user?.id) {
            setUserCommentsLoading(true);
            fetch(`/api/comments?userId=${user.id}`)
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data)) setUserComments(data);
                })
                .catch(console.error)
                .finally(() => setUserCommentsLoading(false));

            setAiHistoryLoading(true);
            fetch(`/api/ai-history?userId=${user.id}`)
                .then(r => r.json())
                .then(data => {
                    if (Array.isArray(data)) setAiHistory(data);
                })
                .catch(console.error)
                .finally(() => setAiHistoryLoading(false));
        }
    }, [user?.id]);

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
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
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

    const userName = user?.fullName || user?.firstName || "Football Fan";
    const newsletterEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";

    const readingLevel = useMemo(() => {
        const count = historyArticles.length;
        if (count >= 50) return { label: "Tactical Obsessive", icon: "🧠", color: "text-purple-500", bg: "bg-purple-500/10" };
        if (count >= 20) return { label: "Season Ticket Holder", icon: "🏟️", color: "text-blue-500", bg: "bg-blue-500/10" };
        if (count >= 5) return { label: "Regular Matchgoer", icon: "⚽", color: "text-[#16A34A]", bg: "bg-[#16A34A]/10" };
        return { label: "Casual Supporter", icon: "👀", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" };
    }, [historyArticles.length]);

    const subscribeToNewsletter = async () => {
        if (!newsletterEmail) {
            toast.error("We could not find an email address on your account.");
            return;
        }
        if (preferencesLoading || newsletterOptIn || newsletterSubmitting) {
            return;
        }

        setNewsletterSubmitting(true);
        try {
            const res = await fetch("/api/subscribers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newsletterEmail }),
                credentials: "same-origin",
            });
            const payload = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    typeof payload.error === "string" ? payload.error : "Could not save your subscription.",
                );
            }

            setNewsletterOptIn(true);
            toast.success(payload.alreadySubscribed ? "You're already subscribed." : "Subscribed to the newsletter.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save your subscription.");
        } finally {
            setNewsletterSubmitting(false);
        }
    };

    const tabs = [
        { id: "history" as const, label: "History", icon: Clock },
        { id: "saved" as const, label: "Saved", icon: Bookmark, count: savedArticles.length },
        { id: "activity" as const, label: "Activity", icon: MessageSquare, count: userComments.length },
        { id: "ai" as const, label: "AI History", icon: Sparkles, count: aiHistory.length },
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
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg shadow-[#16A34A]/20 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <img src={getAvatarUrl(user?.id, userName)} alt={userName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-[#0F172A] dark:text-white">{userName}</h1>
                            <div className="flex items-center gap-3 mt-1">
                            {fanClub && (
                                    <span className="text-xs font-semibold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 inline-flex">
                                        {fanClub.logoUrl && (
                                            <img src={fanClub.logoUrl} alt="" className="w-4 h-4 object-contain" />
                                        )}
                                        ⚽ {fanClub.name}
                                    </span>
                                )}
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${readingLevel.bg} ${readingLevel.color}`}>
                                    {readingLevel.icon} {readingLevel.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 mt-6 pt-4 border-t border-[#16A34A]/10">
                        <div className="text-center">
                            <p className="text-lg font-black text-[#0F172A] dark:text-white">{historyArticles.length}</p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">History</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-[#0F172A] dark:text-white">{savedArticles.length}</p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Saved</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-[#0F172A] dark:text-white">{userComments.length}</p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Comments</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-[#0F172A] dark:text-white">{followedClubs.length}</p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Followed</p>
                        </div>
                    </div>
                </div>

                {/* The Touchline Dribble Wrapped Banner (Only from June 16th onwards each year) */}
                {(new Date().getMonth() > 5 || (new Date().getMonth() === 5 && new Date().getDate() >= 16) || (typeof window !== 'undefined' && localStorage.getItem("dev_force_wrapped") === "true")) && (
                    <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-[#0F172A] to-[#1E293B] border border-gray-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A] opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" /> Season in Review
                                </p>
                                <h2 className="text-2xl sm:text-3xl font-black font-outfit text-white mb-2">The Touchline Dribble Wrapped</h2>
                                <p className="text-sm text-gray-400">Your personalized end-of-season graphic is ready.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    const url = `/api/wrapped?username=${encodeURIComponent(userName)}&saved=${savedArticles.length}&clubs=${followedClubs.length}&debates=${userComments.length}&year=${new Date().getFullYear()}`;
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
                                    <img src={wrappedUrl} alt="The Touchline Dribble Wrapped Graphic" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <a 
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Here's my The Touchline Dribble Wrapped for ${new Date().getFullYear()}! ⚽🔥\n\nGenerate yours:`)}&url=${encodeURIComponent(window.location.origin)}`}
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
                {activeTab === "history" && (
                    <div>
                        {historyArticles.length === 0 ? (
                            <div className="text-center py-16">
                                <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                                <p className="text-gray-400 font-medium">No recently read articles</p>
                                <p className="text-gray-500 text-sm mt-1">Articles you read will securely appear here.</p>
                                <Link to="/" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#16A34A] hover:underline">
                                    <ArrowLeft className="w-4 h-4" /> Browse articles
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {historyArticles.map((article: any) => (
                                    <Link
                                        key={`${article.id}-${article.viewedAt}`}
                                        to={`/post/${article.slug || article.id}`}
                                        className="block p-4 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50 hover:border-[#16A34A]/30 transition-all group"
                                    >
                                        <h3 className="font-semibold text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">
                                            {article.title}
                                        </h3>
                                        {article.excerpt && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            Viewed {new Date(article.viewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

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
                                        to={`/post/${article.slug || article.id}`}
                                        className="block p-4 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50 hover:border-[#16A34A]/30 transition-all group"
                                    >
                                        <h3 className="font-semibold text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">
                                            {article.title}
                                        </h3>
                                        {article.excerpt && (
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            Published {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

                {activeTab === "ai" && (
                    <div>
                        {aiHistoryLoading ? (
                            <div className="text-center py-16 flex justify-center">
                                <Sparkles className="w-6 h-6 animate-spin text-[#16A34A] mb-3" />
                            </div>
                        ) : aiHistory.length === 0 ? (
                            <div className="text-center py-16">
                                <Sparkles className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                                <p className="text-gray-400 font-medium">No AI History yet</p>
                                <p className="text-gray-500 text-sm mt-1">Interact with AI features like the Rumor Mill to generate insights.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {aiHistory.map((item) => (
                                    <div key={item.id} className="p-5 rounded-2xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {item.type === "rumour-rater" ? "Rumor Analysis" : item.type}
                                            </span>
                                            <span className="text-[10px] text-gray-400 ml-auto">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-[#0F172A] dark:text-gray-300 mb-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                            "{item.prompt}"
                                        </p>
                                        <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-4 text-sm text-purple-800 dark:text-purple-300 whitespace-pre-wrap">
                                            {typeof item.response === 'string' ? item.response : JSON.stringify(item.response)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                    if (val && user) user.update({ firstName: val, lastName: "" }).catch(console.error);
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

                        {/* Newsletter Preference */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50">
                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#16A34A]" /> Email Newsletter
                            </label>
                            <div className="mt-2 space-y-4">
                                <p className="text-sm text-gray-500">
                                    Receive our weekly roundup of the biggest stories, transfers, and fan debates directly in your inbox.
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Delivery Email
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-[#0F172A] dark:text-white break-all">
                                            {newsletterEmail || "No email found on your account"}
                                        </p>
                                    </div>

                                    {preferencesLoading ? (
                                        <span className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                            Checking status...
                                        </span>
                                    ) : newsletterOptIn ? (
                                        <span className="inline-flex items-center justify-center rounded-xl bg-[#16A34A]/10 px-4 py-2.5 text-sm font-bold text-[#16A34A]">
                                            Newsletter Active
                                        </span>
                                    ) : (
                                        <button
                                            onClick={subscribeToNewsletter}
                                            disabled={newsletterSubmitting || !newsletterEmail}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#16A34A]/20 transition-all hover:bg-[#15803d] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                                        >
                                            <Mail className="w-4 h-4" />
                                            {newsletterSubmitting ? "Subscribing..." : "Subscribe"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Football Philosophy Selector */}
                        <div className="p-5 rounded-xl bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-gray-800/50">
                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#16A34A]" /> Football Philosophy
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Do you prefer the methodical beauty of positional play, or the heavy metal intensity of transition football?
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                <button
                                    onClick={() => handlePhilosophyChange("control")}
                                    className={`relative p-4 rounded-xl border text-left transition-all ${
                                        philosophy === "control"
                                            ? "bg-[#16A34A]/10 border-[#16A34A] shadow-sm"
                                            : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[11px] font-black uppercase tracking-[0.18em] ${philosophy === "control" ? "text-[#16A34A]" : "text-gray-500"}`}>
                                            Juego de Posición
                                        </span>
                                        {philosophy === "control" && <div className="w-2 h-2 rounded-full bg-[#16A34A]" />}
                                    </div>
                                    <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Control</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Possession, passing networks, maintaining structure.</p>
                                </button>
                                
                                <button
                                    onClick={() => handlePhilosophyChange("chaos")}
                                    className={`relative p-4 rounded-xl border text-left transition-all ${
                                        philosophy === "chaos"
                                            ? "bg-[#16A34A]/10 border-[#16A34A] shadow-sm"
                                            : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[11px] font-black uppercase tracking-[0.18em] ${philosophy === "chaos" ? "text-red-500" : "text-gray-500"}`}>
                                            Gegenpressing
                                        </span>
                                        {philosophy === "chaos" && <div className="w-2 h-2 rounded-full bg-red-500" />}
                                    </div>
                                    <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-1">Chaos</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">High intensity, rapid transitions, exploiting space.</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
