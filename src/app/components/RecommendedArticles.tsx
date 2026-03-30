"use client";

import { useState, useEffect } from "react";
import { Link } from "@/lib/router-compat";
import { topicPath } from "../lib/contentPaths";
import type { BlogPost } from "../data/posts";

// Skeleton loader
function ArticleSkeleton() {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
      <div className="w-[72px] h-[56px] rounded-lg bg-gray-200 dark:bg-gray-800 shrink-0 animate-pulse" />
      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        <div className="h-3.5 rounded bg-gray-200 dark:bg-gray-800 w-[85%] animate-pulse" />
        <div className="h-3.5 rounded bg-gray-200 dark:bg-gray-800 w-[60%] animate-pulse" />
        <div className="h-2.5 rounded bg-gray-200 dark:bg-gray-800 w-[40%] animate-pulse" />
      </div>
    </div>
  );
}

// Single recommendation card
function RecommendationCard({ article, index }: { article: Partial<BlogPost>; index: number }) {
  const fmtDate = (iso: string | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <Link
      to={`/post/${article.slug || article.id}`}
      className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-800 transition-opacity hover:opacity-75 group"
    >
      {/* Thumbnail */}
      <div className="w-[72px] h-[56px] rounded-lg shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        {article.coverImage
          ? <img
              src={article.coverImage} alt={article.title || ""}
              className="w-full h-full object-cover"
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
          : <div className="w-full h-full flex items-center justify-center text-[22px]">
              ⚽
            </div>
        }
        {/* Index number overlay */}
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center text-[9px] font-bold text-white">
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Competition / Club badge */}
        {article.club && (
          <span className="self-start text-[9px] font-bold px-1.5 py-[1px] rounded-full mb-1 bg-[#16A34A]/10 text-[#16A34A] uppercase tracking-[0.1em]">
            {article.club}
          </span>
        )}

        {/* Title */}
        <div className="text-[13px] font-semibold leading-snug text-[#0F172A] dark:text-white line-clamp-2 mb-1 group-hover:text-[#16A34A] transition-colors">
          {article.title}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-[11px] text-[#64748B] dark:text-gray-400">
          {article.readTime && (
            <span>{article.readTime} min read</span>
          )}
          {article.readTime && article.date && (
            <span className="opacity-40">·</span>
          )}
          {article.date && (
            <span>{fmtDate(article.date)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export function RecommendedArticles({
  articleId,
  limit = 5,
  title = "Readers also enjoyed",
  showSource = false,
}: {
  articleId?: string;
  limit?: number;
  title?: string;
  showSource?: boolean;
}) {
  const [recs, setRecs] = useState<Partial<BlogPost>[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/sys?route=recommendations&articleId=${articleId}&limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setRecs(data.recommendations || []);
        setSource(data.source);
      })
      .catch(() => { if (!cancelled) setRecs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [articleId, limit]);

  // Don't render if no data and not loading
  if (!loading && recs.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-bold text-[#0F172A] dark:text-white uppercase tracking-[0.15em] m-0">
          {title}
        </h3>

        {showSource && source && (
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-[0.1em] ${
            source === "collaborative" 
              ? "bg-[#16A34A]/10 text-[#16A34A]" 
              : "bg-gray-100 dark:bg-gray-800 text-[#64748B] dark:text-gray-400"
          }`}>
            {source === "collaborative" ? "ML" : "Tag-based"}
          </span>
        )}
      </div>

      {/* List */}
      <div>
        {loading
          ? Array.from({ length: limit }).map((_, i) => <ArticleSkeleton key={i} />)
          : recs.map((article, i) => (
              <RecommendationCard key={article.id} article={article} index={i} />
            ))
        }
      </div>
    </div>
  );
}
