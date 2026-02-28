import { Link } from "react-router";
import type { BlogPost } from "../data/posts";
import { Clock } from "lucide-react";

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  if (featured) {
    return (
      <Link
        to={`/post/${post.id}`}
        className="group block relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
      >
        <div className="aspect-[21/9] overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-[#16A34A] rounded-full">
              {post.club}
            </span>
            {post.tags
              .filter((t) => t !== post.club)
              .slice(0, 2)
              .map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-3 py-1 text-xs font-medium text-white/80 bg-white/20 backdrop-blur-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2 group-hover:text-[#4ade80] transition-colors duration-300">
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
      className="group block bg-white dark:bg-[#1E293B] rounded-xl shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold text-white bg-[#16A34A] rounded-full">
            {post.club}
          </span>
          {post.tags
            .filter((t) => t !== post.club)
            .slice(0, 1)
            .map((tag) => (
              <span
                key={tag}
                className="inline-block px-2.5 py-0.5 text-xs font-medium text-[#64748B] dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
        </div>
        <h3 className="font-bold text-[#0F172A] dark:text-white mb-2 line-clamp-2 group-hover:text-[#16A34A] transition-colors duration-200">
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
