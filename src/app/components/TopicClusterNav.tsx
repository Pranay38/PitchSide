import Link from "next/link";
import { topicPath } from "../lib/contentPaths";
import { ArrowRight, BookOpen } from "lucide-react";

export function TopicClusterNav({ topicLabel }: { topicLabel?: string }) {
  if (!topicLabel) return null;
  
  return (
    <div className="mt-12 rounded-2xl border border-gray-200 bg-[#F8FAFC] p-6 dark:border-gray-800 dark:bg-[#0B1120]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#16A34A]/10 text-[#16A34A]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#64748B] dark:text-gray-400">
              Explore the Series
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#0F172A] dark:text-white">
              {topicLabel}
            </h3>
          </div>
        </div>
        <Link
          href={topicPath(topicLabel)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0F172A] shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-[#1E293B] dark:text-white dark:hover:bg-[#334155] sm:w-auto"
        >
          View all articles
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
