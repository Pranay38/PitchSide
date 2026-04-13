"use client";

import { useQuery } from "@tanstack/react-query";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { SEO } from "@/app/components/SEO";
import Link from "next/link";
import { Zap, Clock, ArrowRight, MessageCircle, Heart, Share2, Camera } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "@/app/data/posts";
import { useState } from "react";
import { ImageShareModal } from "@/app/components/ImageShareModal";

function QuickTakeCard({ post, onShareImage }: { post: BlogPost, onShareImage: (post: BlogPost) => void }) {
  const timeAgo = getTimeAgo(post.date);

  return (
    <article className="group relative">
      <div className="rounded-[1.5rem] bg-white dark:bg-[#0f1930]/60 backdrop-blur-md ghost-border-dark dark:ghost-border p-6 transition-all duration-300 hover:-translate-y-0.5 ambient-shadow">
        {/* Top: Tag + Timestamp */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16A34A]/10">
              <Zap className="w-3 h-3 text-[#16A34A]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#16A34A]">
                Quick Take
              </span>
            </div>
            {post.club && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {post.club}
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-black font-outfit leading-tight text-[#0F172A] dark:text-white mb-3 group-hover:text-[#16A34A] transition-colors">
          {post.title}
        </h2>

        {/* Content Preview */}
        <p className="text-sm leading-relaxed text-[#64748B] dark:text-gray-400 line-clamp-4">
          {post.content?.replace(/<[^>]*>/g, "").replace(/[#*_`>]/g, "").slice(0, 280)}
        </p>

        {/* Bottom: Tags + Read More */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
          <div className="flex flex-wrap gap-1.5">
            {post.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => onShareImage(post)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#16A34A] hover:bg-[#16A34A]/10 transition-colors"
              title="Share as Image"
            >
              <Camera className="w-4 h-4" />
            </button>
            <Link
              href={`/post/${post.slug || post.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] hover:gap-2.5 transition-all"
            >
              Read
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

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

export function QuickTakesClient({ initialPosts }: { initialPosts?: BlogPost[] }) {
  const [sharePost, setSharePost] = useState<BlogPost | null>(null);

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["posts"],
    queryFn: () => fetch("/api/posts").then((r) => r.json()),
    initialData: initialPosts,
  });

  // Filter to only quick-takes, sorted by newest first
  const quickTakes = posts
    .filter((p) => p.format === "quick-take" && !p.isDraft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title="Quick Takes"
        description="Rapid-fire football opinions, transfer reactions, and tactical hot takes."
      />
      <Header />

      <main className="mx-auto w-full max-w-[720px] px-4 pt-24 pb-16 sm:px-6">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#16A34A]/10 mb-4">
            <Zap className="w-4 h-4 text-[#16A34A]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#16A34A]">
              Quick Takes
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-outfit text-[#0F172A] dark:text-white">
            Hot Takes, Fast
          </h1>
          <p className="mt-3 text-lg text-[#64748B] dark:text-gray-400 max-w-md mx-auto">
            Rapid-fire football opinions. No fluff. Under 60 seconds to read.
          </p>
        </div>

        {/* Quick Takes Feed */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[1.5rem] bg-gray-100 dark:bg-white/5 h-48 animate-pulse"
              />
            ))}
          </div>
        ) : quickTakes.length === 0 ? (
          <div className="text-center py-20">
            <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400 dark:text-gray-500">
              No quick takes yet
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-2">
              Quick takes will appear here once they&apos;re published from the admin panel.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {quickTakes.map((post) => (
              <QuickTakeCard key={post.id} post={post} onShareImage={setSharePost} />
            ))}
            <ImageShareModal 
              isOpen={!!sharePost} 
              onClose={() => setSharePost(null)}
              post={sharePost}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
