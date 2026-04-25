"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { signOut } from "next-auth/react";
import type { BlogPost } from "../data/posts";
import { AdminLogin } from "../components/AdminLogin";
import { PostEditor } from "../components/PostEditor";
import { ThemeToggle } from "../components/ThemeToggle";
import {
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
    buildTransferDossierSlug,
    buildTransferTopic,
    formatTransferWatchAmount,
    normalizeTransferWatchEntry,
    type ScoutGrades,
    type TransferFeeMode,
    type TransferWatchEntry,
    type TransferWatchStatus,
}
from "../lib/transferWatch";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { createDefaultPollOfWeek, normalizePollOfWeek } from "../lib/pollOfWeek";
import { Plus, Edit3, HelpCircle, Trash2, LogOut, Eye, ExternalLink, Download, Upload, Mail, Send, RadioTower, Library, Flame, Layout, ArrowUpDown, Filter, Repeat2, ScanSearch, BarChart3, LineChart, Image as ImageIcon, Mic, MessageSquare, Calendar, BarChart2, PenLine, Bell, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { AdminRunInEditor } from "../components/AdminRunInEditor";
import { AdminTitleRaceTab } from "../components/admin/AdminTitleRaceTab";
import type { SupplementalEvent } from "../lib/siteSettingsStorage";

import dynamic from 'next/dynamic';

const AdminStoriesTab = dynamic(() => import('../components/admin/AdminStoriesTab').then(m => m.AdminStoriesTab));
const AdminCollectionsTab = dynamic(() => import('../components/admin/AdminCollectionsTab').then(m => m.AdminCollectionsTab));
const AdminDebatesTab = dynamic(() => import('../components/admin/AdminDebatesTab').then(m => m.AdminDebatesTab));
const AdminPollsTab = dynamic(() => import('../components/admin/AdminPollsTab').then(m => m.AdminPollsTab));
const AdminOnThisDayTab = dynamic(() => import('../components/admin/AdminOnThisDayTab').then(m => m.AdminOnThisDayTab));
const AdminTransferWatchTab = dynamic(() => import('../components/admin/AdminTransferWatchTab').then(m => m.AdminTransferWatchTab));
const AdminTransferTrackerTab = dynamic(() => import('../components/admin/AdminTransferTrackerTab').then(m => m.AdminTransferTrackerTab));
const AdminSettingsTab = dynamic(() => import('../components/admin/AdminSettingsTab').then(m => m.AdminSettingsTab));
const AdminNewsletterTab = dynamic(() => import('../components/admin/AdminNewsletterTab').then(m => m.AdminNewsletterTab));
const AdminAnalyticsTab = dynamic(() => import('../components/admin/AdminAnalyticsTab').then(m => m.AdminAnalyticsTab));
const InstagramCarouselGenerator = dynamic(() => import('../components/admin/InstagramCarouselGenerator').then(m => m.InstagramCarouselGenerator));
const DraftAssistant = dynamic(() => import('../components/admin/DraftAssistant').then(m => m.DraftAssistant));
const TweetThreadGenerator = dynamic(() => import('../components/admin/TweetThreadGenerator').then(m => m.TweetThreadGenerator));
const QuickTakeVideoGenerator = dynamic(() => import('../components/QuickTakeVideoGenerator').then(m => m.QuickTakeVideoGenerator));
const AdminCalendarTab = dynamic(() => import('../components/admin/AdminCalendarTab').then(m => m.AdminCalendarTab));
const AdminNotificationsTab = dynamic(() => import('../components/admin/AdminNotificationsTab').then(m => m.AdminNotificationsTab));
const AdminPOTSTab = dynamic(() => import('../components/admin/AdminPOTSTab').then(m => m.AdminPOTSTab));
const AdminPostsTab = dynamic(() => import('../components/admin/AdminPostsTab').then(m => m.AdminPostsTab));

type View = "list" | "create" | "edit";
type Tab = "notifications" | "pots" | "posts" | "stories" | "collections" | "debates" | "run-in" | "title-race" | "transfer-watch" | "transfer-tracker" | "on-this-day" | "settings" | "polls" | "newsletter" | "analytics" | "carousel-generator" | "quick-take-video" | "draft-assistant" | "tweet-generator" | "calendar";

type TransferDraft = {
    player: string;
    playerImageUrl: string;
    club: string;
    fromClub: string;
    feeMode: TransferFeeMode;
    feeMillions: string;
    status: TransferWatchStatus;
    tier: number;
    scoutGrades?: Partial<ScoutGrades>;
    punchyLine: string;
    myTake: string;
    aiTake: string;
    aiScore?: number;
};

function createTransferDraft(club = "Arsenal"): TransferDraft {
    return {
        player: "",
        playerImageUrl: "",
        club,
        fromClub: "",
        feeMode: "million-usd",
        feeMillions: "",
        status: "rumor",
        tier: 3,
        scoutGrades: undefined,
        punchyLine: "",
        myTake: "",
        aiTake: "",
        aiScore: undefined,
    };
}

export function AdminPage() {
    const navigate = useNavigate();
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

    
    const [posts, setPosts] = useState<BlogPost[]>(() => getAllPosts());
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

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
    const [transferDraft, setTransferDraft] = useState<TransferDraft>(() => createTransferDraft());
    const [transferEditId, setTransferEditId] = useState<string | null>(null);
    const [transferFilterClub, setTransferFilterClub] = useState("all");

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

    const getAdminAuthHeaders = useCallback((): HeadersInit => ({}), []);

    const fetchSubscriberCount = useCallback(async () => {
        try {
            const res = await fetch("/api/subscribers", {
                headers: getAdminAuthHeaders(),
                cache: "no-store",
                credentials: "same-origin",
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setSubscriberCount(data.count ?? data.subscribers?.length ?? 0);
                return;
            }
            throw new Error(data.error || "Failed to load subscribers");
        } catch (error) {
            console.error("Failed to load subscriber count:", error);
        }
    }, [getAdminAuthHeaders]);

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
                        const res = await fetch("/api/polls", {
                headers: {}
            });
            if (res.ok) setServerPolls(await res.json());
        } catch {}
    }, []);

    const fetchServerMatchRatings = useCallback(async () => {
        try {
                        const res = await fetch("/api/match-ratings", {
                headers: {}
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
        {
            void (async () => {
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
            })();
        }
    }, [refreshPosts, refreshStories, fetchSubscriberCount, fetchCollections, fetchDebates, fetchServerPolls, fetchServerMatchRatings]);

        const handleLogout = () => { signOut({ callbackUrl: '/' }); };

    // Post Handlers
    const handleCreatePost = async (postData: Omit<BlogPost, "id">, isLeaving?: boolean) => {
        try {
            const previousPostIds = new Set(posts.map((item) => item.id));
            const updated = await addPostAsync(postData);
            setPosts(updated);

            if (isLeaving) {
                setView("list");
                setEditingPost(null);
            } else if (postData.isDraft) {
                // It was an auto-save. Find the newly created draft by id instead
                // of assuming the API returns it first.
                const newPost = updated.find((item) => !previousPostIds.has(item.id));
                if (newPost) {
                    setEditingPost(newPost);
                }
                setView("edit");
            } else {
                // Explicit publish click
                setView("list");
                toast.success("Post published successfully!");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save post.");
            throw error;
        }
    };

    const handleEditPost = (post: BlogPost) => {
        setEditingPost(post);
        setView("edit");
    };

    const handleViewPost = (post: BlogPost) => {
        if (post.isDraft) {
            if (post.previewToken) {
                navigate(`/post/${post.slug || post.id}?preview=${encodeURIComponent(post.previewToken)}`);
                return;
            }

            toast.info("This draft does not have a preview link yet, so the editor was opened instead.");
            handleEditPost(post);
            return;
        }

        navigate(`/post/${post.slug || post.id}`);
    };

    const handleUpdatePost = async (postData: Omit<BlogPost, "id">, isLeaving?: boolean) => {
        if (editingPost) {
            try {
                const updated = await updatePostAsync(editingPost.id, postData);
                setPosts(updated);

                if (isLeaving) {
                    setView("list");
                    setEditingPost(null);
                } else if (postData.isDraft) {
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
                throw error;
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
                headers: {
                    "Content-Type": "application/json",
                    ...getAdminAuthHeaders(),
                },
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



    const handleSavePoll = async () => {
        try {
            setSavingPoll(true);
                        const isEditing = !!editingPoll._id;
            const url = isEditing ? `/api/polls/${editingPoll._id}` : "/api/polls";
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
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
                        const res = await fetch(`/api/polls/${id}`, { method: "DELETE", headers: {} });
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
                        const isEditing = !!editingMatchRating._id;
            const url = isEditing ? `/api/match-ratings/${editingMatchRating._id}` : "/api/match-ratings";
            const method = isEditing ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
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
                        const res = await fetch(`/api/match-ratings/${id}`, { method: "DELETE", headers: {} });
            if (res.ok) {
                toast.success("Match Ratings deleted");
                fetchServerMatchRatings();
            }
        } catch {
            toast.error("Network error");
        }
    };

    const handleAddTransferWatchEntry = async () => {
        const existingEntry = transferEditId
            ? siteSettings.transferWatch.find((entry) => entry.id === transferEditId) || null
            : null;
        const normalized = normalizeTransferWatchEntry({
            ...transferDraft,
            feeMillions: Number(transferDraft.feeMillions) || 0,
            tier: transferDraft.tier as 1|2|3|4|5,
            updatedAt: new Date().toISOString(),
            id: transferEditId || undefined, // Use existing ID if editing
        } as Partial<TransferWatchEntry>);

        if (!normalized) {
            toast.error("Add at least a player name and club before saving a transfer item.");
            return;
        }

        const isNew = !transferEditId;

        const newTransferWatch = [normalized, ...siteSettings.transferWatch.filter((entry) => entry.id !== normalized.id)];
        const previousDossierSlug = existingEntry ? buildTransferDossierSlug(existingEntry) : null;
        const previousTopic = existingEntry ? buildTransferTopic(existingEntry.player, existingEntry.club) : null;
        const nextTransferSources = existingEntry
            ? siteSettings.transferSources.map((source) => {
                const matchesPreviousDossier = source.dossierSlug === previousDossierSlug
                    || source.topic === previousTopic
                    || (source.player === existingEntry.player && source.club === existingEntry.club);

                if (!matchesPreviousDossier) return source;

                return {
                    ...source,
                    dossierSlug: buildTransferDossierSlug(normalized),
                    topic: buildTransferTopic(normalized.player, normalized.club),
                    player: normalized.player,
                    club: normalized.club,
                };
            })
            : siteSettings.transferSources;
        
        setSiteSettings((prev) => ({
            ...prev,
            transferWatch: newTransferWatch,
            transferSources: nextTransferSources,
        }));
        
        setTransferDraft(createTransferDraft(normalized.club));
        setTransferEditId(null);
        toast.success(isNew ? "Transfer watch item added to the draft feed." : "Transfer watch item updated.");

        if (isNew) {
            try {
                const token = localStorage.getItem("pitchside_admin_auth");
                const feeString = formatTransferWatchAmount(normalized) || "";
                await fetch("/api/transfers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        player: normalized.player,
                        fromClub: normalized.fromClub || "Unknown",
                        toClub: normalized.club,
                        fee: feeString,
                        source: `Tier ${normalized.tier} Report`,
                        status: normalized.status === "confirmed" ? "done" : "rumour"
                    })
                });
            } catch (e) {
                console.error("Failed to sync to tracker", e);
            }
        }
        
        // Auto-save the Transfer Watch feed
        try {
            const updated = await updateSiteSettingsAsync({
                transferWatch: newTransferWatch,
                transferSources: nextTransferSources,
            });
            setSiteSettings(updated);
        } catch (error) {
            toast.error("UI updated, but failed to persist to server. Click Save manually.");
        }
    };

    const handleEditTransferWatchEntry = (entry: typeof siteSettings.transferWatch[0]) => {
        setTransferDraft({
            player: entry.player,
            playerImageUrl: entry.playerImageUrl || "",
            club: entry.club,
            fromClub: entry.fromClub || "",
            feeMode: entry.feeMode,
            feeMillions: String(entry.feeMillions || ""),
            status: entry.status,
            tier: entry.tier || 3,
            scoutGrades: entry.scoutGrades,
            punchyLine: entry.punchyLine || "",
            myTake: entry.myTake || "",
            aiTake: entry.aiTake || "",
            aiScore: entry.aiScore,
        });
        setTransferEditId(entry.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelTransferWatchEdit = () => {
        setTransferDraft(createTransferDraft(transferDraft.club || "Arsenal"));
        setTransferEditId(null);
    };

    const handleDeleteTransferWatchEntry = (id: string) => {
        const entryToDelete = siteSettings.transferWatch.find((entry) => entry.id === id);
        const nextTransferWatch = siteSettings.transferWatch.filter((entry) => entry.id !== id);
        const nextTransferSources = entryToDelete
            ? siteSettings.transferSources.filter((source) => (
                source.dossierSlug !== buildTransferDossierSlug(entryToDelete)
                && source.topic !== buildTransferTopic(entryToDelete.player, entryToDelete.club)
                && !(source.player === entryToDelete.player && source.club === entryToDelete.club)
            ))
            : siteSettings.transferSources;

        setSiteSettings((prev) => ({
            ...prev,
            transferWatch: nextTransferWatch,
            transferSources: nextTransferSources,
        }));

        if (transferEditId === id) {
            setTransferDraft(createTransferDraft());
            setTransferEditId(null);
        }
    };

    const handleSaveTransferSources = async (nextSources: SiteSettings["transferSources"]) => {
        const updated = await updateSiteSettingsAsync({
            transferSources: nextSources,
        });
        setSiteSettings(updated);
    };

    const handleSaveTransferWatch = async () => {
        setSavingTransferWatch(true);
        try {
            const updated = await updateSiteSettingsAsync({
                transferWatch: siteSettings.transferWatch,
                transferSources: siteSettings.transferSources,
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
                        const res = await fetch("/api/digest", { 
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("pitchside_admin_auth") || ""}` }
            });
            const data = await res.json();
            if (res.ok) toast.success(data.message || "Digest sent!");
            else toast.error(data.error || "Failed to send digest");
        } catch {
            toast.error("Error sending digest");
        }
        setSendingDigest(false);
    };

    
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

            <main className="max-w-[1100px] mx-auto px-6 py-8">
                {/* Tabs Wrapper */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-8 pb-4">
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "notifications" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Bell className="w-4 h-4" /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab("pots")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "pots" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Trophy className="w-4 h-4" /> POTS Manager
                    </button>
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "posts" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Layout className="w-4 h-4" /> Posts
                    </button>
                    <button
                        onClick={() => setActiveTab("stories")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "stories" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ScanSearch className="w-4 h-4" /> Stories
                    </button>
                    <button
                        onClick={() => setActiveTab("collections")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "collections" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Library className="w-4 h-4" /> Collections
                    </button>                    
                    <button
                        onClick={() => setActiveTab("polls")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "polls" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <HelpCircle className="w-4 h-4" /> Polls (Server)
                    </button>
                    <button
                        onClick={() => setActiveTab("debates")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "debates" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Flame className="w-4 h-4" /> Debates
                    </button>
                    <button
                        onClick={() => setActiveTab("run-in")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "run-in" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ArrowUpDown className="w-4 h-4" /> Run-In Tracker
                    </button>
                    <button
                        onClick={() => setActiveTab("title-race")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "title-race" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ArrowUpDown className="w-4 h-4" /> Title Race
                    </button>
                    <button
                        onClick={() => setActiveTab("transfer-tracker")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "transfer-tracker" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Repeat2 className="w-4 h-4" /> Transfer Tracker
                    </button>
                    <button
                        onClick={() => setActiveTab("transfer-watch")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "transfer-watch" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Repeat2 className="w-4 h-4" /> Transfer Watch
                    </button>
                    <button
                        onClick={() => setActiveTab("on-this-day")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "on-this-day" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <span className="text-base leading-none">📅</span> On This Day
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "settings" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <RadioTower className="w-4 h-4" /> Settings & Newsletter
                    </button>
                    <button
                        onClick={() => setActiveTab("newsletter")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "newsletter" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Mail className="w-4 h-4" /> Newsletter
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "analytics" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <LineChart className="w-4 h-4" /> Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab("carousel-generator")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "carousel-generator" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Carousel Gen
                    </button>
                    <button
                        onClick={() => setActiveTab("quick-take-video")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "quick-take-video" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <Zap className="w-4 h-4" /> Quick Take Video
                    </button>
                    <button
                        onClick={() => setActiveTab("draft-assistant")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "draft-assistant" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <PenLine className="w-4 h-4" /> Draft AI
                    </button>
                    <button
                        onClick={() => setActiveTab("tweet-generator")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "tweet-generator" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <MessageSquare className="w-4 h-4" /> Tweet Gen
                    </button>
                    <button
                        onClick={() => setActiveTab("calendar")}
                        className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0 ${activeTab === "calendar" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                        <span className="text-base leading-none">📅</span> Calendar
                    </button>
                </div>

                {/* POSTS TAB */}
                {activeTab === "posts" && (
                    <>
                        <AdminPostsTab
                            posts={posts}
                            setPosts={setPosts}
                            setView={setView}
                            handleViewPost={handleViewPost}
                            handleEditPost={handleEditPost}
                            handleDeletePost={handleDeletePost}
                            notifySubscribers={notifySubscribers}
                            notifyingPostId={notifyingPostId}
                            setTargetCarouselText={setTargetCarouselText}
                            setActiveTab={setActiveTab}
                        />
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
                        transferEditId={transferEditId}
                        transferFilterClub={transferFilterClub}
                        filteredTransferWatchEntries={filteredTransferWatchEntries}
                        savingTransferWatch={savingTransferWatch}
                        setTransferDraft={setTransferDraft}
                        setTransferFilterClub={setTransferFilterClub}
                        handleAddTransferWatchEntry={handleAddTransferWatchEntry}
                        handleEditTransferWatchEntry={handleEditTransferWatchEntry}
                        handleCancelTransferWatchEdit={handleCancelTransferWatchEdit}
                        handleSaveTransferWatch={handleSaveTransferWatch}
                        handleDeleteTransferWatchEntry={handleDeleteTransferWatchEntry}
                        formatTransferWatchAmount={formatTransferWatchAmount}
                        transferSources={siteSettings.transferSources}
                        onPersistTransferSources={handleSaveTransferSources}
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

                {/* QUICK TAKE VIDEO GENERATOR TAB */}
                {activeTab === "quick-take-video" && (
                    <QuickTakeVideoGenerator />
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
                        onSave={async (pots) => { await updateSiteSettingsAsync({ pots }); }} 
                    />
                )}
            </main>
        </div>
    );
}
