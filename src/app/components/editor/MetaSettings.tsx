import { useState, useEffect, useRef } from "react";
import { Tag, Search, Loader2, Trash2, Plus, Link, Mic, User, Library, Star, Flame, Crown, CalendarDays, X } from "lucide-react";
import { getAllClubNames, searchClubsOnline, addCustomClub, getClubByName, deleteCustomClub, isCustomClub } from "../../data/clubs";
import type { SearchResult } from "../../data/clubs";

const GENERAL_CATEGORIES = [
    "General",
    "Tactics",
    "Trophy",
    "History",
    "Opinion",
    "Player Profile"
];

interface MetaSettingsProps {
    category: string;
    setCategory: (val: string) => void;
    club: string;
    setClub: (val: string) => void;
    tagInput: string;
    setTagInput: (val: string) => void;
    tags: string[];
    setTags: React.Dispatch<React.SetStateAction<string[]>>;
    mediaUrl: string;
    setMediaUrl: (val: string) => void;
    audioUrl: string;
    setAudioUrl: (val: string) => void;
    playerName: string;
    setPlayerName: (val: string) => void;
    matchRating: number | "";
    setMatchRating: (val: number | "") => void;
    seriesName: string;
    setSeriesName: (val: string) => void;
    seriesOrder: number | "";
    setSeriesOrder: (val: number | "") => void;
    thisWeek: boolean;
    setThisWeek: (val: boolean) => void;
    mustRead: boolean;
    setMustRead: (val: boolean) => void;
    editorPick: boolean;
    setEditorPick: (val: boolean) => void;
    mainStory: boolean;
    setMainStory: (val: boolean) => void;
    publishAt: string;
    setPublishAt: (val: string) => void;
    errors: Record<string, string>;
}

