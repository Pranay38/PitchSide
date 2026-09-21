import { Metadata } from "next";
import { OneLineNewsletter } from "@/app/components/OneLineNewsletter";
import { Mail, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Subscribe to PitchSide | The Touchline Dribble",
  description: "Get the post-match tactical breakdown in your inbox. No fluff, just data-backed analysis.",
};

export default function SubscribePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white selection:bg-[#16A34A]/30 flex flex-col">
      {/* Minimal Header */}
      <header className="w-full py-6 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800/50 flex justify-center md:justify-start">
        <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
          <Image
            src="/logo.png"
            alt="The Touchline Dribble"
            width={48}
            height={48}
            className="h-12 w-12 object-contain filter dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] drop-shadow-md"
            priority
          />
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl mx-auto space-y-8 text-center">
          
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-slate-900 dark:text-white">
              Get the post-match breakdown in your inbox.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Mainstream pundits won't give you the unadulterated tactical truth. We will.
            </p>
          </div>

          {/* Email Capture */}
          <div className="bg-white dark:bg-slate-900/50 p-1 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
            <OneLineNewsletter className="!mt-0 !bg-transparent !border-none !p-4 !shadow-none" />
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Early Access</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Read the analysis before the timeline catches on.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">No Spam</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">One brutal, data-backed breakdown every week.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
