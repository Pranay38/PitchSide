import { Link } from "@/lib/router-compat";
import Image from "next/image";
import type { BlogPost } from "../data/posts";
import { getClubByName } from "../data/clubs";
import { Clock, Star, ArrowRight, Heart } from "lucide-react";
import { getCategoryBadgeColor } from "./ui/utils";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const clubData = getClubByName(post.club);
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState<boolean>(() => post.likedBy?.includes(user?.id || "") || false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return; // User must be logged in to like

    setIsLiked(!isLiked);
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: user.id })
      });
    } catch {
      setIsLiked(isLiked); // Revert on failure
    }
  };

  if (featured) {
    return (
      <div
        className="group block relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#16A34A]/10 transition-all duration-500 bg-slate-900 aspect-[4/5] md:aspect-[16/11] lg:aspect-[4/5] xl:aspect-[1/1]"
      >
        <Link to={`/post/${post.slug || post.id}`} className="absolute inset-0 z-10" aria-label={`Read ${post.title}`} />
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-0" />
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-0 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 mb-3">
             {post.mustRead && (
               <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-400 rounded-full animate-pulse-glow">
                 <Star className="w-3 h-3 fill-amber-900" />
                 Must Read
               </div>
             )}
             {post.matchRating !== undefined && post.matchRating > 0 && (
               <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0F172A] bg-[#4ade80] rounded-full shadow-md">
                 <Star className="w-3 h-3 fill-[#0F172A]" />
                 {post.matchRating}/10 Rating
               </div>
             )}
             {(() => {
               const publishDate = new Date(post.date);
               const now = new Date();
               const hoursAgo = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
               const updatedAt = (post as any).updatedAt;
               const wasUpdated = updatedAt && new Date(updatedAt).toDateString() !== publishDate.toDateString();
               
               if (hoursAgo < 24) {
                 return (
                   <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white bg-red-500 rounded-full shadow-md animate-pulse">
                     🔴 New
                   </div>
                 );
               }
               if (wasUpdated) {
                 return (
                   <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#0F172A] bg-[#4ade80]/90 rounded-full shadow-md">
                     ✏️ Updated
                   </div>
                 );
               }
               return null;
             })()}
          </div>
          
          <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(e); }}
             className="absolute md:-top-4 -top-8 right-6 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-colors active:scale-95 pointer-events-auto"
          >
             <Heart className={`w-5 h-5 transition-transform duration-300 ${isLiked ? 'fill-emerald-500 text-emerald-500 scale-110' : 'text-white'}`} />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white gradient-accent rounded-full shadow-md">
              {clubData?.logo && <img src={clubData.logo} alt="" className="w-4 h-4 object-contain" />}
              {post.club}
            </span>
            {post.tags
              .filter((t) => t !== post.club)
              .slice(0, 2)
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-3 py-1 text-xs font-medium text-white/90 bg-white/15 backdrop-blur-md rounded-full border border-white/10"
                >
                  {tag}
                </span>
              ))}
          </div>
          <h2 className="text-2xl md:text-3xl font-headline text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {post.title}
          </h2>
          <p className="text-sm text-white/70 mb-3 line-clamp-2 max-w-2xl">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-white/70">
            <span>By The Touchline Dribble</span>
            <span>·</span>
            <span className="flex items-center gap-1">
               <Clock className="w-3 h-3" />
               {post.readTime}
            </span>
            <span>·</span>
            <span>{post.date}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group block relative glass-card rounded-2xl hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      <Link to={`/post/${post.slug || post.id}`} className="absolute inset-0 z-10" aria-label={`Read ${post.title}`} />
      <div className="aspect-video overflow-hidden relative pointer-events-none">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-0">
          {post.mustRead && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-400 rounded-full shadow-md">
              <Star className="w-3 h-3 fill-amber-900" />
              Must Read
            </div>
          )}
          {post.matchRating !== undefined && post.matchRating > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#0F172A] bg-[#4ade80] rounded-full shadow-md">
              <Star className="w-3 h-3 fill-[#0F172A]" />
              {post.matchRating}/10 Rating
            </div>
          )}
          {(() => {
            const publishDate = new Date(post.date);
            const now = new Date();
            const hoursAgo = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60);
            const updatedAt = (post as any).updatedAt;
            const wasUpdated = updatedAt && new Date(updatedAt).toDateString() !== publishDate.toDateString();
            
            if (hoursAgo < 24) {
              return (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white bg-red-500 rounded-full shadow-md animate-pulse">
                  🔴 New
                </div>
              );
            }
            if (wasUpdated) {
              return (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#0F172A] bg-[#4ade80]/90 rounded-full shadow-md">
                  ✏️ Updated
                </div>
              );
            }
            return null;
          })()}
          <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md bg-black/50 border border-white/20 rounded-full shadow-sm">
              {clubData?.logo && <img src={clubData.logo} alt="" className="w-3.5 h-3.5 object-contain" />}
              {post.club}
            </span>
            {post.tags
              .filter((t) => t !== post.club)
              .slice(0, 1)
              .map((tag) => (
                <span
                  key={tag}
                  className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md rounded-full border ${getCategoryBadgeColor(tag, true)}`}
                >
                  {tag}
                </span>
              ))}
          </div>
          
          <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(e); }}
             className="absolute -top-1 -right-4 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 hover:bg-black/60 transition-colors active:scale-95 pointer-events-auto"
          >
             <Heart className={`w-4 h-4 transition-transform duration-300 ${isLiked ? 'fill-[#4ade80] text-[#4ade80] scale-110' : 'text-white'}`} />
          </button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5 sm:p-6 flex flex-col h-full bg-background pointer-events-none border-t border-border">
        <h3 className="font-headline text-2xl text-foreground tracking-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {post.title}
        </h3>
        <p className="mb-6 text-[#64748B] text-sm leading-relaxed dark:text-gray-400 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="mt-auto pt-5 flex items-center justify-between border-t border-border">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>By The Touchline Dribble</span>
            <span>·</span>
            <span className="flex items-center gap-1">
               <Clock className="w-3 h-3" />
               {post.readTime}
            </span>
            <span>·</span>
            <span>{post.date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
