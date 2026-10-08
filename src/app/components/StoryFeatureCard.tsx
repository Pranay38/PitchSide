import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import type { StoryFeature } from "../data/stories";

interface StoryFeatureCardProps {
  story: StoryFeature;
  variant?: "feature" | "standard" | "compact";
  label?: string;
  ctaLabel?: string;
}

export function StoryFeatureCard({ story, variant = "standard", label, ctaLabel = "Read story" }: StoryFeatureCardProps) {
  const featured = variant === "feature";
  const compact = variant === "compact";
  return (
    <Link to={`/stories/${story.slug}`} className={`group block min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600 ${featured ? "grid items-center gap-7 lg:grid-cols-[1.35fr_1fr] lg:gap-12" : compact ? "grid items-start gap-5 sm:grid-cols-[220px_1fr]" : "space-y-5"}`}>
      {story.coverImage && (
        <div className={`relative overflow-hidden bg-stone-100 dark:bg-stone-900 ${featured ? "aspect-[4/3]" : "aspect-[16/10]"}`}>
          <Image src={story.coverImage} alt={story.title} fill priority={featured} sizes={featured ? "(max-width: 1024px) 100vw, 650px" : compact ? "(max-width: 640px) 100vw, 220px" : "(max-width: 768px) 100vw, 550px"} className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none" />
        </div>
      )}
      <div className="min-w-0">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-green-700 dark:text-green-400">{label || story.eyebrow}</p>
        <h2 className={`font-newsreader font-medium leading-[1.08] tracking-tight text-stone-900 dark:text-stone-100 [overflow-wrap:anywhere] ${featured ? "text-4xl sm:text-5xl" : "text-3xl"}`}>{story.title}</h2>
        <p className="mt-4 max-w-[55ch] text-base leading-7 text-stone-600 dark:text-stone-400">{story.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500 dark:text-stone-400">
          <span>{story.date}</span><span>{story.readTime}</span>
        </div>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">{ctaLabel}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
      </div>
    </Link>
  );
}
