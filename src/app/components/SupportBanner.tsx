/**
 * SupportBanner — Monetization placeholder / "Support the blog" CTA.
 * Links to Buy Me a Coffee or Ko-fi. Shows in the footer area of article pages
 * and as a subtle banner on the homepage.
 */
import { Heart, Coffee, ExternalLink } from "lucide-react";

interface SupportBannerProps {
  /** "inline" for within articles, "floating" for homepage sidebar */
  variant?: "inline" | "floating";
  className?: string;
}

// ⚠️ Replace this with your actual Buy Me a Coffee / Ko-fi / Razorpay link
const SUPPORT_URL = "https://buymeacoffee.com/thetouchlinedribble";

export function SupportBanner({ variant = "inline", className = "" }: SupportBannerProps) {
  if (variant === "floating") {
    return (
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition-all hover:bg-amber-100 hover:shadow-md dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30 ${className}`}
      >
        <Coffee className="h-4 w-4" />
        <span>Support the blog</span>
        <Heart className="h-3.5 w-3.5 text-red-500 group-hover:animate-pulse" />
      </a>
    );
  }

  return (
    <div className={`rounded-[1.5rem] border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center shadow-sm dark:border-gray-800 dark:from-amber-900/10 dark:to-orange-900/10 ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
        <Coffee className="h-6 w-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="mt-4 text-lg font-black font-outfit text-[#0F172A] dark:text-white">
        Enjoying The Touchline Dribble?
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">
        This blog is a passion project. If you love the tactical breakdowns and transfer analysis, consider buying me a coffee to keep the lights on.
      </p>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600"
      >
        <Coffee className="h-4 w-4" />
        Buy me a coffee
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
