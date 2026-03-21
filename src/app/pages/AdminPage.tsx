import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import type { BlogPost } from "../data/posts";
import { AdminLogin } from "../components/AdminLogin";
import { PostEditor } from "../components/PostEditor";
import { ThemeToggle } from "../components/ThemeToggle";
import {
    isAdminAuthenticated,
    adminLogout,
    getAllPosts,
    getAllPostsAsync,
    addPostAsync,
    updatePostAsync,
    deletePostAsync,
    exportPostsAsJSON,
    importPostsFromJSON,
} from "../lib/postStorage";
import {
    getSiteSettings,
    getSiteSettingsAsync,
    updateSiteSettingsAsync,
    type SiteSettings,
} from "../lib/siteSettingsStorage";
import { getAllClubNames } from "../data/clubs";
import type { StoryFeature } from "../data/stories";
import {
    calculateClubIntelligenceSummary,
    createDefaultClubIntelligence,
    getClubIntelligenceKey,
    normalizeClubIntelligence,
    type ClubIntelligence,
} from "../lib/clubIntelligence";
import {
    formatTransferWatchAmount,
    normalizeTransferWatchEntry,
    type TransferFeeMode,
    type TransferWatchStatus,
}
from "../lib/transferWatch";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { createDefaultPollOfWeek, normalizePollOfWeek } from "../lib/pollOfWeek";
import { Plus, Edit3, HelpCircle, Trash2, LogOut, Eye, ExternalLink, Download, Upload, Mail, Send, RadioTower, Library, Flame, Layout, ArrowUpDown, Filter, Repeat2, ScanSearch, BarChart3, LineChart, Image as ImageIcon, Mic, MessageSquare, Calendar, BarChart2, PenLine, Bell } from "lucide-react";
import { toast } from "sonner";
import { AdminRunInEditor } from "../components/AdminRunInEditor";
import { AdminTitleRaceTab } from "../components/admin/AdminTitleRaceTab";
import type { SupplementalEvent } from "../lib/siteSettingsStorage";

// Import Admin Tabs
import { AdminStoriesTab } from "../components/admin/AdminStoriesTab";
import { AdminCollectionsTab } from "../components/admin/AdminCollectionsTab";
import { AdminDebatesTab } from "../components/admin/AdminDebatesTab";
import { AdminPollsTab } from "../components/admin/AdminPollsTab";
import { AdminOnThisDayTab } from "../components/admin/AdminOnThisDayTab";
import { AdminTransferWatchTab } from "../components/admin/AdminTransferWatchTab";
import { AdminTransferTrackerTab } from "../components/admin/AdminTransferTrackerTab";
import { AdminSettingsTab } from "../components/admin/AdminSettingsTab";
import { AdminMatchRatingsTab } from "../components/admin/AdminMatchRatingsTab";
import { AdminNewsletterTab } from "../components/admin/AdminNewsletterTab";
import { AdminAnalyticsTab } from "../components/admin/AdminAnalyticsTab";
import { InstagramCarouselGenerator } from "../components/admin/InstagramCarouselGenerator";
import { DraftAssistant } from "../components/admin/DraftAssistant";
import { TweetThreadGenerator } from "../components/admin/TweetThreadGenerator";
import { AdminCalendarTab } from "../components/admin/AdminCalendarTab";
import { AdminMatchCenterTab } from "../components/admin/AdminMatchCenterTab";
import { AdminNotificationsTab } from "../components/admin/AdminNotificationsTab";
import { AdminPOTSTab } from "../components/admin/AdminPOTSTab";

type View = "list" | "create" | "edit";
type Tab = "notifications" | "pots" | "posts" | "stories" | "collections" | "debates" | "run-in" | "title-race" | "match-center" | "transfer-watch" | "transfer-tracker" | "on-this-day" | "settings" | "polls" | "match-ratings" | "newsletter" | "analytics" | "carousel-generator" | "draft-assistant" | "tweet-generator" | "calendar";

