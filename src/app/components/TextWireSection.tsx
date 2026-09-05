/**
 * TextWireSection — A text-only, no-image headline wire inspired by
 * BackPageFootball's Irish Football section. Strips images for fast
 * scanning and creates visual variety (image-heavy → text-dense → image-heavy).
 */

import { Link } from "@/lib/router-compat";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogPost } from "../data/posts";

interface TextWireSectionProps {
  posts: BlogPost[];
  /** Max number of items to show */
  limit?: number;
}

function formatDateShort(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function TextWireSection({ posts, limit = 5 }: TextWireSectionProps) {
  const items = posts.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {items.map((post, idx) => (
        <Link
          key={post.id}
          to={`/post/${post.slug || post.id}`}
          className={`group flex items-start gap-5 px-6 py-5 transition-colors hover:bg-secondary ${
            idx < items.length - 1 ? "border-b border-border" : ""
          }`}
        >
          {/* Date column — fixed width for alignment */}
          <span className="hidden sm:block shrink-0 w-[5.5rem] text-[11px] font-bold uppercase tracking-widest text-muted-foreground tabular-nums pt-1">
            {formatDateShort(post.date)}
          </span>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Kicker row */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {post.category || post.club || (post.tags && post.tags[0]) || "Analysis"}
              </span>
              <span className="text-muted-foreground text-[10px]">·</span>
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readTime}
              </span>
              {post.author && (
                <>
                  <span className="text-muted-foreground text-[10px]">·</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    By {post.author}
                  </span>
                </>
              )}
            </div>

            {/* Headline */}
            <h3 className="text-lg font-headline font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
              {post.title}
            </h3>

            {/* Excerpt */}
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-1">
              {post.excerpt}
            </p>

            {/* Mobile date */}
            <span className="sm:hidden mt-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {formatDateShort(post.date)}
            </span>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-2 hidden md:block" />
        </Link>
      ))}
    </div>
  );
}
