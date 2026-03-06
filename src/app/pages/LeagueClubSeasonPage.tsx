import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { getPublishedPosts } from "../lib/postStorage";
import { useClubPreference } from "../hooks/useClubPreference";
import { ArrowLeft, Trophy, Target, Users, Loader2, AlertCircle } from "lucide-react";

/** Available leagues for internal linking */
const LEAGUES = [
    { slug: "premier-league", name: "Premier League" },
    { slug: "la-liga", name: "La Liga" },
    { slug: "bundesliga", name: "Bundesliga" },
    { slug: "serie-a", name: "Serie A" },
    { slug: "ligue-1", name: "Ligue 1" },
    { slug: "champions-league", name: "Champions League" },
];

interface ClubData {
    name: string;
    shortName: string;
    crest: string;
    position: number;
    played: number;
    won: number;
    draw: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
}

interface TableEntry {
    position: number;
    team: string;
    crest: string;
    played: number;
    won: number;
    draw: number;
    lost: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
    isTarget: boolean;
}

interface Scorer {
    rank: number;
    player: string;
    team: string;
    teamCrest: string;
    goals: number;
    assists: number | null;
    nationality: string | null;
}

interface SeasonData {
    league: string;
    leagueName: string;
    leagueEmblem: string;
    season: string;
    club?: ClubData;
    table: TableEntry[];
    topScorers: Scorer[];
    clubScorers: Scorer[];
}

