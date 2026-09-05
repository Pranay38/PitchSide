import { ArrowRight, Clock } from "lucide-react";
import Image from "next/image";
import { Link } from "@/lib/router-compat";
import type { BlogPost } from "../../data/posts";
import type { StoryFeature } from "../../data/stories";

export default function AeroHero({ post }: { post: BlogPost | StoryFeature | null }) {
  if (!post) return null;

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 lg:px-6 py-12 md:py-20 lg:py-24">
      <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-16 items-center">
        {/* Left Column */}
        <div className="w-full lg:w-[55%] space-y-6">
          <div className="flex items-center gap-3">
             <div className="kicker px-3 py-1 bg-secondary text-primary rounded-full">
               Must Read
             </div>
             <span className="dateline flex items-center gap-1.5">
               <Clock className="w-4 h-4" />
               {post.readTime}
             </span>
          </div>
          
          <h1 className="font-headline font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.02] text-foreground tracking-[-0.03em]">
            {post.title}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            {post.excerpt}
          </p>
          
          <div className="pt-6">
            <Link 
              to={'chapters' in post ? `/stories/${post.slug}` : `/post/${post.slug || post.id}`} 
              className="group inline-flex items-center gap-3 bg-foreground text-background font-bold tracking-widest uppercase text-xs px-6 py-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Read Article
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="w-full lg:w-[45%]">
           <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] rounded-xl overflow-hidden glass-card">
              <Image 
                src={post.coverImage} 
                alt={post.title} 
                fill
                quality={95}
                priority
                className="object-cover transition-transform duration-700 hover:scale-[1.02]" 
              />
           </div>
        </div>
      </div>
    </section>
  );
}
