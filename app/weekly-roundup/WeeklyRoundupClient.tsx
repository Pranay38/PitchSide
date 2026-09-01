"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { getSiteSettingsAsync } from "@/app/lib/siteSettingsStorage";
import type { WeeklyRoundup } from "@/app/lib/weeklyRoundup";

export function WeeklyRoundupClient() {
  const [roundup, setRoundup] = useState<WeeklyRoundup | null>(null);
  useEffect(() => { getSiteSettingsAsync().then((settings) => setRoundup(settings.weeklyRoundup)); }, []);
  if (!roundup) return <div className="min-h-screen bg-[#f8fafc]" />;
  return <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1120]"><Header /><main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6"><div className="border-l-4 border-[#16A34A] pl-5"><div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-[#16A34A]"><CalendarDays className="h-4 w-4" />{roundup.weekLabel.toUpperCase()}</div><h1 className="mt-3 text-4xl font-black leading-none text-[#0f172a] dark:text-white sm:text-6xl">{roundup.headline}</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#64748b] dark:text-gray-400">{roundup.intro}</p></div>{roundup.enabled ? <div className="mt-12 grid gap-px overflow-hidden border border-[#0f172a]/15 bg-[#0f172a]/15 md:grid-cols-2">{roundup.items.map((item, index) => <article key={item.label} className="min-h-[260px] bg-white p-7 dark:bg-[#111827]"><span className="text-xs font-black tracking-[0.15em] text-[#16A34A]">0{index + 1} / {item.label}</span><h2 className="mt-7 text-2xl font-black leading-tight text-[#0f172a] dark:text-white">{item.title}</h2><p className="mt-4 text-sm leading-7 text-[#64748b] dark:text-gray-400">{item.body}</p><ChevronRight className="mt-8 h-5 w-5 text-[#16A34A]" /></article>)}</div> : <div className="mt-16 border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-gray-700">This week&apos;s roundup is being prepared.</div>}<div className="mt-10"><Link href="/quick-takes" className="text-sm font-bold text-[#16A34A]">More quick takes</Link></div></main><Footer /></div>;
}