export function LeagueClubSeasonPage() {
    const { league, club, season } = useParams();
    const { favoriteClub } = useClubPreference();
    const [data, setData] = useState<SeasonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const blogPosts = useMemo(() => getPublishedPosts(), []);

    // Find related blog posts for this club
    const relatedPosts = useMemo(() => {
        if (!club) return [];
        const clubName = club.replace(/-/g, " ").toLowerCase();
        return blogPosts
            .filter((p) =>
                p.club?.toLowerCase().includes(clubName) ||
                p.tags.some((t) => t.toLowerCase().includes(clubName)) ||
                p.title.toLowerCase().includes(clubName)
            )
            .slice(0, 4);
    }, [blogPosts, club]);

    useEffect(() => {
        if (!league) return;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ league: league });
        if (club) params.set("club", club);
        if (season) params.set("season", season);

        fetch(`/api/club-season?${params.toString()}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch data");
                return res.json();
            })
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [league, club, season]);

    const pageTitle = data?.club
        ? `${data.club.name} — ${data.leagueName} ${data.season}`
        : data?.leagueName
            ? `${data.leagueName} Standings ${data.season}`
            : "Season Overview";

    const pageDescription = data?.club
        ? `${data.club.name} ${data.season} season stats: Position ${data.club.position}, ${data.club.points} points, ${data.club.won}W ${data.club.draw}D ${data.club.lost}L. Full standings, top scorers, and analysis.`
        : `${data?.leagueName || ""} ${data?.season || ""} standings, top scorers, and analysis.`;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            <SEO
                title={pageTitle}
                description={pageDescription}
                club={data?.club?.name}
            />
            <Header favoriteClub={favoriteClub} />

            <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-[#64748B] dark:text-gray-400 mb-6">
                    <Link to="/" className="hover:text-[#16A34A] transition-colors">Home</Link>
                    <span>/</span>
                    {league && (
                        <>
                            <Link
                                to={`/${league}`}
                                className="hover:text-[#16A34A] transition-colors capitalize"
                            >
                                {league.replace(/-/g, " ")}
                            </Link>
                            {club && (
                                <>
                                    <span>/</span>
                                    <span className="text-[#0F172A] dark:text-white font-medium capitalize">
                                        {club.replace(/-/g, " ")}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                </nav>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 text-[#16A34A] animate-spin mb-4" />
                        <p className="text-[#64748B] dark:text-gray-400 text-sm">Loading season data...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-32 glass-card rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
                        <h2 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">Failed to load data</h2>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mb-4">{error}</p>
                        <Link to="/" className="text-[#16A34A] hover:underline font-medium text-sm">
                            ← Return to homepage
                        </Link>
                    </div>
                )}

                {/* Data Loaded */}
                {data && !loading && (
                    <div className="space-y-10">
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {data.leagueEmblem && (
                                <img src={data.leagueEmblem} alt="" className="w-12 h-12 object-contain" />
                            )}
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                                    {data.club ? data.club.name : data.leagueName}
                                </h1>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                                    {data.leagueName} · {data.season} Season
                                </p>
                            </div>
                        </div>

                        {/* Club Stats Card (if club view) */}
                        {data.club && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { label: "Position", value: `#${data.club.position}`, icon: Trophy, color: "text-amber-500" },
                                    { label: "Points", value: data.club.points, icon: Target, color: "text-[#16A34A]" },
                                    { label: "Record", value: `${data.club.won}W ${data.club.draw}D ${data.club.lost}L`, icon: Users, color: "text-blue-500" },
                                    { label: "Goal Diff", value: data.club.gd > 0 ? `+${data.club.gd}` : data.club.gd, icon: Target, color: data.club.gd > 0 ? "text-[#16A34A]" : "text-red-500" },
                                ].map((stat) => (
                                    <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                                        <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                                        <p className="text-2xl font-black text-[#0F172A] dark:text-white">{stat.value}</p>
                                        <p className="text-xs text-[#64748B] dark:text-gray-400 font-medium mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Standings Table */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1.5 h-6 rounded-full gradient-accent" />
                                <h2 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                                    Standings
                                </h2>
                            </div>
                            <div className="glass-card rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs uppercase tracking-wider text-[#94A3B8] border-b border-gray-200 dark:border-gray-700">
                                                <th className="px-4 py-3 w-10">#</th>
                                                <th className="px-4 py-3">Team</th>
                                                <th className="px-4 py-3 text-center">P</th>
                                                <th className="px-4 py-3 text-center">W</th>
                                                <th className="px-4 py-3 text-center">D</th>
                                                <th className="px-4 py-3 text-center">L</th>
                                                <th className="px-4 py-3 text-center hidden sm:table-cell">GF</th>
                                                <th className="px-4 py-3 text-center hidden sm:table-cell">GA</th>
                                                <th className="px-4 py-3 text-center">GD</th>
                                                <th className="px-4 py-3 text-center font-bold">Pts</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.table.map((row) => (
                                                <tr
                                                    key={row.position}
                                                    className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${row.isTarget
                                                        ? "bg-[#16A34A]/5 dark:bg-[#16A34A]/10 font-bold"
                                                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                        }`}
                                                >
                                                    <td className="px-4 py-3 text-[#0F172A] dark:text-white font-bold">{row.position}</td>
                                                    <td className="px-4 py-3">
                                                        <Link
                                                            to={`/${league}/${row.team.toLowerCase().replace(/\s+/g, "-")}`}
                                                            className="flex items-center gap-2 hover:text-[#16A34A] transition-colors"
                                                        >
                                                            {row.crest && (
                                                                <img src={row.crest} alt="" className="w-5 h-5 object-contain" />
                                                            )}
                                                            <span className="text-[#0F172A] dark:text-white">{row.team}</span>
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-[#64748B] dark:text-gray-400">{row.played}</td>
                                                    <td className="px-4 py-3 text-center text-[#64748B] dark:text-gray-400">{row.won}</td>
                                                    <td className="px-4 py-3 text-center text-[#64748B] dark:text-gray-400">{row.draw}</td>
                                                    <td className="px-4 py-3 text-center text-[#64748B] dark:text-gray-400">{row.lost}</td>
                                                    <td className="px-4 py-3 text-center text-[#64748B] dark:text-gray-400 hidden sm:table-cell">{row.gf}</td>
                                                    <td className="px-4 py-3 text-center text-[#64748B] dark:text-gray-400 hidden sm:table-cell">{row.ga}</td>
                                                    <td className={`px-4 py-3 text-center font-medium ${row.gd > 0 ? "text-[#16A34A]" : row.gd < 0 ? "text-red-500" : "text-[#64748B] dark:text-gray-400"}`}>
                                                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-[#0F172A] dark:text-white">{row.points}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Top Scorers */}
                        {data.topScorers.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 rounded-full bg-amber-500" />
                                    <h2 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                                        {data.club ? `${data.club.shortName} Scorers` : "Top Scorers"}
                                    </h2>
                                </div>
                                <div className="glass-card rounded-2xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-xs uppercase tracking-wider text-[#94A3B8] border-b border-gray-200 dark:border-gray-700">
                                                    <th className="px-4 py-3 w-10">#</th>
                                                    <th className="px-4 py-3">Player</th>
                                                    <th className="px-4 py-3">Team</th>
                                                    <th className="px-4 py-3 text-center">Goals</th>
                                                    <th className="px-4 py-3 text-center">Assists</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(data.clubScorers?.length > 0 ? data.clubScorers : data.topScorers).map((s) => (
                                                    <tr key={`${s.rank}-${s.player}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-4 py-3 text-[#0F172A] dark:text-white font-bold">{s.rank}</td>
                                                        <td className="px-4 py-3 text-[#0F172A] dark:text-white font-medium">{s.player}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {s.teamCrest && <img src={s.teamCrest} alt="" className="w-4 h-4 object-contain" />}
                                                                <span className="text-[#64748B] dark:text-gray-400">{s.team}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-[#16A34A]">{s.goals}</td>
                                                        <td className="px-4 py-3 text-center text-[#64748B] dark:text-gray-400">{s.assists ?? "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Related Blog Posts */}
                        {relatedPosts.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-6 rounded-full gradient-accent" />
                                    <h2 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">
                                        Related Articles
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {relatedPosts.map((post) => (
                                        <PostCard key={post.id} post={post} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Internal Links: Other Leagues and Teams */}
                        <section className="border-t border-gray-200 dark:border-gray-800 pt-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] mb-4">
                                Explore Other Leagues
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {LEAGUES.map((l) => (
                                    <Link
                                        key={l.slug}
                                        to={`/${l.slug}`}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${l.slug === league
                                            ? "gradient-accent text-white shadow-md"
                                            : "glass-card text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:text-[#4ade80]"
                                            }`}
                                    >
                                        {l.name}
                                    </Link>
                                ))}
                            </div>

                            {/* Link to other clubs in this league */}
                            {data.table.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#94A3B8] mb-3">
                                        All {data.leagueName} Clubs
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {data.table.map((row) => (
                                            <Link
                                                key={row.team}
                                                to={`/${league}/${row.team.toLowerCase().replace(/\s+/g, "-")}`}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${row.isTarget
                                                    ? "bg-[#16A34A] text-white"
                                                    : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] dark:hover:text-[#4ade80]"
                                                    }`}
                                            >
                                                {row.team}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
