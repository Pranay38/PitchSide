"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowRight, Search, Heart, Shield, Target, Calendar, Trophy, MessageSquare, Activity } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { PageState } from "../components/PageState";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { deslugify, slugify } from "../lib/contentPaths";
import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import { toast } from "sonner";
import { getAllClubs, getClubByName } from "../data/clubs";
import {
  findClubStanding,
  clubsMatch,
  getLeagueCodeForClubLeague,
  getRecentFixturesForClub,
  getRecentForm,
  getUpcomingFixturesForClub,
} from "../lib/clubFixtures";
import type { ClubFixture, ClubStanding } from "../lib/clubFixtures";

function sortPosts(posts: BlogPost[], sort: string): BlogPost[] {
  const ordered = [...posts];
  if (sort === "oldest") {
    return ordered.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  }
  if (sort === "a-z") {
    return ordered.sort((left, right) => left.title.localeCompare(right.title));
  }
  return ordered.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function ClubHubPage() {
  const params = useParams();
  const slug = params.slug ? String(params.slug) : "";
  const [posts, setPosts] = useState<BlogPost[]>(() => getPublishedPosts());
  const [stories, setStories] = useState<StoryFeature[]>(() => getAllStories(true));
  const [loading, setLoading] = useState(posts.length === 0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [isFavorite, setIsFavorite] = useState(false);
  const [recentFixtures, setRecentFixtures] = useState<ClubFixture[]>([]);
  const [nextFixtures, setNextFixtures] = useState<ClubFixture[]>([]);
  const [leagueStanding, setLeagueStanding] = useState<ClubStanding | null>(null);

  const normalizedSlug = slugify(slug);
  const clubData = getAllClubs().find((club) => slugify(club.name) === normalizedSlug) || getClubByName(deslugify(slug));
  const clubLabel = clubData?.name || deslugify(slug);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getPublishedPostsAsync(), getAllStoriesAsync(true)])
      .then(([nextPosts, nextStories]) => {
        if (!isMounted) return;
        setPosts(nextPosts);
        setStories(nextStories);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    setRecentFixtures([]);
    setNextFixtures([]);
    setLeagueStanding(null);

    // Fetch club-specific, verified data. Empty API responses stay empty rather
    // than falling back to invented positions or form results.
    const fetchClubData = async () => {
      try {
        const leagueCode = getLeagueCodeForClubLeague(clubData?.league);
        const [recentF, nextF, standingsResponse] = await Promise.all([
          getRecentFixturesForClub(clubLabel, clubData?.league || "PL"),
          getUpcomingFixturesForClub(clubLabel, clubData?.league || "PL"),
          fetch(`/api/standings?competition=${leagueCode}`),
        ]);

        let nextStanding: ClubStanding | null = null;
        if (standingsResponse.ok) {
          const standingsData = await standingsResponse.json().catch(() => null);
          const table = Array.isArray(standingsData?.table) ? standingsData.table as ClubStanding[] : [];
          nextStanding = findClubStanding(table, clubLabel);
        }

        if (isMounted) {
          setRecentFixtures(recentF);
          setNextFixtures(nextF);
          setLeagueStanding(nextStanding);
        }
      } catch (e) {
        console.error("Failed to fetch club widgets data:", e);
      }
    };
    fetchClubData();

    // Check favorite status
    const currentFav = localStorage.getItem("favoriteClub");
    setIsFavorite(currentFav?.toLowerCase() === clubLabel.toLowerCase());

    return () => {
      isMounted = false;
    };
  }, [clubLabel]);

  const toggleFavorite = () => {
    if (isFavorite) {
      localStorage.removeItem("favoriteClub");
      setIsFavorite(false);
      toast.success(`${clubLabel} removed from favorites`);
      // Optional: Dispatch event to sync other tabs
      window.dispatchEvent(new Event("storage"));
    } else {
      localStorage.setItem("favoriteClub", clubLabel);
      setIsFavorite(true);
      toast.success(`${clubLabel} set as your favorite club!`);
      window.dispatchEvent(new Event("storage"));
    }
  };

  const matchingPosts = useMemo(() => {
    const clubMatches = posts.filter((post) => {
      // Direct club match or tag match
      return post.club?.toLowerCase() === normalizedSlug.replace(/-/g, " ") ||
             post.tags.some(t => t.toLowerCase() === normalizedSlug.replace(/-/g, " "));
    });

    const filteredByQuery = query.trim()
      ? clubMatches.filter((post) => {
          const haystacks = [post.title, post.excerpt, post.playerName || "", ...post.tags];
          return haystacks.some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));
        })
      : clubMatches;

    return sortPosts(filteredByQuery, sort);
  }, [normalizedSlug, posts, query, sort]);

  const matchingStories = useMemo(() => {
    return stories.filter(story => {
      const s = story as any;
      return s.club?.toLowerCase() === normalizedSlug.replace(/-/g, " ") ||
             s.tags?.some((t: any) => t.toLowerCase() === normalizedSlug.replace(/-/g, " "));
    });
  }, [stories, normalizedSlug]);

  const featuredPost = matchingPosts.find(p => p.mainStory) || matchingPosts[0] || null;
  const latestPosts = featuredPost
    ? matchingPosts.filter((post) => post.id !== featuredPost.id)
    : matchingPosts;
  const recentForm = useMemo(() => getRecentForm(recentFixtures, clubLabel), [clubLabel, recentFixtures]);

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title={`${clubLabel} Hub`}
        description={`${clubLabel} news, fixtures, transfers, and tactical analysis.`}
      />
      <Header />

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6">
        {/* Club Hero Banner */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0F172A] to-[#1E293B] dark:from-[#0B1120] dark:to-[#0F172A] border border-gray-800 p-8 md:p-12 lg:p-16 shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#16A34A]/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 flex items-center justify-center shrink-0 shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#16A34A]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {clubData?.logo ? (
                      <img src={clubData.logo} alt={clubLabel} className="w-full h-full object-contain relative z-10 filter drop-shadow-md" />
                  ) : (
                      <Shield className="w-12 h-12 text-white/50" />
                  )}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-sm border border-white/10">Club Hub</span>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-outfit text-white tracking-tight mb-2">
                  {clubLabel}
                </h1>
                <p className="text-white/60 text-lg font-medium max-w-xl">
                  {clubData?.league || "Global Football"}
                </p>
              </div>
            </div>

            <div className="shrink-0">
                <button
                    onClick={toggleFavorite}
                    className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 overflow-hidden ${
                        isFavorite 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                            : 'bg-white text-[#0F172A] hover:bg-gray-100 hover:scale-105 shadow-xl'
                    }`}
                >
                    <div className="relative z-10 flex items-center gap-2">
                        <Heart className={`w-5 h-5 transition-transform duration-300 ${isFavorite ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
                        <span>{isFavorite ? 'Remove from favorites' : 'Set as favorite club'}</span>
                    </div>
                </button>
            </div>
          </div>
          
          <div className="relative z-10 mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/10 pt-8">
            <div className="flex flex-col">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Total Posts</span>
                <span className="text-white text-2xl font-black">{matchingPosts.length}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Web Stories</span>
                <span className="text-white text-2xl font-black">{matchingStories.length}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">League</span>
                <span className="text-white text-lg font-bold">{clubData?.league || "Global Football"}</span>
            </div>
          </div>
        </section>

        {/* Enhanced Club Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Quick Stats Bar (Spans full width or 2/3) */}
            <section id="fixtures" className="lg:col-span-3 flex flex-col sm:flex-row items-center gap-4 bg-[#1E293B] border border-white/5 rounded-[16px] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1 flex items-center justify-center sm:justify-start gap-4 border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0 sm:pr-4">
                    <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">League Position</p>
                        <p className="text-xl font-bold text-white">{leagueStanding ? `#${leagueStanding.position}` : "—"}</p>
                        <p className="text-xs text-gray-500">
                          {leagueStanding ? `${leagueStanding.points} points from ${leagueStanding.played} matches` : "Live table unavailable"}
                        </p>
                    </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center sm:justify-start gap-4 border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0 sm:pr-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium mb-1">Recent Form</p>
                        <div className="flex items-center gap-1">
                            {recentForm.length > 0 ? recentForm.map((result, index) => {
                              const color = result === "W" ? "bg-green-500" : result === "L" ? "bg-red-500" : "bg-gray-500";
                              return (
                                <span key={`${result}-${index}`} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white ${color}`}>
                                  {result}
                                </span>
                              );
                            }) : <span className="text-xs text-gray-500">No recent league results</span>}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center sm:justify-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Next Fixture</p>
                        {nextFixtures.length > 0 ? (
                            <p className="text-sm font-bold text-white truncate max-w-[150px]">
                                vs {clubsMatch(nextFixtures[0].homeTeam.name, clubLabel) ? nextFixtures[0].awayTeam.name : nextFixtures[0].homeTeam.name}
                            </p>
                        ) : (
                            <p className="text-sm font-bold text-white">No scheduled fixture</p>
                        )}
                    </div>
                </div>
            </section>



            <section className="lg:col-span-3 flex items-center justify-between gap-5 rounded-[16px] border border-white/5 bg-[#1E293B] p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-[#16A34A]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Join the conversation</p>
                  <p className="mt-1 text-xs text-gray-400">Have your say in the Debate Arena.</p>
                </div>
              </div>
              <Link to="/debates" className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10">
                View debates
              </Link>
            </section>
        </div>

        {/* Stories Section (if any) */}
        {matchingStories.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-[#16A34A]" />
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Web Stories</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
              {matchingStories.map(story => (
                <Link 
                  key={story.id} 
                  to={`/stories/${story.slug}`}
                  className="relative shrink-0 w-32 h-48 sm:w-40 sm:h-60 rounded-2xl overflow-hidden group snap-start border border-gray-200 dark:border-gray-800"
                >
                  <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
                    <p className="text-white text-sm font-bold leading-tight">{story.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="section-surface mt-8 rounded-[2rem] border border-gray-200 p-4 shadow-sm dark:border-gray-800 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[2fr_220px_220px]">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 dark:border-gray-700 dark:bg-[#08111f]">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${clubLabel} coverage...`}
                className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] dark:text-white"
              />
            </label>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] outline-none dark:border-gray-700 dark:bg-[#08111f] dark:text-white">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="a-z">A-Z</option>
            </select>
            <div className="rounded-2xl bg-[#16A34A]/10 px-4 py-3 text-sm font-semibold text-[#16A34A]">
              {matchingPosts.length} article{matchingPosts.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {/* Posts Area */}
        <section className="mt-10">
          {loading && posts.length === 0 ? (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0F172A]">
                  <div className="aspect-[16/10] animate-pulse bg-gray-200 dark:bg-gray-800" />
                  <div className="space-y-4 p-5">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPost ? (
            <div className="space-y-10">
              <section>
                <div className="mb-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A]">
                    Featured Match / News
                  </p>
                  <h2 className="mt-2 text-3xl font-black font-outfit text-[#0F172A] dark:text-white">
                    Lead {clubLabel} Story
                  </h2>
                </div>
                <PostCard post={featuredPost} featured />
              </section>

              {latestPosts.length > 0 && (
                <section className="section-surface rounded-[2rem] border border-gray-200 p-6 shadow-sm dark:border-gray-800 md:p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">
                      Latest Coverage
                    </h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {latestPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <PageState
              icon={Shield}
              eyebrow={clubLabel}
              title={`No coverage for ${clubLabel} yet`}
              description={query.trim()
                ? "Nothing matched your search filter. Try clearing it."
                : "Check back later for the latest news, tactics, and interviews for this club."}
              action={(
                <Link
                  to={`/`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white"
                >
                  Return home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
