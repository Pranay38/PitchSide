import { useMemo } from "react";
import { Link } from "@/lib/router-compat";
import { Zap, Clock, ArrowRight, Share2, Camera } from "lucide-react";
import type { BlogPost } from "../data/posts";
import { toast } from "sonner";
import { useState } from "react";
import { ImageShareModal } from "./ImageShareModal";

function getTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function QuickTakesSection({ posts }: { posts: BlogPost[] }) {
  const [sharePost, setSharePost] = useState<BlogPost | null>(null);

  const quickTakes = useMemo(() => {
    return posts
      .filter((p) => p.format === "quick-take" && !p.isDraft)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [posts]);

  if (quickTakes.length === 0) return null;

  return (
    <div className="mb-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Quick Takes
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black font-outfit text-[#0F172A] dark:text-white">
            Micro Analysis
          </h2>
        </div>
        <Link
          to="/quick-takes"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#16A34A]"
        >
          View all takes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative group/scroll">
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {quickTakes.map((post) => (
            <div
              key={post.id}
              className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start rounded-[1.5rem] bg-white dark:bg-[#0f1930]/60 backdrop-blur-md ghost-border-dark dark:ghost-border p-5 ambient-shadow depth-card relative flex flex-col justify-between min-h-[180px]"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {post.club || "General"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTimeAgo(post.date)}
                  </span>
                </div>
                <Link to={`/post/${post.slug || post.id}`} className="group">
                  <h3 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors leading-tight line-clamp-3">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-sm mt-3 text-[#64748B] dark:text-gray-400 line-clamp-3">
                  {post.content?.replace(/<[^>]*>/g, "").replace(/[#*_`>]/g, "")}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                <Link
                  to={`/post/${post.slug || post.id}`}
                  className="text-xs font-bold text-[#16A34A]"
                >
                  Read &rarr;
                </Link>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/post/${post.slug || post.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link copied!");
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#16A34A] hover:bg-[#16A34A]/10 transition-colors"
                    title="Share Quick Take"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSharePost(post)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[#16A34A] hover:bg-[#16A34A]/10 transition-colors"
                    title="Share as Image"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <ImageShareModal 
        isOpen={!!sharePost} 
        onClose={() => setSharePost(null)}
        post={sharePost}
      />
    </div>
  );
}
