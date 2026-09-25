import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import Link from 'next/link';
import { Swords, Users, Goal } from 'lucide-react';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

export const metadata: Metadata = {
  title: 'Football Comparisons — Player vs Player, Team vs Team | The Touchline Dribble',
  description: 'Deep dive tactical comparisons. Player vs player, team vs team, and formation vs formation.',
  openGraph: {
    title: 'Football Comparisons — The Touchline Dribble',
    description: 'Deep dive tactical comparisons. Player vs player, team vs team, and formation vs formation.',
    url: 'https://www.thetouchlinedribble.in/vs',
    siteName: 'The Touchline Dribble',
  },
};

function getComparisons() {
  const filePath = path.join(process.cwd(), 'data', 'comparisons.json');
  if (!fs.existsSync(filePath)) return [];
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default function ComparisonsIndexPage() {
  const comparisons = getComparisons();
  
  const players = comparisons.filter((c: any) => c.type === 'player');
  const teams = comparisons.filter((c: any) => c.type === 'team');
  const formations = comparisons.filter((c: any) => c.type === 'formation');

  return (
    <main className="min-h-screen bg-zinc-950 font-outfit selection:bg-[#39FF14] selection:text-black">
      <Header />
      
      <article className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-16 border-b-4 border-zinc-800 pb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
            Tactical <span className="text-[#39FF14]">Comparisons</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-bold max-w-2xl">
            Settle the debates. Head-to-head tactical breakdowns of players, teams, and formations.
          </p>
        </header>

        <div className="space-y-16">
          
          {/* Players */}
          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-2 border-l-4 border-[#39FF14] pl-4">
               <Users className="w-6 h-6 text-[#39FF14]" /> Player vs Player
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((c: any) => (
                <Link key={c.slug} href={`/vs/${c.slug}`} className="block group">
                  <div className="bg-zinc-900 border-2 border-zinc-800 p-6 transition-all duration-300 group-hover:border-[#39FF14] group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-black text-white">{c.entityA.name}</div>
                      <div className="text-[#39FF14] text-xs font-black italic">VS</div>
                      <div className="text-lg font-black text-white">{c.entityB.name}</div>
                    </div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest line-clamp-2">
                      {c.keyAspects.join(' • ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Teams */}
          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-2 border-l-4 border-[#39FF14] pl-4">
               <Swords className="w-6 h-6 text-[#39FF14]" /> Team vs Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((c: any) => (
                <Link key={c.slug} href={`/vs/${c.slug}`} className="block group">
                  <div className="bg-zinc-900 border-2 border-zinc-800 p-6 transition-all duration-300 group-hover:border-[#39FF14] group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-black text-white">{c.entityA.name}</div>
                      <div className="text-[#39FF14] text-xs font-black italic">VS</div>
                      <div className="text-lg font-black text-white">{c.entityB.name}</div>
                    </div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest line-clamp-2">
                      {c.keyAspects.join(' • ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Formations */}
          <section>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-2 border-l-4 border-[#39FF14] pl-4">
               <Goal className="w-6 h-6 text-[#39FF14]" /> Formation vs Formation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formations.map((c: any) => (
                <Link key={c.slug} href={`/vs/${c.slug}`} className="block group">
                  <div className="bg-zinc-900 border-2 border-zinc-800 p-6 transition-all duration-300 group-hover:border-[#39FF14] group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-black text-white">{c.entityA.name}</div>
                      <div className="text-[#39FF14] text-xs font-black italic">VS</div>
                      <div className="text-lg font-black text-white">{c.entityB.name}</div>
                    </div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest line-clamp-2">
                      {c.keyAspects.join(' • ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </article>
      
      <Footer />
    </main>
  );
}
