import { ArrowRight, ArrowUpRight, Star, Clock } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Avatar, AvatarFallback, AvatarImage } from "./aero-avatar";
import { Button } from "./aero-button";
import type { BlogPost } from "../../data/posts";
import type { StoryFeature } from "../../data/stories";

export default function AeroHero({ post }: { post: BlogPost | StoryFeature | null }) {
  if (!post) return null;

  return (
    <section className="relative flex min-h-[75vh] w-full items-end justify-center">
      <div
        className="absolute inset-0 h-full bg-cover"
        style={{
          backgroundImage: `url(${post.coverImage})`,
          backgroundPosition: "center 20%",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-6 pb-20 text-center text-white md:px-6 xl:px-0">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between text-left gap-8">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-900 bg-amber-400 rounded-full shadow-lg shadow-amber-400/20">
                <Star className="w-3.5 h-3.5 fill-amber-900" />
                Must Read
              </div>
              <span className="text-sm font-bold text-gray-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
            
            <h1 className="font-outfit font-black text-4xl sm:text-5xl text-white tracking-tight md:text-6xl lg:text-7xl leading-tight md:leading-[1.05]">
              {post.title}
            </h1>

            <p className="max-w-2xl font-medium text-lg text-gray-300 md:text-xl leading-relaxed">
              {post.excerpt}
            </p>
          </div>
          
          <div className="mt-auto space-y-7 shrink-0">
            <div className="flex w-fit gap-6 lg:mt-auto pt-8">
              <Link to={'slug' in post ? `/stories/${post.slug}` : `/post/${post.id}`}>
                <div className="group/btn relative flex items-center overflow-hidden font-bold text-white transition-colors cursor-pointer pt-4">
                  <span className="mr-4 relative overflow-hidden flex items-center justify-center rounded-full bg-[#16A34A] p-3 w-12 h-12 transition-colors duration-300 ease-in group-hover/btn:bg-white group-hover/btn:text-[#0F172A] text-white shadow-lg shadow-[#16A34A]/20">
                    <ArrowRight className="absolute h-5 w-5 transition-all duration-500 ease-in group-hover/btn:translate-x-8 group-hover/btn:opacity-0" />
                    <ArrowRight className="absolute -left-5 h-5 w-5 transition-all duration-500 ease-in-out group-hover/btn:left-3.5" />
                  </span>
                  <span className="font-black tracking-widest uppercase text-sm sm:text-base group-hover/btn:text-gray-300 transition-colors duration-300">
                    Read Article
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