export function MetaSettings({
    category, setCategory,
    club, setClub,
    tagInput, setTagInput,
    tags, setTags,
    mediaUrl, setMediaUrl,
    audioUrl, setAudioUrl,
    playerName, setPlayerName,
    matchRating, setMatchRating,
    seriesName, setSeriesName,
    seriesOrder, setSeriesOrder,
    thisWeek, setThisWeek,
    mustRead, setMustRead,
    editorPick, setEditorPick,
    mainStory, setMainStory,
    publishAt, setPublishAt,
    errors
}: MetaSettingsProps) {
    const [clubSearch, setClubSearch] = useState("");
    const [clubResults, setClubResults] = useState<SearchResult[]>([]);
    const [searchingClubs, setSearchingClubs] = useState(false);
    const [showClubDropdown, setShowClubDropdown] = useState(false);
    const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());
    const clubSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clubDropdownRef = useRef<HTMLDivElement>(null);
    const [showCustomTeamModal, setShowCustomTeamModal] = useState(false);
    const [customTeamLogoInput, setCustomTeamLogoInput] = useState("");

    const effectiveClub = category === "club" ? club : category;

    useEffect(() => {
        const primary = category === "club" ? club : category;
        if (primary && !tags.includes(primary)) {
            setTags((prev) => [primary, ...prev.filter((t) => t !== primary)]);
        }
    }, [category, club, setTags, tags]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !tags.includes(t)) {
            setTags([...tags, t]);
            setTagInput("");
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    const handleClubSearch = (query: string) => {
        setClubSearch(query);
        setShowClubDropdown(true);

        const localNames = getAllClubNames();
        const localMatches = localNames
            .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
            .map((n) => {
                const c = getClubByName(n);
                return { name: n, league: c?.league || "", logo: c?.logo || "" };
            });
        setClubResults(localMatches);

        if (clubSearchTimeout.current) clearTimeout(clubSearchTimeout.current);
        if (query.length >= 2) {
            setSearchingClubs(true);
            clubSearchTimeout.current = setTimeout(async () => {
                const online = await searchClubsOnline(query);
                const localSet = new Set(localMatches.map((m) => m.name.toLowerCase()));
                const merged = [
                    ...localMatches,
                    ...online.filter((r) => !localSet.has(r.name.toLowerCase())),
                ];
                setClubResults(merged);
                setSearchingClubs(false);
            }, 400);
        } else {
            setSearchingClubs(false);
        }
    };

    const handleAddCustomClub = () => {
        if (!clubSearch.trim()) return;
        setCustomTeamLogoInput("");
        setShowCustomTeamModal(true);
    };

    const confirmCustomTeamAdd = () => {
        if (!clubSearch.trim()) return;

        const newClub = {
            name: clubSearch.trim(),
            league: "Custom Teams",
            logo: customTeamLogoInput.trim() || ""
        };

        addCustomClub(newClub);
        selectClub(newClub);
        setShowCustomTeamModal(false);
    };

    const selectClub = (result: SearchResult) => {
        setClub(result.name);
        setClubSearch(result.name);
        setShowClubDropdown(false);
        addCustomClub({ name: result.name, league: result.league, logo: result.logo });
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (clubDropdownRef.current && !clubDropdownRef.current.contains(e.target as Node)) {
                setShowClubDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                    <Tag className="w-4 h-4 text-[#16A34A]" />
                    Category & Tags
                </label>

                {/* Category type selector */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setCategory("club")}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${category === "club"
                            ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                            : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                            }`}
                    >
                        ⚽ Club-Specific
                    </button>
                    <button
                        type="button"
                        onClick={() => setCategory("General")}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${category !== "club"
                            ? "bg-[#16A34A] text-white border-[#16A34A] shadow-md shadow-[#16A34A]/20"
                            : "bg-gray-50 dark:bg-[#0F172A] border-gray-200 dark:border-gray-600 text-[#64748B] dark:text-gray-400 hover:border-[#16A34A]"
                            }`}
                    >
                        📋 General Topic
                    </button>
                </div>

                {/* Club selector with search (only when club-specific) */}
                {category === "club" && (
                    <div ref={clubDropdownRef} className="relative mb-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <img
                                src={club ? (getClubByName(club)?.logo || "") : ""}
                                alt=""
                                className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 object-contain"
                                style={{ display: club && getClubByName(club)?.logo ? "block" : "none" }}
                            />
                            <input
                                type="text"
                                value={clubSearch || club}
                                onChange={(e) => handleClubSearch(e.target.value)}
                                onFocus={() => { if (clubSearch || club) handleClubSearch(clubSearch || club); }}
                                placeholder="Search any club in the world..."
                                className={`w-full ${club && getClubByName(club)?.logo ? 'pl-[4.5rem]' : 'pl-10'} pr-4 py-3 rounded-xl border ${errors.club ? "border-red-400" : "border-gray-200 dark:border-gray-600"} bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm`}
                            />
                            <Loader2
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16A34A] animate-spin"
                                style={{ display: searchingClubs ? "block" : "none" }}
                            />
                        </div>

                        {/* Dropdown results */}
                        <div
                            className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-600 shadow-xl max-h-72 overflow-y-auto"
                            style={{ display: showClubDropdown && (clubResults.length > 0 || clubSearch.length > 1) ? "block" : "none" }}
                        >
                            {clubResults.map((result) => (
                                <div
                                    key={result.name}
                                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0 group text-sm"
                                >
                                    <button
                                        type="button"
                                        onClick={() => selectClub(result)}
                                        className="w-full flex items-center gap-3 text-left flex-1"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <img
                                                src={result.logo || ""}
                                                alt=""
                                                className="w-5 h-5 object-contain"
                                                style={{ display: result.logo && !brokenLogos.has(result.logo) ? "block" : "none" }}
                                                onError={() => {
                                                    setBrokenLogos(prev => new Set(prev).add(result.logo));
                                                }}
                                            />
                                            <span 
                                                className="text-xs font-bold text-[#64748B]"
                                                style={{ display: !result.logo || brokenLogos.has(result.logo) ? "block" : "none" }}
                                            >
                                                {result.name[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                            <p className="font-medium text-[#0F172A] dark:text-white truncate">{result.name}</p>
                                            <p className="text-xs text-[#94A3B8] dark:text-gray-500 truncate">{result.league}</p>
                                        </div>
                                    </button>
                                    {isCustomClub(result.name) && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCustomClub(result.name);
                                                handleClubSearch(clubSearch || "");
                                                if (club === result.name) {
                                                    setClub("");
                                                    setCategory("General");
                                                }
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete custom team"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Add Custom Club Button */}
                            {clubSearch.length > 1 && !clubResults.some(c => c.name.toLowerCase() === clubSearch.toLowerCase()) && (
                                <button
                                    type="button"
                                    onClick={handleAddCustomClub}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors text-sm border-t border-gray-100 dark:border-gray-700/50"
                                >
                                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                        <Plus className="w-4 h-4 text-green-600 dark:text-green-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-green-600 dark:text-green-400 truncate">Add "{clubSearch}" as a new team</p>
                                        <p className="text-xs text-green-500/70 truncate">Save this custom team for future posts</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* General topic selector (only when general) */}
                {category !== "club" && (
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm mb-3"
                    >
                        {GENERAL_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                )}

                {errors.club && <p className="text-red-500 text-xs mb-2">{errors.club}</p>}

                {/* Tag input */}
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a custom tag (e.g., Premier League, UCL)..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                    />
                    <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-[#0F172A] dark:text-white rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Add
                    </button>
                </div>

                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${tag === effectiveClub
                                    ? "bg-[#16A34A] text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-[#64748B] dark:text-gray-400"
                                    }`}
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 hover:text-red-500 transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Media / YouTube Embed */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                    <Link className="w-4 h-4 text-[#16A34A]" />
                    Media / Embed Link (YouTube, Spotify)
                </label>
                <p className="text-xs text-[#64748B] dark:text-gray-400 mb-3">
                    Paste a YouTube or Spotify URL here to automatically embed a playable widget at the bottom of your post.
                </p>
                <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                />
                
                <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                        <Mic className="w-4 h-4 text-[#16A34A]" />
                        Touchline Audio Snippet
                    </label>
                    <p className="text-xs text-[#64748B] dark:text-gray-400 mb-3">
                        Paste the URL to an externally hosted audio breakdown.
                    </p>
                    <input
                        type="url"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="https://api.example.com/audio.mp3"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                    />
                </div>
            </div>

            {/* Player Name (for Player Profile category) */}
            {(category === "Player Profile" || tags.includes("Player Profile")) && (
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                        <User className="w-4 h-4 text-[#16A34A]" />
                        Player Name
                    </label>
                    <p className="text-xs text-[#64748B] dark:text-gray-400 mb-3">
                        Enter the player's full name. This will allow readers to filter by player on the homepage.
                    </p>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="e.g. Erling Haaland"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                    />
                </div>
            )}

            {/* Overall Match & Series Info */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
                    <Library className="w-4 h-4 text-[#16A34A]" />
                    Meta: Match Rating & Article Series
                </label>
                <p className="text-xs text-[#64748B] dark:text-gray-400 mb-4">
                    Optionally provide an overall rating for this match and link this post to an ongoing series.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1">Overall Match Rating (0-10)</label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={matchRating}
                            onChange={(e) => setMatchRating(e.target.value ? Number(e.target.value) : "")}
                            placeholder="e.g. 8.5"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1">Series Name</label>
                        <input
                            type="text"
                            value={seriesName}
                            onChange={(e) => setSeriesName(e.target.value)}
                            placeholder="e.g. The EPL in Europe"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#64748B] dark:text-gray-400 mb-1">Series Part (Order)</label>
                        <input
                            type="number"
                            min="1"
                            value={seriesOrder}
                            onChange={(e) => setSeriesOrder(e.target.value ? Number(e.target.value) : "")}
                            placeholder="e.g. 1"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Featured Layout Options */}
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm p-6 transition-colors duration-300">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] dark:text-white mb-2">
                    <Star className="w-4 h-4 text-[#16A34A]" />
                    Featured Layout
                </label>

                {/* Featured Layout Segmented Controls */}
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setThisWeek(!thisWeek)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${thisWeek ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700'}`}
                    >
                        <Flame className="w-3.5 h-3.5" />
                        "This Week"
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setMustRead(!mustRead)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${mustRead ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-700'}`}
                    >
                        <Star className="w-3.5 h-3.5" />
                        Must Read Pick
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setEditorPick(!editorPick)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${editorPick ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                    >
                        <Star className="w-3.5 h-3.5" />
                        Editor Pick
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setMainStory(!mainStory)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95 ${mainStory ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'}`}
                    >
                        <Crown className="w-3.5 h-3.5" />
                        Main Story
                    </button>
                </div>

                {/* Schedule Publishing */}
                <div className="flex border-t border-gray-100 dark:border-gray-800 pt-6 flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${publishAt ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white mb-0.5">Schedule Publish</p>
                            <p className="text-xs text-[#64748B] dark:text-gray-400">
                                {publishAt
                                    ? `Scheduled for ${new Date(publishAt).toLocaleString()}`
                                    : "Set a future date to auto-publish before matchday."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="datetime-local"
                            value={publishAt ? new Date(new Date(publishAt).getTime() - new Date(publishAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                            onChange={(e) => setPublishAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        {publishAt && (
                            <button
                                type="button"
                                onClick={() => setPublishAt("")}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Clear schedule"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Custom Team Logo Modal ── */}
            {showCustomTeamModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-[#0F172A] dark:text-white mb-2">New Team Options</h3>
                            <p className="text-sm text-[#64748B] dark:text-gray-400 mb-6 font-medium">Adding <span className="font-bold text-[#16A34A]">{clubSearch}</span></p>

                            <label className="block text-sm font-semibold text-[#0F172A] dark:text-white mb-2">
                                Logo URL <span className="text-xs text-[#94A3B8] font-normal">(Optional)</span>
                            </label>
                            <input
                                type="url"
                                value={customTeamLogoInput}
                                onChange={(e) => setCustomTeamLogoInput(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm mb-6"
                                autoFocus
                            />

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowCustomTeamModal(false)}
                                    className="px-5 py-2.5 text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmCustomTeamAdd}
                                    className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803d] text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                                >
                                    Add Team
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
