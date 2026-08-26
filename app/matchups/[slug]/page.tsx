import { Metadata } from "next";
import Link from "next/link";
import { Shield, Swords, Activity, Zap, BarChart3, Clock } from "lucide-react";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { getMatchupData } from "@/app/lib/data-fetcher";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getMatchupData(params.slug);
  const pageUrl = `https://www.thetouchlinedribble.in/matchups/${params.slug}`;
  return {
    title: `${data.homeTeam} vs ${data.awayTeam} Tactics & Predicted Lineups | Touchline Dribble`,
    description: `Tactical preview for ${data.homeTeam} vs ${data.awayTeam}. We break down formations, the key battles like ${data.keyBattle.homePlayer} vs ${data.keyBattle.awayPlayer}, and how the match will be won.`,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `⚔️ ${data.homeTeam} vs ${data.awayTeam} — Tactical Breakdown`,
      description: `${data.predictedFormation.home} vs ${data.predictedFormation.away}. Key battle: ${data.keyBattle.homePlayer} vs ${data.keyBattle.awayPlayer}. Who wins? Vote now.`,
      url: pageUrl,
      type: 'article',
      siteName: 'The Touchline Dribble',
    },
    twitter: {
      card: 'summary_large_image',
      title: `⚔️ ${data.homeTeam} vs ${data.awayTeam} Tactics`,
      description: `Formation matchup: ${data.predictedFormation.home} vs ${data.predictedFormation.away}. Full tactical breakdown inside.`,
      site: '@TouchlineDribbl',
      creator: '@TouchlineDribbl',
    },
  };
}

