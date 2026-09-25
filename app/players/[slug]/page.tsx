import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { getPlayerData, getAllPlayers } from "@/app/lib/data-fetcher";
import { Activity, Target, Shield, Zap } from "lucide-react";

export async function generateStaticParams() {
  const players = await getAllPlayers();
  return players.map((p: any) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const player = await getPlayerData(slug);
  
  if (!player) {
    return { title: 'Player Not Found' };
  }

  return {
    title: `${player.name} — Tactical Profile & Stats 2026 | The Touchline Dribble`,
    description: `Tactical profile for ${player.name} (${player.team}). Stats, strengths, weaknesses, and tactical role analysis.`,
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = await getPlayerData(slug);

  if (!player) {
    return <div className="text-white p-8">Player not found</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 font-outfit selection:bg-[#39FF14] selection:text-black">
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: player.name,
            jobTitle: "Football Player",
            memberOf: {
              "@type": "SportsTeam",
              name: player.team
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
              { "@type": "ListItem", position: 2, name: player.league, item: `https://www.thetouchlinedribble.in/leagues/${player.league.toLowerCase().replace(/ /g, '-')}` },
              { "@type": "ListItem", position: 3, name: player.team, item: `https://www.thetouchlinedribble.in/club/${player.team.toLowerCase().replace(/ /g, '-')}` },
              { "@type": "ListItem", position: 4, name: player.name },
            ],
          }),
        }}
      />

      <article className="max-w-5xl mx-auto px-4 py-12">
        <nav className="flex items-center space-x-2 text-zinc-400 text-xs font-black uppercase tracking-widest mb-12 flex-wrap gap-y-2">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/leagues/${player.league.toLowerCase().replace(/ /g, '-')}`} className="hover:text-white transition-colors">{player.league}</Link>
          <span>/</span>
          <Link href={`/club/${player.team.toLowerCase().replace(/ /g, '-')}`} className="hover:text-white transition-colors">{player.team}</Link>
          <span>/</span>
          <span className="text-[#39FF14]">{player.name}</span>
        </nav>

        <header className="mb-16 border-b-4 border-zinc-800 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-[#39FF14] text-black font-black uppercase text-xs px-2 py-1 tracking-widest">
                  {player.position}
                </span>
                <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest">
                  {player.nationality} • Age {player.age}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                {player.name}
              </h1>
              <p className="text-zinc-400 text-xl font-bold uppercase">
                {player.team}
              </p>
            </div>
            <div className="text-right">
              <div className="text-zinc-500 text-sm font-black uppercase tracking-widest mb-1">Season Rating</div>
              <div className="text-6xl font-black text-[#39FF14] font-mono leading-none">
                {player.seasonStats.rating}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            {/* Stats Grid */}
            <section className="bg-zinc-900 border-2 border-zinc-800 p-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-[#39FF14]" /> Output (25/26)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950 p-4 border border-zinc-800">
                  <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Goals</div>
                  <div className="text-3xl font-black text-white font-mono">{player.seasonStats.goals}</div>
                </div>
                <div className="bg-zinc-950 p-4 border border-zinc-800">
                  <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Assists</div>
                  <div className="text-3xl font-black text-white font-mono">{player.seasonStats.assists}</div>
                </div>
                <div className="bg-zinc-950 p-4 border border-zinc-800">
                  <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">xG</div>
                  <div className="text-3xl font-black text-white font-mono">{player.seasonStats.xG}</div>
                </div>
                <div className="bg-zinc-950 p-4 border border-zinc-800">
                  <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Apps</div>
                  <div className="text-3xl font-black text-white font-mono">{player.seasonStats.appearances}</div>
                </div>
              </div>
            </section>

            {/* Tactical Role */}
            <section>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-6 border-l-8 border-[#39FF14] pl-4">
                Tactical Blueprint
              </h2>
              <div className="prose prose-invert prose-lg max-w-none text-zinc-300 font-medium leading-relaxed">
                <p>{player.tacticalRole}</p>
              </div>
            </section>

            {/* Strengths & Weaknesses */}
            <section className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#39FF14]/10 border-2 border-[#39FF14]/30 p-6">
                <h3 className="text-xl font-black text-[#39FF14] uppercase tracking-tighter mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Elite Traits
                </h3>
                <ul className="space-y-3">
                  {player.strengths.map((str: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-white font-bold">
                      <div className="w-2 h-2 bg-[#39FF14]"></div>
                      {str}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-500/10 border-2 border-red-500/30 p-6">
                <h3 className="text-xl font-black text-red-500 uppercase tracking-tighter mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Vulnerabilities
                </h3>
                <ul className="space-y-3">
                  {player.weaknesses.map((wk: string, i: number) => (
                    <li key={i} className="flex items-center gap-3 text-white font-bold">
                      <div className="w-2 h-2 bg-red-500"></div>
                      {wk}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-8">
            <div className="bg-zinc-900 border-2 border-zinc-800 p-6">
              <h4 className="text-white font-black uppercase tracking-wide mb-4">
                Explore More
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href={`/club/${player.team.toLowerCase().replace(/ /g, '-')}`} className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                    → {player.team} Club Hub
                  </Link>
                </li>
                <li>
                  <Link href={`/leagues/${player.league.toLowerCase().replace(/ /g, '-')}`} className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                    → {player.league} Action
                  </Link>
                </li>
                <li>
                  <Link href={`/players`} className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                    → Player Directory
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </article>

      <Footer />
    </main>
  );
}
