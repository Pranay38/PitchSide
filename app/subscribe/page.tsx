import { getPublishedPostsServer } from "@/lib/server-data";
import { newsletterReading, NEWSLETTER_PROMISE } from "@/app/lib/newsletterReading";
import type { BlogPost } from "@/app/data/posts";

import { Metadata } from "next";
import { OneLineNewsletter } from "@/app/components/OneLineNewsletter";
import { Mail, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "The Weekly Whistle",
  alternates: { canonical: "https://www.thetouchlinedribble.in/subscribe" },
  description: NEWSLETTER_PROMISE,
};

export const revalidate = 3600;

export default async function SubscribePage() {
  const reading = newsletterReading(await getPublishedPostsServer() as BlogPost[]);
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
              The Weekly Whistle
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {NEWSLETTER_PROMISE}
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            From The Touchline Dribble. Start with a short welcome series, then one edition each week. Unsubscribe whenever you like.
          </p>
          <details className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-left">
            <summary className="cursor-pointer font-bold">Preview a sample edition</summary>
            <p className="mt-3 text-sm text-slate-500">A sample built from our published reading picks, not a previously sent email.</p>
            {[{ label: "One strong opinion", post: reading.opinion }, { label: "One useful lesson", post: reading.explainer }].map(({ label, post }) => (
              <div className="mt-5" key={label}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-green-600">{label}</h2>
                {post ? <><Link href={post.href} className="mt-2 block font-bold underline">{post.title}</Link><p className="mt-2 text-sm leading-6">{post.excerpt}</p></>
                  : <p className="mt-2 text-sm">{label === "One strong opinion" ? "A clear argument, the evidence behind it, and a fair counterargument." : "A football concept explained with a concrete example."}</p>}
              </div>
            ))}
            <p className="mt-5 text-sm">What changed your mind about football this week? That’s the kind of question we’ll leave you with.</p>
          </details>

          {/* Email Capture */}
          <div className="bg-white dark:bg-slate-900/50 p-1 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800">
            <OneLineNewsletter placement="subscribe_page" nextArticle={reading.opinion || reading.explainer} className="!mt-0 !bg-transparent !border-none !p-4 !shadow-none" />
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Evidence behind the opinion</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Understand the argument and the strongest counterargument.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30">
              <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">No Spam</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">One weekly edition after your welcome series. Unsubscribe anytime.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
