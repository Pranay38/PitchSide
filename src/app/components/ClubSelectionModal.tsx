import { useState, useMemo } from "react";
import { clubsByLeague } from "../data/clubs";
import type { Club } from "../data/clubs";
import { Search, X } from "lucide-react";

interface ClubSelectionModalProps {
    isOpen: boolean;
    onSelectClub: (club: string) => void;
    onSkip: () => void;
}

export function ClubSelectionModal({ isOpen, onSelectClub, onSkip }: ClubSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const groupedClubs = useMemo(() => clubsByLeague(), []);

    if (!isOpen) return null;

    const filteredGroups = Object.entries(groupedClubs).reduce(
        (acc, [league, leagueClubs]) => {
            const filtered = leagueClubs.filter((club) =>
                club.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length > 0) acc[league] = filtered;
            return acc;
        },
        {} as Record<string, Club[]>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onSkip}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 transition-colors">
                {/* Close button */}
                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center pt-8 pb-4 px-6 flex-shrink-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#16A34A]/10 mb-4">
                        <span className="text-3xl">⚽</span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">
                        Who do you support?
                    </h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        Select your club to personalize your feed
                    </p>
                </div>

                {/* Search */}
                <div className="px-6 pb-3 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for a club..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Club List */}
                <div className="overflow-y-auto flex-1 px-6 pb-4 scrollbar-thin">
                    {Object.entries(filteredGroups).map(([league, leagueClubs]) => (
                        <div key={league} className="mb-4">
                            <p className="text-xs font-bold text-[#94A3B8] dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                                {league}
                            </p>
                            <div className="space-y-1">
                                {leagueClubs.map((club) => (
                                    <button
                                        key={club.name}
                                        onClick={() => onSelectClub(club.name)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <img
                                                src={club.logo}
                                                alt={club.name}
                                                className="w-6 h-6 object-contain"
                                                onError={(e) => {
                                                    // Fallback to first letter if logo fails
                                                    e.currentTarget.style.display = "none";
                                                    e.currentTarget.parentElement!.textContent = club.name[0];
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">
                                            {club.name}
                                        </span>
                                        <span className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-[#16A34A] transition-colors">
                                            ›
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {Object.keys(filteredGroups).length === 0 && (
                        <div className="text-center py-8 text-[#94A3B8] dark:text-gray-500 text-sm">
                            No clubs found matching "{searchQuery}"
                        </div>
                    )}
                </div>

                {/* Skip */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <button
                        onClick={onSkip}
                        className="w-full text-center text-sm text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors font-medium"
                    >
                        Skip — show me everything
                    </button>
                </div>
            </div>
        </div>
    );
}
