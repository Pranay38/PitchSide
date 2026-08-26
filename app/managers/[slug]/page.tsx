import { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, TrendingDown, TrendingUp, Calendar, Users } from "lucide-react";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { getManagerPressureData } from "@/app/lib/data-fetcher";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getManagerPressureData(params.slug);
  const pageUrl = `https://www.thetouchlinedribble.in/managers/${params.slug}`;
  return {
    title: `${data.name} Pressure Gauge & Job Security at ${data.club} | Touchline Dribble`,
    description: `Live tracking of ${data.name}'s job security at ${data.club}. Current pressure score: ${data.pressureScore}/100. Will they be sacked? Have your say.`,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${data.name} Pressure Gauge — ${data.pressureScore}/100 | Will He Be Sacked?`,
      description: `${data.name}'s job at ${data.club} is under threat. Pressure score: ${data.pressureScore}%. Sacking odds: ${data.sackingOdds}. Fan sentiment: ${data.sentiment}. Cast your vote now.`,
      url: pageUrl,
      type: 'article',
      siteName: 'The Touchline Dribble',
    },
    twitter: {
      card: 'summary_large_image',
      title: `🔴 ${data.name} Pressure Gauge — ${data.pressureScore}/100`,
      description: `Sacking odds: ${data.sackingOdds}. Fan sentiment: ${data.sentiment}. Should he be sacked? Vote now.`,
      site: '@TouchlineDribbl',
      creator: '@TouchlineDribbl',
    },
  };
}

