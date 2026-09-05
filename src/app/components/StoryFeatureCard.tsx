import { ArrowRight, BookOpen, Layers3 } from "lucide-react";
import Image from "next/image";
import { Link } from "@/lib/router-compat";
import type { StoryFeature } from "../data/stories";

interface StoryFeatureCardProps {
  story: StoryFeature;
  variant?: "feature" | "standard" | "compact";
  label?: string;
  ctaLabel?: string;
}

export function StoryFeatureCard({
  story,
  variant = "standard",
  label,
  ctaLabel = "Open story",
}: StoryFeatureCardProps) {
  if (variant === "compact") {
    return (
      <Link
        to={`/stories/${story.slug}`}
        className="group cursor-pointer overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800 dark:bg-[#0F172A]"
      >
        <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative min-h-[200px] overflow-hidden">
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              quality={95}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 opacity-80"
              style={{ background: `linear-gradient(145deg, ${story.themeFrom}bb, ${story.themeTo}88)` }}
            />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#16A34A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#16A34A]">
                {label || story.eyebrow}
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">{story.readTime}</span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">{story.chapters.length} chapters</span>
            </div>
            <h3 className="mt-4 text-2xl font-black font-outfit leading-tight text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
              {story.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#64748B] dark:text-gray-400">
              {story.excerpt}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#16A34A]">
              {ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "feature") {
    return (
      <Link
        to={`/stories/${story.slug}`}
        className="group cursor-pointer overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl shadow-[#0F172A]/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-2xl dark:border-gray-800 dark:bg-[#0F172A]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[320px] overflow-hidden lg:min-h-full">
            <Image
              src={story.coverImage}
              alt={story.title}
              fill
              quality={95}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(145deg, ${story.themeFrom}c9, ${story.themeTo}85)` }}
            />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/72">
                {label || "Featured Story"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Read Time</p>
                  <p className="mt-2 text-lg font-black font-outfit">{story.readTime}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Chapters</p>
                  <p className="mt-2 text-lg font-black font-outfit">{story.chapters.length}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Highlights</p>
                  <p className="mt-2 text-lg font-black font-outfit">{story.highlights.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#16A34A]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#16A34A]">
                {story.eyebrow}
              </span>
              <span className="text-xs font-semibold text-[#64748B] dark:text-gray-400">{story.date}</span>
            </div>
            <h2 className="mt-5 text-4xl font-black font-outfit leading-[0.95] text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
              {story.title}
            </h2>
            <p className="mt-4 text-lg font-semibold text-[#16A34A]">
              {story.subtitle}
            </p>
            <p className="mt-5 text-base leading-7 text-[#475569] dark:text-gray-300">
              {story.excerpt}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {story.highlights.slice(0, 4).map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#334155] dark:border-gray-800 dark:bg-[#08111f] dark:text-gray-200"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-7 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#16A34A]">
              {ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/stories/${story.slug}`}
      className="group cursor-pointer overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#16A34A]/30 hover:shadow-xl dark:border-gray-800 dark:bg-[#0F172A]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={story.coverImage}
          alt={story.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent, ${story.themeFrom}99)` }}
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-sm">
            {label || story.eyebrow}
          </span>
          <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {story.readTime}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-white/72">
            <span className="inline-flex items-center gap-1">
              <Layers3 className="h-3.5 w-3.5 text-[#86efac]" />
              {story.chapters.length} chapters
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-[#86efac]" />
              {story.highlights.length} signals
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-black font-outfit leading-tight text-[#0F172A] transition-colors group-hover:text-[#16A34A] dark:text-white">
          {story.title}
        </h3>
        <p className="mt-3 text-sm font-semibold text-[#16A34A]">
          {story.subtitle}
        </p>
        <p className="mt-4 text-sm leading-6 text-[#64748B] dark:text-gray-400">
          {story.excerpt}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {story.highlights.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-[#475569] dark:bg-white/5 dark:text-gray-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#16A34A]">
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
