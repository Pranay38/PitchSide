import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import Link from 'next/link';
import { Swords, Activity, Zap, BarChart3, Clock } from 'lucide-react';
import { Header } from '@/app/components/Header';
import { Footer } from '@/app/components/Footer';

// Helper to load data
function getComparisons() {
  const filePath = path.join(process.cwd(), 'data', 'comparisons.json');
  if (!fs.existsSync(filePath)) return [];
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

function getComparison(slug: string) {
  const comparisons = getComparisons();
  return comparisons.find((c: any) => c.slug === slug);
}

export async function generateStaticParams() {
  const comparisons = getComparisons();
  return comparisons.map((c: any) => ({
    slug: c.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = getComparison(slug);
  if (!data) return { title: 'Not Found' };
  
  const pageUrl = `https://www.thetouchlinedribble.in/vs/${slug}`;
  return {
    title: `${data.entityA.name} vs ${data.entityB.name}: Tactical Comparison 2026 | The Touchline Dribble`,
    description: data.tacticalAnalysis,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `⚔️ ${data.entityA.name} vs ${data.entityB.name} — Tactical Comparison`,
      description: data.tacticalAnalysis,
      url: pageUrl,
      type: 'article',
      siteName: 'The Touchline Dribble',
    },
    twitter: {
      card: 'summary_large_image',
      title: `⚔️ ${data.entityA.name} vs ${data.entityB.name}`,
      description: data.tacticalAnalysis,
      site: '@TouchlineDribbl',
      creator: '@TouchlineDribbl',
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getComparison(slug);

  if (!data) {
    return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Comparison Not Found</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 font-outfit selection:bg-[#39FF14] selection:text-black">
      <Header />
      
      {/* JSON-LD: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.thetouchlinedribble.in" },
              { "@type": "ListItem", position: 2, name: "Comparisons", item: "https://www.thetouchlinedribble.in/vs" },
              { "@type": "ListItem", position: 3, name: `${data.entityA.name} vs ${data.entityB.name}` },
            ],
          }),
        }}
      />
      {/* JSON-LD: ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${data.entityA.name} vs ${data.entityB.name} Comparison`,
            itemListElement: [
              { "@type": "ListItem", position: 1, name: data.entityA.name },
              { "@type": "ListItem", position: 2, name: data.entityB.name }
            ]
          }),
        }}
      />
      
      <article className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-zinc-400 text-xs font-black uppercase tracking-widest mb-12">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/vs" className="hover:text-white transition-colors">Comparisons</Link>
          <span>/</span>
          <span className="text-[#39FF14]">{data.entityA.name} vs {data.entityB.name}</span>
        </nav>

        {/* Hero Scoreboard Style */}
        <header className="mb-16 border-b-4 border-zinc-800 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 text-[#39FF14] font-bold uppercase tracking-widest text-xs px-4 py-2 border border-zinc-700 mb-8">
            <Zap className="w-4 h-4" />
            {data.type} Comparison
          </div>
          
          <h1 className="sr-only">{data.entityA.name} vs {data.entityB.name}</h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="text-right flex-1">
              <span className="block text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                {data.entityA.name}
              </span>
              <p className="text-zinc-500 font-black font-mono mt-2 text-xl tracking-widest uppercase">
                {data.entityA.team}
              </p>
            </div>
            
            <div className="bg-[#39FF14] text-black px-6 py-4 font-black text-3xl italic shadow-[4px_4px_0_0_#fff] transform -skew-x-12">
              VS
            </div>
            
            <div className="text-left flex-1">
              <span className="block text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                {data.entityB.name}
              </span>
              <p className="text-zinc-500 font-black font-mono mt-2 text-xl tracking-widest uppercase">
                {data.entityB.team}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-12">
            
            {/* The Tactical Verdict */}
            <section className="bg-zinc-900 border-2 border-zinc-800 p-8 relative">
              <div className="absolute top-0 right-0 bg-[#39FF14] text-black text-xs font-black uppercase px-3 py-1 shadow-[-2px_2px_0_0_#000]">
                The Verdict
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                 <Swords className="w-6 h-6 text-[#39FF14]" /> {data.verdict}
              </h2>
            </section>

            {/* Tactical Analysis */}
            <section>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Tactical Analysis</h3>
              <p className="text-zinc-300 text-lg leading-relaxed border-l-4 border-zinc-700 pl-4">
                {data.tacticalAnalysis}
              </p>
            </section>

            {/* Stats Comparison */}
            {(data.type === 'player' || data.type === 'team') && (
              <section className="bg-zinc-900 border-2 border-zinc-800 p-8 border-l-8 border-l-[#39FF14]">
                 <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-[#39FF14]" /> Head to Head Stats
                 </h3>
                 <div className="space-y-6">
                    {Object.keys(data.stats.entityA).map((statKey) => (
                      <div key={statKey} className="flex items-center justify-between">
                        <div className="w-1/3 text-right font-bold text-white text-lg">
                          {data.stats.entityA[statKey]}
                        </div>
                        <div className="w-1/3 text-center text-zinc-500 text-xs uppercase font-black tracking-widest">
                          {statKey.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="w-1/3 text-left font-bold text-white text-lg">
                          {data.stats.entityB[statKey]}
                        </div>
                      </div>
                    ))}
                 </div>
              </section>
            )}

          </div>

          <div className="lg:col-span-4 space-y-8">
             
             {/* Key Aspects */}
             <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h4 className="text-white font-black uppercase tracking-wide mb-4">
                   Key Aspects
                </h4>
                <ul className="space-y-2">
                  {data.keyAspects.map((aspect: string, i: number) => (
                    <li key={i} className="text-zinc-400 font-bold uppercase text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#39FF14] block"></span> {aspect}
                    </li>
                  ))}
                </ul>
             </div>

             {/* Internal Linking Spokes */}
             <div className="bg-zinc-900 border border-zinc-800 p-6">
                <h4 className="text-white font-black uppercase tracking-wide mb-4">
                   Deep Dives
                </h4>
                <ul className="space-y-4">
                   {data.type !== 'formation' && (
                     <>
                       <li>
                          <Link href={`/club/${data.entityA.team.toLowerCase().replace(/\s+/g, '-')}`} className="group block">
                             <div className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                                {data.entityA.team} Hub
                             </div>
                          </Link>
                       </li>
                       <li>
                          <Link href={`/club/${data.entityB.team.toLowerCase().replace(/\s+/g, '-')}`} className="group block">
                             <div className="text-zinc-400 hover:text-[#39FF14] text-sm font-bold uppercase transition-colors">
                                {data.entityB.team} Hub
                             </div>
                          </Link>
                       </li>
                     </>
                   )}
                </ul>
             </div>

          </div>
        </div>
      </article>
      
      <Footer />
    </main>
  );
}
