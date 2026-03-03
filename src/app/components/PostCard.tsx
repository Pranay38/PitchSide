import { Link } from "react-router";
import type { BlogPost } from "../data/posts";
import { getClubByName } from "../data/clubs";
import { Clock, Star } from "lucide-react";

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const clubData = getClubByName(post.club);

  if (featured) {
    return (
      <Link
        to={`/post/${post.id}`}
        className="group block relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#16A34A]/10 transition-all duration-500 h-full bg-slate-900"
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
          {/* Must Read Badge */}
          {post.mustRead && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-400 rounded-full mb-3 animate-pulse-glow">
              <Star className="w-3 h-3 fill-amber-900" />
              Must Read
            </div>
          )}
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
          <h2 className="text-2xl md:text-3xl font-extrabold font-outfit text-white mb-2 line-clamp-2 group-hover:text-[#4ade80] transition-colors duration-300">
            {post.title}
          </h2>
          <p className="text-sm text-white/70 mb-3 line-clamp-2 max-w-2xl">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span>{post.date}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/post/${post.id}`}
      className="group block glass-card rounded-2xl hover:shadow-xl hover:shadow-[#16A34A]/5 dark:hover:shadow-[#16A34A]/10 transition-all duration-400 hover:-translate-y-1.5 overflow-hidden"
    >
      {/* Gradient accent line at top */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#16A34A] via-[#22c55e] to-[#4ade80] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="aspect-video overflow-hidden relative">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"
        />
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5">
        {/* Must Read Badge */}
        {post.mustRead && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-amber-900 bg-amber-400 rounded-full mb-2 shadow-sm">
            <Star className="w-3 h-3 fill-amber-900" />
            Must Read
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold text-white gradient-accent rounded-full shadow-sm">
            {clubData?.logo && <img src={clubData.logo} alt="" className="w-3.5 h-3.5 object-contain" />}
            {post.club}
          </span>
          {post.tags
            .filter((t) => t !== post.club)
            .slice(0, 1)
            .map((tag) => (
              <span
                key={tag}
                className="inline-block px-2.5 py-0.5 text-xs font-medium text-[#475569] dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/50 rounded-full backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
        </div>
        <h3 className="font-bold font-outfit text-[#0F172A] dark:text-white mb-2 line-clamp-2 group-hover:text-[#16A34A] transition-colors duration-200">
          {post.title}
        </h3>
        <p className="text-sm text-[#64748B] dark:text-gray-400 mb-3 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2 text-xs text-[#94A3B8] dark:text-gray-500">
          <span>{post.date}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