export default async function ManagerPressurePage({ params }: { params: { slug: string } }) {
  const data = await getManagerPressureData(params.slug);
  
  const isCritical = data.pressureScore >= 80;
  const barColor = isCritical ? "#FF3333" : "#FDE047";

  return (
    <main className="min-h-screen bg-zinc-950 font-outfit selection:bg-[#39FF14] selection:text-black">
      <Header />
      
      {/* JSON-LD: Article Schema for Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${data.name} Pressure Gauge & Job Security at ${data.club}`,
            description: `Live tracking of ${data.name}'s job security at ${data.club}. Current pressure score: ${data.pressureScore}/100.`,
            url: `https://www.thetouchlinedribble.in/managers/${params.slug}`,
            publisher: {
              "@type": "Organization",
              name: "The Touchline Dribble",
              url: "https://www.thetouchlinedribble.in",
            },
            mainEntityOfPage: `https://www.thetouchlinedribble.in/managers/${params.slug}`,
          }),
        }}
      />
      {/* JSON-LD: BreadcrumbList for breadcrumb rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.thetouchlinedribble.in" },
              { "@type": "ListItem", position: 2, name: data.club, item: `https://www.thetouchlinedribble.in/club/${data.club.toLowerCase().replace(' ', '-')}` },
              { "@type": "ListItem", position: 3, name: "Manager Pressure" },
            ],
          }),
        }}
      />
      
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumbs for SEO and Navigation */}
        <nav className="flex items-center space-x-2 text-zinc-400 text-xs font-black uppercase tracking-widest mb-12">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/club/${data.club.toLowerCase().replace(' ', '-')}`} className="hover:text-white transition-colors">{data.club}</Link>
          <span>/</span>
          <span className="text-[#39FF14]">Manager Pressure</span>
        </nav>

        {/* Hero Section */}
        <header className="mb-16 border-b-4 border-zinc-800 pb-8 relative">
          {isCritical && (
             <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-xs px-3 py-1.5 border border-red-500 mb-6">
                <AlertTriangle className="w-4 h-4" />
                Critical Job Threat
             </div>
          )}
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6">
            {data.name} <br/> <span className="text-zinc-500">Pressure Gauge</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            Live tracking of {data.name}'s job security at {data.club}. Based on recent results, social sentiment, and historical data patterns.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: The Gauge & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* The Main Gauge Component */}
            <div className="bg-zinc-900 border-2 border-zinc-800 p-8 relative overflow-hidden group">
              <div className="flex justify-between items-end border-b-2 border-dashed border-zinc-700 pb-2 mb-6">
                  <h2 className="text-white text-2xl font-black uppercase tracking-wide">
                      Current Pressure Index
                  </h2>
                  <span className={`text-5xl font-black font-mono leading-none ${isCritical ? 'text-red-500' : 'text-yellow-400'}`}>
                      {data.pressureScore}%
                  </span>
              </div>
              
              {/* Brutalist Progress Bar */}
              <div className="w-full h-8 bg-zinc-950 overflow-hidden border-2 border-zinc-800 mb-6 relative">
                  <div 
                      className="h-full relative"
                      style={{ 
                          width: `${data.pressureScore}%`, 
                          backgroundColor: barColor,
                      }}
                  >
                     <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)' }}></div>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-zinc-950 p-4 border border-zinc-800">
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Fan Sentiment</p>
                    <div className="flex items-center gap-2 text-red-500 font-black font-mono text-xl">
                       <TrendingDown className="w-5 h-5" /> {data.sentiment}
                    </div>
                 </div>
                 <div className="bg-zinc-950 p-4 border border-zinc-800">
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Sacking Odds</p>
                    <div className="text-white font-black font-mono text-xl">
                       {data.sackingOdds}
                    </div>
                 </div>
              </div>
            </div>

            {/* Recent Results Context */}
            <div className="space-y-6">
               <h3 className="text-2xl font-black text-white uppercase tracking-tight">The Form Guide</h3>
               <div className="grid grid-cols-3 gap-4">
                  {data.recentResults.map((match, i) => (
                    <div key={i} className={`p-4 border-2 ${match.result === 'W' ? 'border-[#39FF14]/30 bg-[#39FF14]/5' : match.result === 'L' ? 'border-red-500/30 bg-red-500/5' : 'border-zinc-700 bg-zinc-900'}`}>
                       <div className={`text-2xl font-black mb-1 ${match.result === 'W' ? 'text-[#39FF14]' : match.result === 'L' ? 'text-red-500' : 'text-zinc-400'}`}>
                          {match.result}
                       </div>
                       <div className="text-white font-black font-mono mb-2">{match.score}</div>
                       <div className="text-zinc-500 text-xs font-bold uppercase truncate">{match.opponent}</div>
                    </div>
                  ))}
               </div>
               <div className="bg-zinc-900 p-4 border-l-4 border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Calendar className="w-5 h-5 text-zinc-500" />
                     <span className="text-zinc-300 font-bold uppercase text-sm">Next Fixture</span>
                  </div>
                  <span className="text-white font-black">{data.nextMatch}</span>
               </div>
            </div>
          </div>

          {/* Right Column: Interactive & Hub Spoke Links */}
          <div className="space-y-8">
             {/* The Viral Interaction Poll */}
             <div className="bg-[#39FF14] p-6 text-black border-4 border-black shadow-[4px_4px_0_0_#fff]">
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-4">
                   Should {data.name} Be Sacked?
                </h3>
                <p className="text-sm font-bold mb-6 opacity-80">Have your say. 14,204 fans have voted this week.</p>
                <div className="space-y-3">
                   <button className="w-full bg-black text-white font-black uppercase py-3 hover:bg-zinc-800 transition-colors">
                      Sack Him Now
                   </button>
                   <button className="w-full bg-transparent border-2 border-black text-black font-black uppercase py-3 hover:bg-black hover:text-[#39FF14] transition-colors">
                      Give Him Time
                   </button>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-black/20 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer hover:underline">
                   Share Your Vote <Users className="w-4 h-4" />
                </div>
             </div>

             {/* pSEO Internal Linking (The "Spokes") */}
             <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h4 className="text-white font-black uppercase tracking-wide mb-4 flex items-center gap-2">
                   More on {data.club}
                </h4>
                <ul className="space-y-3">
                   <li>
                      <Link href={`/club/${data.club.toLowerCase().replace(' ', '-')}/tactics`} className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                         → Tactical Breakdown
                      </Link>
                   </li>
                   <li>
                      <Link href={`/club/${data.club.toLowerCase().replace(' ', '-')}/transfers`} className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                         → Transfer Targets
                      </Link>
                   </li>
                   <li>
                      <Link href={`/club/${data.club.toLowerCase().replace(' ', '-')}`} className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                         → Club Hub
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
