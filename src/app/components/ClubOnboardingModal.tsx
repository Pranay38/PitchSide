import { useState, useEffect } from "react";
import { Search, X, ShieldAlert } from "lucide-react";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { getAllClubs, searchClubsOnline, type Club, type SearchResult } from "../data/clubs";

export function ClubOnboardingModal() {
    const { fanClub, setFanClub, loading } = useUserPreferences();
    const [isOpen, setIsOpen] = useState(false);

    // Club selector state
    const [searchTerm, setSearchTerm] = useState("");
    const [onlineResults, setOnlineResults] = useState<SearchResult[]>([]);
    const [searchingOnline, setSearchingOnline] = useState(false);

    useEffect(() => {
        // Persist dismissal across sessions so it doesn't keep popping up
        const hasDismissed = localStorage.getItem("pitchside_dismissed_onboarding");
        
        // Wait for prefs to load. If it's loaded and fanClub is null, show modal.
        // But only if user hasn't previously dismissed it.
        if (!loading && fanClub === null && !hasDismissed) {
            setIsOpen(true);
        }
        // If user already has a club selected, close modal and clear dismiss flag
        if (!loading && fanClub !== null) {
            setIsOpen(false);
        }
    }, [loading, fanClub]);

    // Handle online search
    useEffect(() => {
        const localMatches = getAllClubs().filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (localMatches.length > 0 || searchTerm.length < 3) {
            setOnlineResults([]);
            return;
        }

        const runSearch = async () => {
            setSearchingOnline(true);
            const results = await searchClubsOnline(searchTerm);
            setOnlineResults(results);
            setSearchingOnline(false);
        };
        const timeout = setTimeout(runSearch, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const handleDismiss = () => {
        localStorage.setItem("pitchside_dismissed_onboarding", "true");
        setIsOpen(false);
    };

    const handleSelect = (club: { name: string; logoUrl: string | null }) => {
        setFanClub(club);
        setIsOpen(false);
    };

    if (!isOpen) return null;

    const localResults = getAllClubs().filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden relative scale-in-center">
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-br from-[#16A34A] to-[#047857] flex items-center justify-center p-6 text-center">
                    <button 
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white font-outfit">Pick Your Colors</h2>
                        <p className="text-white/80 text-sm mt-1 font-medium">Select your favorite club to personalize your profile.</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Type to search your club..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] transition-all text-sm font-medium"
                            autoFocus
                        />
                    </div>

                    <div className="mt-4 max-h-[40vh] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {searchTerm === "" ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                Search for any club worldwide.
                            </div>
                        ) : (
                            <>
                                {localResults.map(club => (
                                    <button
                                        key={club.name}
                                        onClick={() => handleSelect({ name: club.name, logoUrl: club.logo })}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#0F172A] rounded-xl flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1E293B] p-1 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {club.logo ? (
                                                <img src={club.logo} alt={club.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <ShieldAlert className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">{club.name}</p>
                                            <p className="text-[10px] text-gray-500 font-semibold">{club.league}</p>
                                        </div>
                                    </button>
                                ))}

                                {localResults.length === 0 && onlineResults.map(res => (
                                    <button
                                        key={res.name}
                                        onClick={() => handleSelect({ name: res.name, logoUrl: res.logo })}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#0F172A] rounded-xl flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1E293B] p-1 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {res.logo ? (
                                                <img src={res.logo} alt={res.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <ShieldAlert className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">{res.name}</p>
                                            <p className="text-[10px] text-gray-500 font-semibold">{res.league}</p>
                                        </div>
                                    </button>
                                ))}

                                {localResults.length === 0 && onlineResults.length === 0 && !searchingOnline && searchTerm.length >= 3 && (
                                    <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                        No clubs found for "{searchTerm}"
                                    </div>
                                )}
                                
                                {searchingOnline && (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#16A34A] border-t-transparent" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
