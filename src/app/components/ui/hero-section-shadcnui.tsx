import { Button } from "./button";
import { GlowButton } from "./GlowButton";
import { motion, type Variants } from "framer-motion";
import { Sparkles } from "lucide-react";

export function HeroSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-[#0F172A] mb-12 border border-gray-800 shadow-2xl">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2940&auto=format&fit=crop"
          alt="Football stadium atmosphere"
          className="w-full h-full object-cover opacity-20 dark:opacity-30 mix-blend-luminosity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/50 to-transparent" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex min-h-[550px] flex-col items-center justify-center px-4 py-20 text-center"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-sm font-bold text-[#4ade80] shadow-xl">
            <Sparkles className="h-4 w-4" />
            The Touchline Dribble Pro
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mb-6 text-5xl font-black font-outfit tracking-tight text-white md:text-7xl max-w-4xl leading-[1.1]"
        >
          See the Beautiful Game
          <br />
          <span className="bg-gradient-to-r from-[#16A34A] via-[#4ade80] to-[#16A34A] bg-clip-text text-transparent">
            Like Never Before.
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mb-10 max-w-2xl text-lg text-slate-300 leading-relaxed"
        >
          From the touchline to your timeline. Dive into deep tactical analysis, bold opinions, and exclusive transfer dossiers built for true football obsessives.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
          {/* We'll use our shiny new GlowButton here as it pairs perfectly with dark hero sections! */}
          <GlowButton href="#latest-articles" glowColor="rgba(22, 163, 74, 0.4)">
            Start Reading
          </GlowButton>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-full border-white/20 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm transition-colors text-base font-bold">
            <a href="#daily-briefing">Explore</a>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