export default async function MatchupPreviewPage({ params }: { params: { slug: string } }) {
  const data = await getMatchupData(params.slug);

  return (
    <main className="min-h-screen bg-zinc-950 font-outfit selection:bg-[#39FF14] selection:text-black">
      <Header />
      
      {/* JSON-LD: SportsEvent Schema for Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: `${data.homeTeam} vs ${data.awayTeam}`,
            description: data.tacticalTakeaway,
            url: `https://www.thetouchlinedribble.in/matchups/${params.slug}`,
            location: { "@type": "Place", name: data.venue },
            homeTeam: { "@type": "SportsTeam", name: data.homeTeam },
            awayTeam: { "@type": "SportsTeam", name: data.awayTeam },
            organizer: { "@type": "Organization", name: data.competition },
          }),
        }}
      />
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.thetouchlinedribble.in" },
              { "@type": "ListItem", position: 2, name: "Matchups", item: "https://www.thetouchlinedribble.in/matchups" },
              { "@type": "ListItem", position: 3, name: `${data.homeTeam} vs ${data.awayTeam}` },
            ],
          }),
        }}
      />
      
      <article className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-zinc-400 text-xs font-black uppercase tracking-widest mb-12">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/matchups" className="hover:text-white transition-colors">Matchups</Link>
          <span>/</span>
          <span className="text-[#39FF14]">{data.homeTeam} vs {data.awayTeam}</span>
        </nav>

        {/* Hero Scoreboard Style */}
        <header className="mb-16 border-b-4 border-zinc-800 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 text-zinc-300 font-bold uppercase tracking-widest text-xs px-4 py-2 border border-zinc-700 mb-8">
            <Clock className="w-4 h-4" />
            {data.competition} • {data.kickoff}
          </div>
          
          <h1 className="sr-only">{data.homeTeam} vs {data.awayTeam} — Tactical Preview</h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="text-right flex-1">
              <span className="block text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                {data.homeTeam}
              </span>
              <p className="text-zinc-500 font-black font-mono mt-2 text-xl tracking-widest">
                {data.predictedFormation.home}
              </p>
            </div>
            
            <div className="bg-[#39FF14] text-black px-6 py-4 font-black text-3xl italic shadow-[4px_4px_0_0_#fff] transform -skew-x-12">
              VS
            </div>
            
            <div className="text-left flex-1">
              <span className="block text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                {data.awayTeam}
              </span>
              <p className="text-zinc-500 font-black font-mono mt-2 text-xl tracking-widest">
                {data.predictedFormation.away}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Tactical Breakdown */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* The Tactical Verdict */}
            <section className="bg-zinc-900 border-2 border-zinc-800 p-8 relative">
              <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-xs font-black uppercase px-3 py-1 shadow-[-2px_2px_0_0_#000]">
                Tactical Verdict
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                 <Swords className="w-6 h-6 text-[#39FF14]" /> How It Will Be Won
              </h2>
              <p className="text-zinc-300 text-lg leading-relaxed border-l-4 border-[#39FF14] pl-4">
                {data.tacticalTakeaway}
              </p>
            </section>

            {/* Form Guide */}
            <section>
               <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Recent Form</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Home Form */}
                  <div className="bg-zinc-950 border border-zinc-800 p-6">
                     <h4 className="text-zinc-400 font-bold uppercase text-sm mb-4">{data.homeTeam}</h4>
                     <div className="flex gap-2">
                        {data.homeForm.map((res, i) => (
                           <div key={i} className={`w-10 h-10 flex items-center justify-center font-black font-mono text-lg border-2 ${res === 'W' ? 'border-[#39FF14] text-[#39FF14]' : res === 'L' ? 'border-red-500 text-red-500' : 'border-zinc-500 text-zinc-500'}`}>
                              {res}
                           </div>
                        ))}
                     </div>
                  </div>
                  {/* Away Form */}
                  <div className="bg-zinc-950 border border-zinc-800 p-6">
                     <h4 className="text-zinc-400 font-bold uppercase text-sm mb-4">{data.awayTeam}</h4>
                     <div className="flex gap-2">
                        {data.awayForm.map((res, i) => (
                           <div key={i} className={`w-10 h-10 flex items-center justify-center font-black font-mono text-lg border-2 ${res === 'W' ? 'border-[#39FF14] text-[#39FF14]' : res === 'L' ? 'border-red-500 text-red-500' : 'border-zinc-500 text-zinc-500'}`}>
                              {res}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            {/* Key Battle (Data Driven) */}
            <section className="bg-zinc-900 border-2 border-zinc-800 p-8 border-l-8 border-l-[#39FF14]">
               <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-[#39FF14]" /> Key Battleground
               </h3>
               <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                     <div className="text-xl font-black text-white">{data.keyBattle.homePlayer}</div>
                     <div className="text-sm font-bold text-zinc-500 uppercase">{data.homeTeam}</div>
                  </div>
                  <div className="text-[#39FF14] font-black italic">VS</div>
                  <div className="text-center">
                     <div className="text-xl font-black text-white">{data.keyBattle.awayPlayer}</div>
                     <div className="text-sm font-bold text-zinc-500 uppercase">{data.awayTeam}</div>
                  </div>
               </div>
               <div className="bg-zinc-950 p-4 border border-zinc-800">
                  <div className="text-xs font-black uppercase text-zinc-500 mb-2">{data.keyBattle.metric}</div>
                  <p className="text-zinc-300">{data.keyBattle.context}</p>
               </div>
            </section>

          </div>

          {/* Sidebar / Conversion & Link Graph */}
          <div className="lg:col-span-4 space-y-8">
             
             {/* Prediction Poll (Viral Loop) */}
             <div className="bg-white p-6 text-black border-4 border-zinc-800 shadow-[6px_6px_0_0_#39FF14]">
                <h3 className="text-xl font-black uppercase tracking-tighter leading-none mb-4 flex items-center gap-2">
                   <Activity className="w-5 h-5" /> Who Takes It?
                </h3>
                <p className="text-sm font-bold mb-6 opacity-80">Join the debate before kickoff.</p>
                <div className="space-y-3">
                   <button className="w-full bg-black text-white font-black uppercase py-3 hover:bg-zinc-800 transition-colors">
                      {data.homeTeam} Win
                   </button>
                   <button className="w-full bg-zinc-200 text-black font-black uppercase py-3 hover:bg-zinc-300 transition-colors">
                      Draw
                   </button>
                   <button className="w-full bg-black text-white font-black uppercase py-3 hover:bg-zinc-800 transition-colors">
                      {data.awayTeam} Win
                   </button>
                </div>
             </div>

             {/* Internal Linking Spokes */}
             <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h4 className="text-white font-black uppercase tracking-wide mb-4">
                   Deep Dives
                </h4>
                <ul className="space-y-4">
                   <li>
                      <Link href={`/club/${data.homeTeam.toLowerCase().replace(' ', '-')}`} className="group block">
                         <div className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                            {data.homeTeam} Tactical Hub
                         </div>
                         <div className="text-xs text-zinc-600 mt-1">Full season analysis</div>
                      </Link>
                   </li>
                   <li>
                      <Link href={`/club/${data.awayTeam.toLowerCase().replace(' ', '-')}`} className="group block">
                         <div className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                            {data.awayTeam} Tactical Hub
                         </div>
                         <div className="text-xs text-zinc-600 mt-1">Full season analysis</div>
                      </Link>
                   </li>
                </ul>
             </div>

          </div>
        </div>
      </article>
      
      <Footer />
    </main>
  );
}