export function AdminPage() {
    const navigate = useNavigate();
    const [isAuthed, setIsAuthed] = useState(isAdminAuthenticated());
    const [view, setView] = useState<View>("list");
    const [activeTab, setActiveTab] = useState<Tab>("notifications");
    const [targetCarouselText, setTargetCarouselText] = useState("");
    const [showDebateEditor, setShowDebateEditor] = useState(false);
    const [expandedDebateId, setExpandedDebateId] = useState<string | null>(null);
    const [serverPolls, setServerPolls] = useState<any[]>([]);
    const [editingPoll, setEditingPoll] = useState<any>(null);
    const [savingPoll, setSavingPoll] = useState(false);
    
    const [serverMatchRatings, setServerMatchRatings] = useState<any[]>([]);
    const [editingMatchRating, setEditingMatchRating] = useState<any>(null);
    const [savingMatchRating, setSavingMatchRating] = useState(false);

    
    // Post Filters and Sorting
    const [postFilter, setPostFilter] = useState<"all" | "published" | "drafts">("all");
    const [postSort, setPostSort] = useState<"newest" | "oldest" | "a-z" | "z-a">("newest");

    const [posts, setPosts] = useState<BlogPost[]>(() => getAllPosts());
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

    const [subscriberCount, setSubscriberCount] = useState(0);
    const [notifyingPostId, setNotifyingPostId] = useState<string | null>(null);
    const [sendingDigest, setSendingDigest] = useState(false);

    const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getSiteSettings());
    const [savingSiteSettings, setSavingSiteSettings] = useState(false);
    const [savingPollOfWeek, setSavingPollOfWeek] = useState(false);
    const [savingClubIntelligence, setSavingClubIntelligence] = useState(false);
    const [savingTransferWatch, setSavingTransferWatch] = useState(false);
    const [stories, setStories] = useState<StoryFeature[]>(() => getAllStories(true));
    const [selectedClubForInsights, setSelectedClubForInsights] = useState("Arsenal");
    const [transferDraft, setTransferDraft] = useState({
        player: "",
        club: "Arsenal",
        feeMode: "million-usd" as TransferFeeMode,
        feeMillions: "",
        status: "rumor" as TransferWatchStatus,
        tier: 3,
    });
    const [transferFilterClub, setTransferFilterClub] = useState("all");

    const [eventDraft, setEventDraft] = useState<Partial<SupplementalEvent>>({
        dateMMDD: new Date().toISOString().slice(5, 10),
        year: new Date().getFullYear(),
        text: "",
        category: "event",
        thumbnail: "",
        articleUrl: "",
    });
    const [savingSupplementalEvent, setSavingSupplementalEvent] = useState(false);

    const [collections, setCollections] = useState<any[]>([]);
    const [debates, setDebates] = useState<any[]>([]);
    const clubOptions = useMemo(() => getAllClubNames().sort((left, right) => left.localeCompare(right)), []);
    const selectedClubInsight = useMemo(() => {
        const existing = siteSettings.clubIntelligence[getClubIntelligenceKey(selectedClubForInsights)];
        return existing || createDefaultClubIntelligence(selectedClubForInsights);
    }, [selectedClubForInsights, siteSettings.clubIntelligence]);
    const selectedClubInsightSummary = useMemo(
        () => calculateClubIntelligenceSummary(selectedClubInsight),
        [selectedClubInsight],
    );
    const filteredTransferWatchEntries = useMemo(() => {
        if (transferFilterClub === "all") return siteSettings.transferWatch;
        return siteSettings.transferWatch.filter((entry) => entry.club === transferFilterClub);
    }, [siteSettings.transferWatch, transferFilterClub]);

    const fetchSubscriberCount = useCallback(async () => {
        try {
            const res = await fetch("/api/subscribers");
            if (res.ok) {
                const data = await res.json();
                setSubscriberCount(data.count || 0);
            }
        } catch { }
    }, []);

    const fetchCollections = useCallback(async () => {
        try {
            const res = await fetch("/api/collections");
            if (res.ok) setCollections(await res.json());
        } catch { }
    }, []);

    const fetchDebates = useCallback(async () => {
        try {
            const res = await fetch("/api/debates");
            if (res.ok) setDebates(await res.json());
        } catch { }
    }, []);
    const fetchServerPolls = useCallback(async () => {
        try {
            const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const res = await fetch("/api/polls", {
                headers: { Authorization: `Bearer ${pwd}` }
            });
            if (res.ok) setServerPolls(await res.json());
        } catch {}
    }, []);

    const fetchServerMatchRatings = useCallback(async () => {
        try {
            const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const res = await fetch("/api/match-ratings", {
                headers: { Authorization: `Bearer ${pwd}` }
            });
            if (res.ok) setServerMatchRatings(await res.json());
        } catch {}
    }, []);


    const refreshPosts = useCallback(async () => {
        const latest = await getAllPostsAsync();
        setPosts(latest);
    }, []);

    const refreshStories = useCallback(async () => {
        const latest = await getAllStoriesAsync(true);
        setStories(latest);
    }, []);

    useEffect(() => {
        if (isAuthed) {
            refreshPosts();
            refreshStories();
            fetchSubscriberCount();
            fetchCollections();
            fetchDebates();
            fetchServerPolls();
            fetchServerMatchRatings();
            getSiteSettingsAsync()
                .then((settings) => setSiteSettings(settings))
                .catch(() => { });
        }
    }, [isAuthed, refreshPosts, refreshStories, fetchSubscriberCount, fetchCollections, fetchDebates, fetchServerPolls, fetchServerMatchRatings]);

    const handleLogin = () => setIsAuthed(true);
    const handleLogout = () => { adminLogout(); setIsAuthed(false); };

    // Post Handlers
    const handleCreatePost = async (postData: Omit<BlogPost, "id">) => {
        try {
            const updated = await addPostAsync(postData);
            setPosts(updated);

            if (postData.isDraft) {
                // It was an auto-save, stay in the editor but switch to edit mode
                // The newly created post is the first one in the returned array from addPostAsync
                const newPost = updated[0];
                setEditingPost(newPost);
                setView("edit");
            } else {
                // Explicit publish click
                setView("list");
                toast.success("Post published successfully!");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save post.");
        }
    };

    const handleEditPost = (post: BlogPost) => {
        setEditingPost(post);
        setView("edit");
    };

    const handleUpdatePost = async (postData: Omit<BlogPost, "id">) => {
        if (editingPost) {
            try {
                const updated = await updatePostAsync(editingPost.id, postData);
                setPosts(updated);

                if (postData.isDraft) {
                    // It was an auto-save, just update the currently editing post quietly
                    const updatedPost = updated.find(p => p.id === editingPost.id);
                    if (updatedPost) setEditingPost(updatedPost);
                } else {
                    // Explicit publish or update
                    setEditingPost(null);
                    setView("list");
                    toast.success("Post updated successfully!");
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update post.");
            }
        }
    };

    const handleDeletePost = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this post? This cannot be undone.")) {
            try {
                const updated = await deletePostAsync(id);
                setPosts(updated);
                toast.success("Post deleted.");
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to delete post.");
            }
        }
    };

    const notifySubscribers = async (post: BlogPost) => {
        if (subscriberCount === 0) return toast.info("No subscribers yet.");
        if (!window.confirm(`Send email notification about "${post.title}" to ${subscriberCount} subscriber(s)?`)) return;

        setNotifyingPostId(post.id);
        try {
            const res = await fetch("/api/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: post.title, excerpt: post.excerpt, postId: post.id }),
            });
            const data = await res.json();
            if (res.ok) toast.success(data.message || "Notifications sent!");
            else toast.error(data.error || "Failed to send notifications.");
        } catch {
            toast.error("Failed to send notifications.");
        }
        setNotifyingPostId(null);
    };

    const handleExport = () => {
        exportPostsAsJSON();
        toast.success("Posts exported! Move posts.json to your public/ folder.");
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imported = await importPostsFromJSON(file);
            setPosts(imported);
            toast.success(`Imported ${imported.length} posts successfully!`);
        } catch {
            toast.error("Failed to import valid posts.json");
        }
        if (importFileRef.current) importFileRef.current.value = "";
    };

    // Derived filtered and sorted posts
    const displayedPosts = [...posts]
        .filter(post => {
            if (postFilter === "published") return !post.isDraft;
            if (postFilter === "drafts") return post.isDraft;
            return true; // "all"
        })
        .sort((a, b) => {
            if (postSort === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (postSort === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
            if (postSort === "a-z") return a.title.localeCompare(b.title);
            if (postSort === "z-a") return b.title.localeCompare(a.title);
            return 0;
        });

    const handleSavePoll = async () => {
        try {
            setSavingPoll(true);
            const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const isEditing = !!editingPoll._id;
            const url = isEditing ? `/api/polls/${editingPoll._id}` : "/api/polls";
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${pwd}` },
                body: JSON.stringify(editingPoll),
            });
            if (res.ok) {
                toast.success("Poll saved");
                setEditingPoll(null);
                fetchServerPolls();
            } else {
                toast.error("Failed to save poll");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSavingPoll(false);
        }
    };

    const handleDeletePoll = async (id: string) => {
        if (!confirm("Delete this poll?")) return;
        try {
            const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const res = await fetch(`/api/polls/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${pwd}` } });
            if (res.ok) {
                toast.success("Poll deleted");
                fetchServerPolls();
            }
        } catch {
            toast.error("Network error");
        }
    };

    const handleSaveMatchRating = async () => {
        try {
            setSavingMatchRating(true);
            const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const isEditing = !!editingMatchRating._id;
            const url = isEditing ? `/api/match-ratings/${editingMatchRating._id}` : "/api/match-ratings";
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${pwd}` },
                body: JSON.stringify(editingMatchRating),
            });
            if (res.ok) {
                toast.success("Match Ratings saved");
                setEditingMatchRating(null);
                fetchServerMatchRatings();
            } else {
                toast.error("Failed to save match ratings");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSavingMatchRating(false);
        }
    };

    const handleDeleteMatchRating = async (id: string) => {
        if (!confirm("Delete these match ratings?")) return;
        try {
            const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const res = await fetch(`/api/match-ratings/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${pwd}` } });
            if (res.ok) {
                toast.success("Match Ratings deleted");
                fetchServerMatchRatings();
            }
        } catch {
            toast.error("Network error");
        }
    };

    const handleAddTransferWatchEntry = () => {
        const normalized = normalizeTransferWatchEntry({
            ...transferDraft,
            feeMillions: transferDraft.feeMillions,
            updatedAt: new Date().toISOString(),
        });

        if (!normalized) {
            toast.error("Add at least a player name and club before saving a transfer item.");
            return;
        }

        setSiteSettings((prev) => ({
            ...prev,
            transferWatch: [normalized, ...prev.transferWatch.filter((entry) => entry.id !== normalized.id)],
        }));
        setTransferDraft({
            player: "",
            club: transferDraft.club,
            feeMode: "million-usd",
            feeMillions: "",
            status: "rumor",
            tier: 3,
        });
        toast.success("Transfer watch item added to the draft feed.");
    };

    const handleDeleteTransferWatchEntry = (id: string) => {
        setSiteSettings((prev) => ({
            ...prev,
            transferWatch: prev.transferWatch.filter((entry) => entry.id !== id),
        }));
    };

    const handleSaveTransferWatch = async () => {
        setSavingTransferWatch(true);
        try {
            const updated = await updateSiteSettingsAsync({
                transferWatch: siteSettings.transferWatch,
            });
            setSiteSettings(updated);
            toast.success("Transfer watch updated.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save transfer watch.");
        } finally {
            setSavingTransferWatch(false);
        }
    };

    const handlePollFieldChange = (field: "enabled" | "title" | "description" | "question", value: string | boolean) => {
        setSiteSettings((prev) => ({
            ...prev,
            pollOfWeek: normalizePollOfWeek({
                ...prev.pollOfWeek,
                [field]: value,
            }),
        }));
    };

    const handlePollOptionChange = (index: number, text: string) => {
        setSiteSettings((prev) => ({
            ...prev,
            pollOfWeek: normalizePollOfWeek({
                ...prev.pollOfWeek,
                options: prev.pollOfWeek.options.map((option, optionIndex) => (
                    optionIndex === index
                        ? { ...option, text }
                        : option
                )),
            }),
        }));
    };

    const handleAddPollOption = () => {
        if (siteSettings.pollOfWeek.options.length >= 5) return;

        setSiteSettings((prev) => ({
            ...prev,
            pollOfWeek: normalizePollOfWeek({
                ...prev.pollOfWeek,
                options: [
                    ...prev.pollOfWeek.options,
                    {
                        id: `option-${prev.pollOfWeek.options.length + 1}`,
                        text: "",
                        votes: 0,
                    },
                ],
            }),
        }));
    };

    const handleRemovePollOption = (index: number) => {
        if (siteSettings.pollOfWeek.options.length <= 2) return;

        setSiteSettings((prev) => ({
            ...prev,
            pollOfWeek: normalizePollOfWeek({
                ...prev.pollOfWeek,
                options: prev.pollOfWeek.options.filter((_, optionIndex) => optionIndex !== index),
            }),
        }));
    };

    const handleResetPollDraft = () => {
        if (!window.confirm("Clear the current Poll of the Week draft?")) return;

        setSiteSettings((prev) => ({
            ...prev,
            pollOfWeek: createDefaultPollOfWeek(),
        }));
        toast.success("Poll draft cleared.");
    };

    const handleSavePollOfWeek = async () => {
        setSavingPollOfWeek(true);
        try {
            const normalized = normalizePollOfWeek(siteSettings.pollOfWeek);
            const filledOptions = normalized.options
                .map((option) => ({ ...option, text: option.text.trim() }))
                .filter((option) => option.text.length > 0)
                .slice(0, 5);

            if (normalized.enabled) {
                if (!normalized.question.trim()) {
                    throw new Error("Add a question before publishing the poll.");
                }

                if (filledOptions.length < 2) {
                    throw new Error("Add at least two answer options before publishing.");
                }
            }

            const timestamp = new Date().toISOString();
            const nextPoll = normalizePollOfWeek({
                ...normalized,
                id: normalized.enabled ? `poll-${Date.now()}` : normalized.id,
                title: normalized.title.trim() || "Poll of the Week",
                description: normalized.description.trim(),
                question: normalized.question.trim(),
                options: normalized.enabled
                    ? filledOptions.map((option, index) => ({
                        id: `option-${index + 1}-${Date.now()}`,
                        text: option.text,
                        votes: 0,
                    }))
                    : normalized.options,
                updatedAt: timestamp,
            });

            const updated = await updateSiteSettingsAsync({
                pollOfWeek: nextPoll,
            });
            setSiteSettings(updated);
            toast.success(nextPoll.enabled ? "Poll of the Week published." : "Poll of the Week saved.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save poll.");
        } finally {
            setSavingPollOfWeek(false);
        }
    };

    const handleSaveSocialWall = async () => {
        setSavingSiteSettings(true);
        try {
            const updated = await updateSiteSettingsAsync({
                socialWallEnabled: siteSettings.socialWallEnabled,
                socialWallTitle: siteSettings.socialWallTitle,
                socialWallEmbedCode: siteSettings.socialWallEmbedCode,
            });
            setSiteSettings(updated);
            toast.success("Social wall updated.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save the social wall.");
        } finally {
            setSavingSiteSettings(false);
        }
    };

    const handleSaveHomepageCuration = async () => {
        setSavingSiteSettings(true);
        try {
            const updated = await updateSiteSettingsAsync({
                homepageCuration: siteSettings.homepageCuration,
            });
            setSiteSettings(updated);
            toast.success("Homepage curation updated.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save homepage curation.");
        } finally {
            setSavingSiteSettings(false);
        }
    };

    const handleClubInsightChange = (field: keyof ClubIntelligence, value: string | number) => {
        setSiteSettings((prev) => {
            const key = getClubIntelligenceKey(selectedClubForInsights);
            const current = prev.clubIntelligence[key] || createDefaultClubIntelligence(selectedClubForInsights);
            const nextValue = field === "note" || field === "club" || field === "updatedAt" ? String(value) : Number(value);
            const normalized = normalizeClubIntelligence({
                ...current,
                club: selectedClubForInsights,
                [field]: nextValue,
                updatedAt: new Date().toISOString(),
            }, selectedClubForInsights);

            return {
                ...prev,
                clubIntelligence: {
                    ...prev.clubIntelligence,
                    [key]: normalized,
                },
            };
        });
    };

    const handleResetClubInsight = () => {
        if (!window.confirm(`Reset manual insight inputs for ${selectedClubForInsights}?`)) return;
        setSiteSettings((prev) => {
            const nextMap = { ...prev.clubIntelligence };
            delete nextMap[getClubIntelligenceKey(selectedClubForInsights)];
            return {
                ...prev,
                clubIntelligence: nextMap,
            };
        });
        toast.success(`Cleared manual data for ${selectedClubForInsights}.`);
    };

    const handleSaveClubIntelligence = async () => {
        setSavingClubIntelligence(true);
        try {
            const updated = await updateSiteSettingsAsync({
                clubIntelligence: siteSettings.clubIntelligence,
            });
            setSiteSettings(updated);
            toast.success(`Club intelligence saved for ${selectedClubForInsights}.`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save club intelligence.");
        } finally {
            setSavingClubIntelligence(false);
        }
    };

    const handleSendDigest = async () => {
        if (!window.confirm("Send weekly digest to all subscribers now?")) return;
        setSendingDigest(true);
        try {
            const res = await fetch("/api/digest", { method: "POST" });
            const data = await res.json();
            if (res.ok) toast.success(data.message || "Digest sent!");
            else toast.error(data.error || "Failed to send digest");
        } catch {
            toast.error("Error sending digest");
        }
        setSendingDigest(false);
    };

    if (!isAuthed) return <AdminLogin onLogin={handleLogin} />;

    if (view === "create" || view === "edit") {
        return (
            <PostEditor
                post={view === "edit" && editingPost ? editingPost : undefined}
                onSave={view === "edit" && editingPost ? handleUpdatePost : handleCreatePost}
                onCancel={() => {
                    setEditingPost(null);
                    setView("list");
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-[#16A34A] to-[#22c55e] bg-clip-text text-transparent">
                                The Touchline Dribble
                            </span>
                        </Link>
                        <span className="px-2 py-0.5 text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] rounded-full">Admin</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors">
                            <ExternalLink className="w-4 h-4" />
                            <span className="hidden sm:inline">View Site</span>
                        </Link>
                        <ThemeToggle />
                        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#64748B] dark:text-gray-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

            <main className="max-w-[1100px] mx-auto px-6 py-8">
                {/* Tabs Wrapper */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-8 pb-4">
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "notifications" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Bell className="w-4 h-4" /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab("pots")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "pots" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Trophy className="w-4 h-4" /> POTS Manager
                    </button>
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "posts" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Layout className="w-4 h-4" /> Posts
                    </button>
                    <button
                        onClick={() => setActiveTab("stories")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "stories" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ScanSearch className="w-4 h-4" /> Stories
                    </button>
                    <button
                        onClick={() => setActiveTab("collections")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "collections" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Library className="w-4 h-4" /> Collections
                    </button>                    
                    <button
                        onClick={() => setActiveTab("polls")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "polls" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <HelpCircle className="w-4 h-4" /> Polls (Server)
                    </button>
                    <button
                        onClick={() => setActiveTab("match-ratings")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "match-ratings" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <BarChart3 className="w-4 h-4" /> Fan Ratings
                    </button>
                    <button
                        onClick={() => setActiveTab("debates")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "debates" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Flame className="w-4 h-4" /> Debates
                    </button>
                    <button
                        onClick={() => setActiveTab("run-in")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "run-in" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ArrowUpDown className="w-4 h-4" /> Run-In Tracker
                    </button>
                    <button
                        onClick={() => setActiveTab("title-race")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "title-race" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ArrowUpDown className="w-4 h-4" /> Title Race
                    </button>
                    <button
                        onClick={() => setActiveTab("match-center")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "match-center" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Match Center
                    </button>
                    <button
                        onClick={() => setActiveTab("transfer-tracker")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "transfer-tracker" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Repeat2 className="w-4 h-4" /> Transfer Tracker
                    </button>
                    <button
                        onClick={() => setActiveTab("transfer-watch")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "transfer-watch" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Repeat2 className="w-4 h-4" /> Transfer Watch
                    </button>
                    <button
                        onClick={() => setActiveTab("on-this-day")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "on-this-day" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <span className="text-base leading-none">📅</span> On This Day
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "settings" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <RadioTower className="w-4 h-4" /> Settings & Newsletter
                    </button>
                    <button
                        onClick={() => setActiveTab("newsletter")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "newsletter" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Mail className="w-4 h-4" /> Newsletter
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "analytics" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <LineChart className="w-4 h-4" /> Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab("carousel-generator")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "carousel-generator" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Carousel Gen
                    </button>
                    <button
                        onClick={() => setActiveTab("draft-assistant")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "draft-assistant" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <PenLine className="w-4 h-4" /> Draft AI
                    </button>
                    <button
                        onClick={() => setActiveTab("tweet-generator")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "tweet-generator" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <MessageSquare className="w-4 h-4" /> Tweet Gen
                    </button>
                    <button
                        onClick={() => setActiveTab("calendar")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${activeTab === "calendar" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <span className="text-base leading-none">📅</span> Calendar
                    </button>
                </div>

                {/* POSTS TAB */}
                {activeTab === "posts" && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">Your Posts</h1>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">{posts.length} article{posts.length !== 1 ? "s" : ""} published</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                                    <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
                                </button>
                                <button onClick={() => importFileRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-[#64748B] dark:text-gray-400 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                                    <Upload className="w-4 h-4" /><span className="hidden sm:inline">Import</span>
                                </button>
                                <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25">
                                    <Plus className="w-4 h-4" />New Post
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setPostFilter("all")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${postFilter === "all" ? "bg-white dark:bg-[#0F172A] text-[#16A34A] shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                                >
                                    All ({posts.length})
                                </button>
                                <button
                                    onClick={() => setPostFilter("published")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${postFilter === "published" ? "bg-white dark:bg-[#0F172A] text-[#16A34A] shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                                >
                                    Published ({posts.filter(p => !p.isDraft).length})
                                </button>
                                <button
                                    onClick={() => setPostFilter("drafts")}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${postFilter === "drafts" ? "bg-white dark:bg-[#0F172A] text-[#16A34A] shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                                >
                                    Drafts ({posts.filter(p => p.isDraft).length})
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select 
                                    value={postSort}
                                    onChange={(e) => setPostSort(e.target.value as any)}
                                    className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-[#16A34A] focus:border-[#16A34A] block w-full p-2.5 outline-none cursor-pointer pr-8"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="a-z">Title (A-Z)</option>
                                    <option value="z-a">Title (Z-A)</option>
                                </select>
                            </div>
                        </div>

                        {displayedPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="text-5xl mb-4">📝</div>
                                <h2 className="text-lg font-semibold text-[#0F172A] dark:text-white mb-2">No posts yet</h2>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mb-6">Create your first blog post to get started.</p>
                                <button onClick={() => setView("create")} className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all">
                                    <Plus className="w-4 h-4" />Write Your First Post
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedPosts.map((post) => (
                                    <div key={post.id} className="flex items-center gap-4 p-4 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                                        {post.coverImage && (
                                            <div className="hidden sm:block w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-[#0F172A] dark:text-white text-sm truncate">{post.title}</h3>
                                                {post.isDraft && (
                                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded">Draft</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8] dark:text-gray-500">
                                                <span className="px-2 py-0.5 bg-[#16A34A]/10 text-[#16A34A] rounded-full font-medium">{post.club}</span>
                                                <span>{post.date}</span><span>•</span><span>{post.readTime}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => notifySubscribers(post)} disabled={notifyingPostId === post.id || post.isDraft} className={`p-2 rounded-lg ${post.isDraft ? 'opacity-50 cursor-not-allowed text-gray-400' : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors'}`} title="Notify Subscribers">
                                                <Send className={`w-4 h-4 ${notifyingPostId === post.id ? 'animate-pulse' : ''}`} />
                                            </button>
                                            <button onClick={() => {
                                                setTargetCarouselText(post.content);
                                                setActiveTab("carousel-generator");
                                            }} className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-[#64748B] dark:text-gray-400 hover:text-green-600 transition-colors" title="Create Carousel">
                                                <ImageIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => navigate(`/post/${post.id}`)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#64748B] dark:text-gray-400 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => handleEditPost(post)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[#64748B] dark:text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeletePost(post.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[#64748B] dark:text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* STORIES TAB */}
                {activeTab === "stories" && (
                    <AdminStoriesTab 
                        stories={stories}
                        setStories={setStories}
                    />
                )}

                {/* COLLECTIONS TAB */}
                {activeTab === "collections" && (
                    <AdminCollectionsTab 
                        collections={collections}
                        fetchCollections={fetchCollections}
                    />
                )}

                {/* POLLS TAB */}
                {activeTab === "polls" && (
                    <AdminPollsTab 
                        serverPolls={serverPolls}
                        editingPoll={editingPoll}
                        savingPoll={savingPoll}
                        setEditingPoll={setEditingPoll}
                        onSavePoll={handleSavePoll}
                        onDeletePoll={handleDeletePoll}
                    />
                )}

                {/* MATCH RATINGS TAB */}
                {activeTab === "match-ratings" && (
                    <AdminMatchRatingsTab
                        serverSessions={serverMatchRatings}
                        editingSession={editingMatchRating}
                        savingSession={savingMatchRating}
                        setEditingSession={setEditingMatchRating}
                        onSaveSession={handleSaveMatchRating}
                        onDeleteSession={handleDeleteMatchRating}
                    />
                )}

                {/* DEBATES TAB */}
                {activeTab === "debates" && (
                    <AdminDebatesTab 
                        debates={debates}
                        fetchDebates={fetchDebates}
                    />
                )}

                {/* RUN-IN TRACKER TAB */}
                {activeTab === "run-in" && (
                    <AdminRunInEditor />
                )}

                {/* TITLE RACE TAB */}
                {activeTab === "title-race" && (
                    <AdminTitleRaceTab />
                )}

                {/* MATCH CENTER TAB */}
                {activeTab === "match-center" && (
                    <AdminMatchCenterTab />
                )}

                {/* ON THIS DAY TAB */}
                {activeTab === "on-this-day" && (
                    <AdminOnThisDayTab 
                        siteSettings={siteSettings}
                        setSiteSettings={setSiteSettings}
                    />
                )}

                {/* TRANSFER TRACKER TAB */}
                {activeTab === "transfer-tracker" && (
                    <AdminTransferTrackerTab />
                )}

                {/* TRANSFER WATCH TAB */}
                {activeTab === "transfer-watch" && (
                    <AdminTransferWatchTab 
                        siteSettings={siteSettings}
                        transferDraft={transferDraft}
                        transferFilterClub={transferFilterClub}
                        filteredTransferWatchEntries={filteredTransferWatchEntries}
                        savingTransferWatch={savingTransferWatch}
                        setTransferDraft={setTransferDraft}
                        setTransferFilterClub={setTransferFilterClub}
                        handleAddTransferWatchEntry={handleAddTransferWatchEntry}
                        handleSaveTransferWatch={handleSaveTransferWatch}
                        handleDeleteTransferWatchEntry={handleDeleteTransferWatchEntry}
                        formatTransferWatchAmount={formatTransferWatchAmount}
                    />
                )}

                {/* SETTINGS TAB */}
                {activeTab === "settings" && (
                    <AdminSettingsTab 
                        siteSettings={siteSettings}
                        posts={posts}
                        stories={stories}
                        subscriberCount={subscriberCount}
                        sendingDigest={sendingDigest}
                        savingPollOfWeek={savingPollOfWeek}
                        savingSiteSettings={savingSiteSettings}
                        savingClubIntelligence={savingClubIntelligence}
                        selectedClubForInsights={selectedClubForInsights}
                        selectedClubInsight={selectedClubInsight}
                        selectedClubInsightSummary={selectedClubInsightSummary}
                        setSiteSettings={setSiteSettings}
                        clubOptions={clubOptions}
                        handleSendDigest={handleSendDigest}
                        handlePollFieldChange={handlePollFieldChange}
                        handleAddPollOption={handleAddPollOption}
                        handlePollOptionChange={handlePollOptionChange}
                        handleRemovePollOption={handleRemovePollOption}
                        handleSavePollOfWeek={handleSavePollOfWeek}
                        handleResetPollDraft={handleResetPollDraft}
                        handleSaveSocialWall={handleSaveSocialWall}
                        handleSaveHomepageCuration={handleSaveHomepageCuration}
                        setSelectedClubForInsights={setSelectedClubForInsights}
                        handleClubInsightChange={handleClubInsightChange}
                        handleSaveClubIntelligence={handleSaveClubIntelligence}
                        handleResetClubInsight={handleResetClubInsight}
                        normalizePollOfWeek={normalizePollOfWeek}
                    />
                )}

                {/* NEWSLETTER TAB */}
                {activeTab === "newsletter" && (
                    <AdminNewsletterTab />
                )}

                {/* ANALYTICS TAB */}
                {activeTab === "analytics" && (
                    <AdminAnalyticsTab />
                )}

                {/* CAROUSEL GENERATOR TAB */}
                {activeTab === "carousel-generator" && (
                    <InstagramCarouselGenerator 
                        initialText={targetCarouselText} 
                        key={targetCarouselText ? targetCarouselText.substring(0, 30) : "empty"} 
                    />
                )}

                {/* DRAFT ASSISTANT TAB */}
                {activeTab === "draft-assistant" && (
                    <DraftAssistant />
                )}

                {/* TWEET THREAD GENERATOR TAB */}
                {activeTab === "tweet-generator" && (
                    <TweetThreadGenerator />
                )}

                {/* CALENDAR TAB */}
                {activeTab === "calendar" && (
                    <AdminCalendarTab posts={posts} />
                )}

                {/* NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                    <AdminNotificationsTab />
                )}

                {/* POTS TAB */}
                {activeTab === "pots" && (
                    <AdminPOTSTab 
                        settings={siteSettings.pots} 
                        onSave={(pots) => updateSiteSettings({ pots })} 
                    />
                )}
            </main>
        </div>
    );
}
