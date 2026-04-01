/**
 * SupportBanner — Monetization placeholder / "Support the blog" CTA.
 * Links to Razorpay Payment Page. Shows in the footer area of article pages
 * and as a subtle banner on the homepage.
 */
import { Heart, CreditCard, ExternalLink } from "lucide-react";

interface SupportBannerProps {
  /** "inline" for within articles, "floating" for homepage sidebar */
  variant?: "inline" | "floating";
  className?: string;
}

const SUPPORT_URL = "https://razorpay.me/@thetouchlinedribble";

export function SupportBanner({ variant = "inline", className = "" }: SupportBannerProps) {
  if (variant === "floating") {
    return (
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800 transition-all hover:bg-blue-100 hover:shadow-md dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/30 ${className}`}
      >
        <CreditCard className="h-4 w-4" />
        <span>Support the blog</span>
        <Heart className="h-3.5 w-3.5 text-red-500 group-hover:animate-pulse" />
      </a>
    );
  }

  return (
    <div className={`rounded-[1.5rem] border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center shadow-sm dark:border-gray-800 dark:from-blue-900/10 dark:to-indigo-900/10 ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
        <Heart className="h-6 w-6 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-black font-outfit text-[#0F172A] dark:text-white">
        Enjoying The Touchline Dribble?
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#64748B] dark:text-gray-400">
        This blog is a passion project. If you love the tactical breakdowns and transfer analysis, consider supporting the blog to keep the lights on and help us grow.
      </p>
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
      >
        <CreditCard className="h-4 w-4" />
        Support via Razorpay
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
