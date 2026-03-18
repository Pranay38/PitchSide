import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { getPublishedPosts } from "../lib/postStorage";
import { topicPath } from "../lib/contentPaths";
import { useClubPreference } from "../hooks/useClubPreference";
import { Trophy, Target, Users, Loader2, AlertCircle } from "lucide-react";

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
    const [articleSort, setArticleSort] = useState<"newest" | "oldest" | "a-z">("newest");

    const blogPosts = useMemo(() => getPublishedPosts(), []);

    const articleMatches = useMemo(() => {
        const leagueLabel = (data?.leagueName || league || "").replace(/-/g, " ").toLowerCase();
        const clubLabel = (data?.club?.name || club || "").replace(/-/g, " ").toLowerCase();

        const matched = blogPosts.filter((post) => {
            const haystacks = [post.club, post.title, post.excerpt, ...post.tags].map((value) => value.toLowerCase());

            if (clubLabel) {
                return haystacks.some((value) => value.includes(clubLabel));
            }

            return haystacks.some((value) => value.includes(leagueLabel));
        });

        return [...matched].sort((left, right) => {
            if (articleSort === "oldest") {
                return new Date(left.date).getTime() - new Date(right.date).getTime();
            }
            if (articleSort === "a-z") {
                return left.title.localeCompare(right.title);
            }
            return new Date(right.date).getTime() - new Date(left.date).getTime();
        });
    }, [articleSort, blogPosts, club, data?.club?.name, data?.leagueName, league]);

    const featuredArticle = articleMatches[0] || null;
    const latestArticles = featuredArticle
        ? articleMatches.filter((post) => post.id !== featuredArticle.id)
        : articleMatches;
    const relatedTopics = useMemo(() => {
        const counts = new Map<string, number>();
        const clubLabel = data?.club?.name || club?.replace(/-/g, " ") || "";
        const leagueLabel = data?.leagueName || league?.replace(/-/g, " ") || "";

        articleMatches.forEach((post) => {
            post.tags.forEach((tag) => {
                if (tag.toLowerCase() === clubLabel.toLowerCase() || tag.toLowerCase() === leagueLabel.toLowerCase()) {
                    return;
                }
                counts.set(tag, (counts.get(tag) || 0) + 1);
            });
        });

        return Array.from(counts.entries())
            .sort((left, right) => right[1] - left[1])
            .slice(0, 6)
            .map(([tag]) => tag);
    }, [articleMatches, club, data?.club?.name, data?.leagueName, league]);

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
        <div className="page-atmosphere min-h-screen transition-colors duration-300">
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
                        <section className="editorial-hero rounded-[2rem] border border-gray-200 p-6 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-8">
                            <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
                            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[#16A34A]/10 blur-3xl" />
                            <div className="relative">
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                                    {data.club ? "Club Season Page" : "League Page"}
                                </p>
                            </div>

                            <div className="relative mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="flex items-center gap-3">
                                        {data.leagueEmblem && (
                                            <img src={data.leagueEmblem} alt="" className="h-12 w-12 object-contain" />
                                        )}
                                        <div>
                                            <h1 className="text-4xl font-black font-outfit text-[#0F172A] dark:text-white md:text-5xl">
                                                {data.club ? data.club.name : data.leagueName}
                                            </h1>
                                            <p className="mt-2 text-base leading-7 text-[#64748B] dark:text-gray-400">
                                                {data.leagueName} · {data.season} season view with standings, scorers, and attached editorial coverage.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                                    <div className="rounded-2xl bg-[#16A34A]/8 p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A]">
                                            {data.club ? "Position" : "Clubs"}
                                        </p>
                                        <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                                            {data.club ? `#${data.club.position}` : data.table.length}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">
                                            {data.club ? "Points" : "Top scorer"}
                                        </p>
                                        <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                                            {data.club ? data.club.points : data.topScorers[0]?.goals || 0}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-[#0F172A]/5 p-4 dark:bg-white/5">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B] dark:text-gray-400">
                                            Attached coverage
                                        </p>
                                        <p className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                                            {articleMatches.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {relatedTopics.length > 0 && (
                                <div className="relative mt-7 flex flex-wrap gap-2">
                                    {relatedTopics.map((topic) => (
                                        <Link key={topic} to={topicPath(topic)} className="filter-chip">
                                            {topic}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

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

                        {/* Attached Blog Posts */}
                        {featuredArticle && (
                            <section className="space-y-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                                            Attached Coverage
                                        </p>
                                        <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                                            Featured article plus the latest linked reads
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[#64748B] dark:text-gray-400">Sort</span>
                                        <select
                                            value={articleSort}
                                            onChange={(event) => setArticleSort(event.target.value as "newest" | "oldest" | "a-z")}
                                            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#0F172A] dark:text-white"
                                        >
                                            <option value="newest">Newest first</option>
                                            <option value="oldest">Oldest first</option>
                                            <option value="a-z">A-Z</option>
                                        </select>
                                    </div>
                                </div>

                                <PostCard post={featuredArticle} featured />

                                {latestArticles.length > 0 && (
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                        {latestArticles.slice(0, 6).map((post) => (
                                            <PostCard key={post.id} post={post} />
                                        ))}
                                    </div>
                                )}
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
