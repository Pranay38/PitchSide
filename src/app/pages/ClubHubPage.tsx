"use client";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowRight, Search, Heart, Shield, Flame, Target, Briefcase, Calendar, Trophy, Users, MessageSquare, Activity } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { PostCard } from "../components/PostCard";
import { PageState } from "../components/PageState";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { deslugify } from "../lib/contentPaths";
import type { BlogPost } from "../data/posts";
import type { StoryFeature } from "../data/stories";
import { toast } from "sonner";
import { getClubByName } from "../data/clubs";
import { getTransferWatchEntriesAsync } from "../lib/siteSettingsStorage";
import type { TransferWatchEntry } from "../lib/transferWatch";
import { formatTransferWatchAmount } from "../lib/transferWatch";
import { getRecentFixturesForClub, getUpcomingFixturesForClub } from "../lib/clubFixtures";
import type { ClubFixture } from "../lib/clubFixtures";
import { PollWidget } from "../components/PollWidget";

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
  const [transfers, setTransfers] = useState<TransferWatchEntry[]>([]);
  const [recentFixtures, setRecentFixtures] = useState<ClubFixture[]>([]);
  const [nextFixtures, setNextFixtures] = useState<ClubFixture[]>([]);
  const [fanZoneTab, setFanZoneTab] = useState<"polls" | "debates">("polls");

  const normalizedSlug = slug.toLowerCase();
  const clubLabel = deslugify(slug);
  const clubData = getClubByName(clubLabel);

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

    // Fetch club specific data
    const fetchClubData = async () => {
      try {
        const [transferData, recentF, nextF] = await Promise.all([
          getTransferWatchEntriesAsync(clubLabel),
          getRecentFixturesForClub(clubLabel, clubData?.league || "PL"),
          getUpcomingFixturesForClub(clubLabel, clubData?.league || "PL")
        ]);
        if (isMounted) {
          setTransfers(transferData.slice(0, 3)); // Only top 3 for the widget
          setRecentFixtures(recentF);
          setNextFixtures(nextF);
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

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title={`${clubLabel} Hub`}
        description={`The ultimate ${clubLabel} fan hub. Read the latest news, stories, and tactical analysis.`}
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
          
          <div className="relative z-10 mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-8">
            <div className="flex flex-col">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Total Posts</span>
                <span className="text-white text-2xl font-black">{matchingPosts.length}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Web Stories</span>
                <span className="text-white text-2xl font-black">{matchingStories.length}</span>
            </div>
            <div className="flex flex-col">
                <span className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Fan Sentiment</span>
                <span className="text-[#16A34A] flex items-center gap-1.5 text-lg font-bold">
                    <Flame className="w-5 h-5 fill-current" /> High
                </span>
            </div>
          </div>
        </section>

        {/* Enhanced Club Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Quick Stats Bar (Spans full width or 2/3) */}
            <div className="lg:col-span-3 flex flex-col sm:flex-row items-center gap-4 bg-[#1E293B] border border-white/5 rounded-[16px] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-1 flex items-center justify-center sm:justify-start gap-4 border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0 sm:pr-4">
                    <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium">League Position</p>
                        <p className="text-xl font-bold text-white">4th <span className="text-xs font-normal text-gray-500">(Placeholder)</span></p>
                    </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center sm:justify-start gap-4 border-b sm:border-b-0 sm:border-r border-white/5 pb-4 sm:pb-0 sm:pr-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 font-medium mb-1">Recent Form</p>
                        <div className="flex items-center gap-1">
                            {recentFixtures.length > 0 ? recentFixtures.slice(-5).map((f, i) => {
                                // Dummy W/D/L logic if score is available
                                const isHome = f.homeTeam.name.toLowerCase().includes(clubLabel.toLowerCase());
                                const homeScore = f.score.home || 0;
                                const awayScore = f.score.away || 0;
                                let res = 'D';
                                let color = 'bg-gray-500';
                                if (isHome) {
                                    if (homeScore > awayScore) { res = 'W'; color = 'bg-green-500'; }
                                    else if (homeScore < awayScore) { res = 'L'; color = 'bg-red-500'; }
                                } else {
                                    if (awayScore > homeScore) { res = 'W'; color = 'bg-green-500'; }
                                    else if (awayScore < homeScore) { res = 'L'; color = 'bg-red-500'; }
                                }
                                return (
                                    <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white ${color}`}>
                                        {res}
                                    </span>
                                )
                            }) : (
                                <>
                                    <span className="w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white bg-green-500">W</span>
                                    <span className="w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white bg-green-500">W</span>
                                    <span className="w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white bg-gray-500">D</span>
                                    <span className="w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white bg-red-500">L</span>
                                    <span className="w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold text-white bg-green-500">W</span>
                                </>
                            )}
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
                                vs {nextFixtures[0].homeTeam.name.toLowerCase().includes(clubLabel.toLowerCase()) ? nextFixtures[0].awayTeam.name : nextFixtures[0].homeTeam.name}
                            </p>
                        ) : (
                            <p className="text-sm font-bold text-white">vs TBD</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Transfer Activity Section */}
            <div className="lg:col-span-2 bg-[#1E293B] border border-white/5 rounded-[16px] p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#16A34A]" />
                        Transfer Watch
                    </h3>
                    <Link to="/transfer-tracker" className="text-sm text-[#16A34A] hover:underline flex items-center gap-1 font-medium">
                        View all <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                    {transfers.length > 0 ? transfers.map(t => (
                        <div key={t.id} className="bg-[#0F172A] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                            {t.playerImageUrl ? (
                                <img src={t.playerImageUrl} alt={t.player} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                    <Users className="w-5 h-5" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{t.player}</p>
                                <p className="text-xs text-gray-400 truncate">
                                    {t.fromClub ? `${t.fromClub} → ${t.club}` : t.club}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs font-black text-[#16A34A]">{formatTransferWatchAmount(t)}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t.status}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-2 text-center py-6 text-gray-400 text-sm">
                            No active transfer rumors for this club right now.
                        </div>
                    )}
                </div>
            </div>

            {/* Fan Zone Widget */}
            <div className="lg:col-span-1 bg-[#1E293B] border border-white/5 rounded-[16px] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="flex border-b border-white/5">
                    <button 
                        onClick={() => setFanZoneTab("polls")}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${fanZoneTab === "polls" ? "text-[#16A34A] border-b-2 border-[#16A34A]" : "text-gray-400 hover:text-white"}`}
                    >
                        Polls
                    </button>
                    <button 
                        onClick={() => setFanZoneTab("debates")}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${fanZoneTab === "debates" ? "text-[#16A34A] border-b-2 border-[#16A34A]" : "text-gray-400 hover:text-white"}`}
                    >
                        Debates
                    </button>
                </div>
                
                <div className="p-4 flex-1">
                    {fanZoneTab === "polls" ? (
                        <PollWidget 
                            pollId="dummy-club-poll"
                            title="Fan Verdict"
                            className="!my-0 !border-none !bg-transparent !shadow-none"
                            poll={{
                                question: `Who is ${clubLabel}'s most important player right now?`,
                                options: [
                                    { id: "opt1", text: "The Star Striker", votes: 450 },
                                    { id: "opt2", text: "The Playmaker", votes: 320 },
                                    { id: "opt3", text: "The Rock at the Back", votes: 150 },
                                ]
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <MessageSquare className="w-8 h-8 text-gray-500 mb-2" />
                            <p className="text-sm font-bold text-white mb-1">Join the Debate</p>
                            <p className="text-xs text-gray-400">Head over to the Debate Arena to have your say on recent tactics.</p>
                            <Link to="/debates" className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium transition-colors border border-white/10">
                                View Debates
                            </Link>
                        </div>
                    )}
                </div>
            </div>
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
