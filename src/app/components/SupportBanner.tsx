/**
 * SupportBanner — Premium "Support the blog" CTA with Razorpay integration.
 * Inspired by Stitch "Tactical Elegance" design system:
 * - Tonal layering over hard borders
 * - Atmospheric green glows for "stadium floodlight" effect
 * - Glassmorphism with noise texture grain
 * - Ghost borders at 15% opacity
 */
"use client";

import { Heart, Coffee, Zap, ArrowUpRight, Lock } from "lucide-react";

interface SupportBannerProps {
  /** "inline" for within articles/footer, "compact" for sidebar */
  variant?: "inline" | "compact";
  className?: string;
}

const SUPPORT_URL = "https://razorpay.me/@thetouchlinedribble";

export function SupportBanner({ variant = "inline", className = "" }: SupportBannerProps) {
  if (variant === "compact") {
    return (
      <div className={`rounded-[1.75rem] overflow-hidden group ${className}`}>
        <div className="relative bg-gradient-to-br from-[#0b1326] via-[#131b2e] to-[#171f33] p-5 text-white">
          {/* Atmospheric glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/12 rounded-full blur-[60px] pointer-events-none" />
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#1ca64d] flex items-center justify-center shadow-lg shadow-[#16A34A]/20">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#62df7d]">
                Support
              </p>
            </div>
            
            <h3 className="text-base font-black font-outfit text-[#dae2fd] mb-2">
              Keep the writing independent
            </h3>
            <p className="text-xs text-[#bdcaba] leading-relaxed mb-4">
              Every contribution fuels deeper analysis and better coverage.
            </p>
            
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-gradient-to-r from-[#16A34A] to-[#1ca64d] text-white text-xs font-black uppercase tracking-widest shadow-[0_0_24px_-4px_rgba(22,163,74,0.4)] hover:shadow-[0_0_36px_-4px_rgba(22,163,74,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
            >
              <Coffee className="w-3.5 h-3.5" />
              Support via Razorpay
              <ArrowUpRight className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant — premium full-width banner with "Tactical Elegance" design
  return (
    <div className={`relative overflow-hidden rounded-[2rem] ${className}`}>
      {/* Base surface layer */}
      <div className="absolute inset-0 bg-foreground" />
      
      {/* Atmospheric stadium glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#16A34A]/8 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#1ca64d]/8 rounded-full blur-[80px] pointer-events-none -translate-x-1/3 translate-y-1/3" />
      
      {/* Grid pattern texture */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(189,202,186,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(189,202,186,0.15) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Noise grain overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />

      {/* Ghost border - subtle outline at 15% opacity */}
      <div className="absolute inset-0 rounded-[2rem] border border-[#3e4a3d]/15 pointer-events-none" />

      <div className="relative z-10 p-8 sm:p-10 md:p-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#1ca64d] flex items-center justify-center shadow-[0_0_24px_-4px_rgba(22,163,74,0.4)]">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#62df7d]">
                Support Independent Football Writing
              </p>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold font-headline text-background mb-3 leading-tight tracking-tight">
              Enjoying <span className="text-primary">The Touchline Dribble</span>?
            </h3>
            <p className="text-sm sm:text-base text-muted leading-relaxed">
              This blog is a passion project. If you love the tactical breakdowns and transfer coverage, consider supporting us to keep the lights on and help us grow.
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-[#16A34A] to-[#1ca64d] text-white text-sm font-black uppercase tracking-widest shadow-[0_0_40px_-10px_rgba(22,163,74,0.5)] hover:shadow-[0_0_60px_-10px_rgba(22,163,74,0.7)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Coffee className="w-4 h-4" />
              Support via Razorpay
              <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
            </a>
            <div className="flex items-center justify-center gap-2 text-muted/70 text-xs">
              <Lock className="w-3 h-3" />
              <span>Secure payment via Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
