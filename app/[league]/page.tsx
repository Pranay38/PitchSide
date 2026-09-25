import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { getLeagueData, getAllPlayers } from "@/app/lib/data-fetcher";
import { getPublishedPostsServer } from "@/lib/server-data";
import fs from "fs";
import path from "path";

export const revalidate = 3600; // ISR 1 hour

export async function generateMetadata({ params }: { params: Promise<{ league: string }> }): Promise<Metadata> {
  const { league: slug } = await params;
  const leagueData = await getLeagueData(slug);
  
  if (!leagueData) {
    return { title: "League Not Found" };
  }

  return {
    title: `${leagueData.name} Tactical Analysis & News 2026 | The Touchline Dribble`,
    description: leagueData.description,
  };
}

export default async function LeagueHubPage({ params }: { params: Promise<{ league: string }> }) {
  const { league: slug } = await params;
  
  const leagueData = await getLeagueData(slug);
  
  if (!leagueData) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white font-outfit selection:bg-[#39FF14] selection:text-black">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">League Not Found</h1>
          <p className="text-zinc-500">We couldn't find data for this league.</p>
          <Link href="/" className="mt-8 inline-block text-[#39FF14] font-bold uppercase hover:underline">Return Home</Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Fetch relevant posts
  const allPosts = await getPublishedPostsServer();
  const leaguePosts = allPosts.filter((post: any) => 
    post.tags?.some((tag: string) => tag.toLowerCase() === leagueData.name.toLowerCase())
  ).slice(0, 6);

  // Fetch players in this league
  const allPlayers = await getAllPlayers();
  const leaguePlayers = allPlayers.filter((p: any) => p.league === leagueData.name).slice(0, 12);

  // Fetch managers in this league
  let leagueManagers: any[] = [];
  try {
    const managersPath = path.join(process.cwd(), 'data', 'manager_pressure.json');
    if (fs.existsSync(managersPath)) {
      const allManagers = JSON.parse(fs.readFileSync(managersPath, 'utf-8'));
      leagueManagers = allManagers.filter((m: any) => m.league === leagueData.name);
    }
  } catch (e) {}

  return (
    <main className="min-h-screen bg-zinc-950 font-outfit selection:bg-[#39FF14] selection:text-black">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            name: leagueData.name,
            sport: "Football",
            description: leagueData.description,
            location: {
              "@type": "Place",
              name: leagueData.country
            }
          }),
        }}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.thetouchlinedribble.in" },
              { "@type": "ListItem", position: 2, name: leagueData.name },
            ],
          }),
        }}
      />

      <article className="max-w-6xl mx-auto px-4 py-12">
        <nav className="flex items-center space-x-2 text-zinc-400 text-xs font-black uppercase tracking-widest mb-12">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#39FF14]">{leagueData.name}</span>
        </nav>

        <header className="mb-16 border-b-4 border-zinc-800 pb-8">
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4">
            {leagueData.name}
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-3xl leading-relaxed">
            {leagueData.description}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-16">
            {/* Articles Section */}
            <section>
              <div className="flex justify-between items-end border-b-2 border-zinc-800 pb-2 mb-6">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                  Latest Tactical Intel
                </h2>
              </div>
              
              {leaguePosts.length > 0 ? (
                <div className="space-y-6">
                  {leaguePosts.map((post: any) => (
                    <Link href={`/p/${post.slug || post.id}`} key={post.id} className="block group">
                      <div className="bg-zinc-900 border border-zinc-800 p-6 group-hover:border-[#39FF14] transition-colors">
                        <div className="text-[#39FF14] text-xs font-black uppercase tracking-widest mb-2">
                          {post.category || 'Analysis'}
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-[#39FF14] transition-colors mb-3">
                          {post.title}
                        </h3>
                        <p className="text-zinc-400 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900 border-2 border-dashed border-zinc-800 p-8 text-center">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest">No recent articles found.</p>
                </div>
              )}
            </section>

            {/* Players Spotlight */}
            <section>
              <div className="flex justify-between items-end border-b-2 border-zinc-800 pb-2 mb-6">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                  Players to Watch
                </h2>
                <Link href="/players" className="text-[#39FF14] text-sm font-black uppercase tracking-widest hover:underline">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {leaguePlayers.map((player: any) => (
                  <Link href={`/players/${player.slug}`} key={player.slug} className="group block">
                    <div className="bg-zinc-900 border border-zinc-800 p-4 group-hover:bg-[#39FF14]/5 transition-colors h-full flex flex-col justify-between">
                      <div>
                        <h4 className="text-white font-black uppercase group-hover:text-[#39FF14] transition-colors">
                          {player.name}
                        </h4>
                        <p className="text-zinc-500 text-xs font-bold uppercase">{player.team}</p>
                      </div>
                      <div className="mt-4 flex justify-between items-end">
                        <span className="text-xs text-zinc-400 uppercase font-black">{player.position}</span>
                        <span className="text-[#39FF14] font-mono font-bold text-sm bg-zinc-950 px-2 py-1">{player.seasonStats.rating}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-12">
            {/* Manager Pressure Widget */}
            <div className="bg-zinc-900 border-2 border-zinc-800 p-6">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                Manager Hot Seat
              </h3>
              <div className="space-y-4">
                {leagueManagers.sort((a, b) => b.pressureScore - a.pressureScore).slice(0, 5).map((manager: any) => (
                  <Link href={`/managers/${manager.slug}`} key={manager.slug} className="flex items-center justify-between group">
                    <div>
                      <div className="text-white font-black uppercase group-hover:text-[#39FF14] transition-colors text-sm">
                        {manager.name}
                      </div>
                      <div className="text-zinc-500 text-xs font-bold uppercase">{manager.club}</div>
                    </div>
                    <div className={`font-mono font-black ${manager.pressureScore > 75 ? 'text-red-500' : manager.pressureScore > 50 ? 'text-yellow-400' : 'text-[#39FF14]'}`}>
                      {manager.pressureScore}%
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Club Hubs Index */}
            <div className="bg-[#39FF14]/5 border-2 border-[#39FF14]/20 p-6">
              <h3 className="text-xl font-black text-[#39FF14] uppercase tracking-tighter mb-4">
                Club Hubs
              </h3>
              <p className="text-zinc-400 text-sm mb-6">Access deep tactical analysis for every team.</p>
              <div className="grid grid-cols-2 gap-2">
                {Array.from(new Set(leaguePlayers.map((p: any) => p.team))).map((team: any) => (
                  <Link 
                    key={team} 
                    href={`/club/${team.toLowerCase().replace(/ /g, '-')}`}
                    className="text-zinc-300 hover:text-[#39FF14] text-xs font-black uppercase truncate transition-colors"
                  >
                    {team}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </article>

      <Footer />
    </main>
  );
}
