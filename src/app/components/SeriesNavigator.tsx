"use client";

import { Link } from "@/lib/router-compat";
import type { BlogPost } from "../data/posts";
import { BookOpen } from "lucide-react";

interface SeriesNavigatorProps {
  currentPost: BlogPost;
  seriesPosts: BlogPost[];
}

export function SeriesNavigator({ currentPost, seriesPosts }: SeriesNavigatorProps) {
  if (!currentPost.seriesName || seriesPosts.length <= 1) return null;

  return (
    <div className="my-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#16A34A]">
        <BookOpen className="h-5 w-5" />
        Series: {currentPost.seriesName}
      </div>
      <div className="flex flex-col gap-3">
        {seriesPosts.map((post, index) => {
          const isCurrent = post.id === currentPost.id;
          const order = post.seriesOrder || index + 1;
          
          return (
            <Link
              key={post.id}
              to={`/post/${post.slug || post.id}`}
              className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                isCurrent 
                  ? "bg-[#16A34A]/10 border border-[#16A34A]/30" 
                  : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 border border-transparent"
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isCurrent 
                  ? "bg-[#16A34A] text-white" 
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}>
                {order}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`truncate text-sm font-bold ${
                  isCurrent ? "text-[#16A34A]" : "text-gray-900 dark:text-gray-100"
                }`}>
                  {post.title}
                </h4>
              </div>
              {isCurrent && (
                <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-[#16A34A]">
                  Current
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
