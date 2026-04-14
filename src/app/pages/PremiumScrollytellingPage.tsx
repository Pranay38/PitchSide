import { ScrollytellingPitch, ScrollytellingStep } from "../components/ScrollytellingPitch";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export default function PremiumScrollytellingPage() {
  const steps: ScrollytellingStep[] = [
    {
      id: "step-1",
      content: (
        <div className="space-y-4">
          <h2 className="text-3xl font-black font-outfit text-white">The Death of the Pure 10</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            For decades, the number 10 was the undisputed star. Riquelme, Zidane, Özil. The player with the luxury to walk, to observe, to orchestrate out of possession. But the modern pressing game has killed that luxury.
          </p>
        </div>
      ),
      visual: (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900 absolute inset-0">
          <div className="text-center p-8">
            <span className="text-9xl font-black text-white/5 opacity-80 select-none tracking-tighter block mb-4">#10</span>
            <p className="text-[#16A34A] tracking-[0.3em] text-sm uppercase font-bold">Extinct Profile</p>
          </div>
        </div>
      ),
    },
    {
      id: "step-2",
      content: (
        <div className="space-y-4">
          <h2 className="text-3xl font-black font-outfit text-white">The Rise of the Hybrid Destroyer</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Today’s central creator isn't a waif-like passer. They are athletes. Look at Jude Bellingham or Jamal Musiala — they destroy transitions with their physical power, and immediately create chances with their technical quality.
          </p>
        </div>
      ),
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a1128] absolute inset-0">
          <div className="w-48 h-64 border-2 border-[#16A34A]/30 rounded-xl relative overflow-hidden flex items-end justify-center pb-4">
             {/* Mock player heatmap/diagram */}
             <div className="absolute inset-0 bg-gradient-to-t from-[#16A34A]/40 to-transparent"></div>
             <div className="w-24 h-24 bg-red-500/30 rounded-full blur-xl absolute top-10 right-4 animate-pulse"></div>
             <span className="relative z-10 text-white font-bold text-xl drop-shadow-md">Box-to-Box</span>
          </div>
        </div>
      ),
    },
    {
      id: "step-3",
      content: (
        <div className="space-y-4">
          <h2 className="text-3xl font-black font-outfit text-white">Metrics that Matter</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Take a look at the pressures per 90. The traditional playmakers average 12-15 pressures. The modern hybrid? They are clocking 25+. If you want to create in 2026, you first must destroy.
          </p>
        </div>
      ),
      visual: (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#09090b] absolute inset-0">
           <div className="w-full max-w-sm space-y-4">
             <div>
               <div className="flex justify-between text-xs text-gray-400 mb-1">
                 <span>Traditional 10</span>
                 <span>14 / 90</span>
               </div>
               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="w-[30%] h-full bg-white/30"></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-xs text-[#16A34A] font-bold mb-1">
                 <span>Modern Hybrid</span>
                 <span>28 / 90</span>
               </div>
               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="w-[85%] h-full bg-[#16A34A]"></div>
               </div>
             </div>
           </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#060E20] selection:bg-[#16A34A] selection:text-white pb-24">
      <Header />
      
      {/* Intro hero for Premium article */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
        <span className="text-[#16A34A] uppercase tracking-widest text-xs font-bold mb-6 inline-block bg-[#16A34A]/10 px-4 py-1.5 rounded-full border border-[#16A34A]/20">
          Premium Deep Dive
        </span>
        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit mb-6 tracking-tight">
          The Death of the Pure 10
        </h1>
        <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto mb-8">
          Why football's most romantic position was swallowed by the pressing machine, and what replaced it.
        </p>
      </div>

      <ScrollytellingPitch steps={steps} />

      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">Want more tactical deep dives?</h3>
        <p className="text-gray-400 mb-8">Subscribe to get our weekly cinematic breakdowns delivered straight to you.</p>
        <button className="bg-[#16A34A] text-[#060E20] font-black uppercase tracking-wider px-8 py-4 rounded-xl hover:bg-[#16A34A]/90 transition shadow-[0_0_20px_rgba(22,163,74,0.3)]">
          Become a Member
        </button>
      </div>
      
      <Footer />
    </div>
  );
}
