import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { getAllPlayers } from "@/app/lib/data-fetcher";

export const metadata: Metadata = {
  title: "Player Directory | Tactical Analysis & Stats | Touchline Dribble",
  description: "Explore tactical profiles, stats, and analysis of top football players.",
};

export default async function PlayersIndexPage() {
  const players = await getAllPlayers();
  
  // Group by league then by team
  const grouped: Record<string, Record<string, any[]>> = {};
  
  players.forEach((p: any) => {
    if (!grouped[p.league]) grouped[p.league] = {};
    if (!grouped[p.league][p.team]) grouped[p.league][p.team] = [];
    grouped[p.league][p.team].push(p);
  });

  return (
    <main className="min-h-screen bg-zinc-950 font-outfit selection:bg-[#39FF14] selection:text-black text-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 border-b-4 border-zinc-800 pb-8">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
            Player <span className="text-[#39FF14]">Hub</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            Deep dive into tactical profiles, roles, and stats for the best players across the top 5 leagues.
          </p>
        </header>

        <div className="space-y-16">
          {Object.keys(grouped).map(league => (
            <section key={league} className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter border-l-8 border-[#39FF14] pl-4">
                {league}
              </h2>
              
              <div className="space-y-8">
                {Object.keys(grouped[league]).map(team => (
                  <div key={team} className="bg-zinc-900 border-2 border-zinc-800 p-6">
                    <h3 className="text-2xl font-black uppercase mb-6 text-zinc-300">
                      {team}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {grouped[league][team].map((player: any) => (
                        <Link 
                          href={`/players/${player.slug}`} 
                          key={player.slug}
                          className="block bg-zinc-950 border border-zinc-800 p-4 hover:border-[#39FF14] transition-colors group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-black text-xl uppercase group-hover:text-[#39FF14] transition-colors">{player.name}</h4>
                              <p className="text-zinc-500 text-sm font-bold uppercase">{player.position}</p>
                            </div>
                            <div className="bg-zinc-800 px-2 py-1 text-[#39FF14] font-mono font-bold text-sm">
                              {player.seasonStats.rating}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
