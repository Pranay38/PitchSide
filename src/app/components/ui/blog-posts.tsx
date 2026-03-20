import { cn } from "./utils";
import { MoveRight, Star } from "lucide-react";

export interface BlogPostItem {
  id: string | number;
  title: string;
  category: string;
  imageUrl: string;
  href?: string;
  views: string | number;
  readTime?: number;
  rating?: number;
  className?: string;
}

export interface BlogPostsGridProps {
  title: string;
  description: string;
  backgroundLabel?: string;
  backgroundPosition?: "left" | "right";
  posts?: BlogPostItem[];
  className?: string;
  onPostClick?: (post: BlogPostItem) => void;
}

export const BlogPostsGrid = ({
  title,
  description,
  backgroundLabel,
  backgroundPosition = "left",
  posts = [],
  className,
  onPostClick,
}: BlogPostsGridProps) => {
  return (
    <section className={cn("relative mx-auto w-full", className)}>
      <h2 className="text-center text-3xl font-black font-outfit capitalize !leading-[1.4] md:text-4xl lg:text-5xl mb-3 dark:text-white">
        {title}
      </h2>
      
      {backgroundLabel && (
        <span
          className={cn(
            "absolute -top-10 -z-[1] select-none text-[120px] font-extrabold leading-[1] text-black/[0.03] md:text-[200px] lg:text-[300px] dark:text-white/[0.02]",
            backgroundPosition === "left" ? "-left-[10%]" : "-right-[15%]"
          )}
        >
          {backgroundLabel}
        </span>
      )}
      
      <p className="mx-auto max-w-[800px] text-center text-lg leading-relaxed text-gray-500 dark:text-gray-400 md:text-xl mb-10">
        {description}
      </p>
      
      <div className="grid h-auto grid-cols-1 gap-4 md:grid-rows-2 md:h-[650px] md:grid-cols-2 lg:grid-cols-[1fr_0.5fr] z-10 relative">
        {posts.map((post, index) => {
          const {
            id,
            title: postTitle,
            category,
            imageUrl,
            views,
            readTime,
            rating = 4,
            className: postClassName
          } = post;
          
          const isPrimary = index === 0;

          return (
            <div
              key={id || index}
              style={{ backgroundImage: `url(${imageUrl})` }}
              className={cn(
                "group relative row-span-1 flex size-full cursor-pointer flex-col justify-end overflow-hidden rounded-[20px] bg-cover bg-center bg-no-repeat p-6 text-white max-md:h-[350px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                isPrimary && "col-span-1 row-span-1 md:col-span-2 md:row-span-2 lg:col-span-1",
                postClassName
              )}
              onClick={() => onPostClick?.(post)}
            >
              <div className="absolute inset-0 z-0 h-[100%] w-full bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-all duration-500 group-hover:bg-black/40" />
              
              <article className="relative z-10 flex items-end w-full">
                <div className="flex flex-1 flex-col gap-4">
                  <span className="text-xs font-black uppercase tracking-wider py-1 px-3 rounded-full bg-white/20 w-fit text-white backdrop-blur-md border border-white/30">
                    {category}
                  </span>
                  
                  <h3 className={cn("font-black font-outfit drop-shadow-md", isPrimary ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl")}>
                    {postTitle}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          width={14}
                          height={14}
                          key={idx}
                          stroke={idx < rating ? "#4ade80" : "rgba(255,255,255,0.3)"}
                          fill={idx < rating ? "#4ade80" : "transparent"}
                        />
                      ))}
                      <span className="text-sm font-medium ml-2 text-gray-200">
                        ({views} Views)
                      </span>
                    </div>
                    {readTime && (
                      <div className="text-sm font-bold text-gray-200">
                        {readTime} MIN READ
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white/10 p-3 rounded-full backdrop-blur-md border border-white/20 transition-transform duration-300 group-hover:scale-110 shrink-0">
                  <MoveRight
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    color="white"
                    width={24}
                    height={24}
                    strokeWidth={2}
                  />
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
};
