import { useState, useEffect, useCallback, useRef } from "react";
import {
  History,
  CalendarDays,
  Share2,
  ChevronLeft,
  ChevronRight,
  Cake,
  Trophy,
  Star,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category = "birthday" | "death" | "event" | "selected";

interface OnThisDayItem {
  year: number;
  text: string;
  category: Category;
  thumbnail: string | null;
  articleUrl: string | null;
}

/* ------------------------------------------------------------------ */
/*  Category badge config                                              */
/* ------------------------------------------------------------------ */

const BADGE: Record<Category, { icon: typeof Cake; label: string; colors: string }> = {
  birthday: {
    icon: Cake,
    label: "Birthday",
    colors: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30",
  },
  death: {
    icon: History,
    label: "Remembrance",
    colors: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50",
  },
  event: {
    icon: Trophy,
    label: "Event",
    colors: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
  },
  selected: {
    icon: Star,
    label: "Highlight",
    colors: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OnThisDayWidget() {
  const [events, setEvents] = useState<OnThisDayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    fetch("/api/on-this-day")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setEvents(data.events || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Transition helper ────────────────────────────────────────────
  const transitionTo = useCallback(
    (nextIndex: number) => {
      setFading(true);
      setTimeout(() => {
        setActiveIndex(nextIndex);
        setFading(false);
      }, 250);
    },
    [],
  );

  // ── Auto-rotate every 6 s ───────────────────────────────────────
  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % (events.length || 1);
        setFading(true);
        setTimeout(() => setFading(false), 250);
        return next;
      });
    }, 6000);
  }, [events.length]);

  useEffect(() => {
    if (events.length <= 1) return;
    startAutoRotate();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [events.length, startAutoRotate]);

  // ── Navigation ───────────────────────────────────────────────────
  const goTo = useCallback(
    (i: number) => {
      transitionTo(i);
      startAutoRotate(); // reset timer on manual navigation
    },
    [transitionTo, startAutoRotate],
  );

  const goPrev = useCallback(() => {
    const next = (activeIndex - 1 + events.length) % events.length;
    goTo(next);
  }, [activeIndex, events.length, goTo]);

  const goNext = useCallback(() => {
    const next = (activeIndex + 1) % events.length;
    goTo(next);
  }, [activeIndex, events.length, goTo]);

  // ── Share ────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const item = events[activeIndex];
    if (!item) return;

    const shareText = `⚽ On this day in ${item.year}: ${item.text}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "On This Day in Football", text: shareText });
        return;
      } catch { /* user cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(shareText);
    } catch { /* clipboard unsupported */ }
  }, [events, activeIndex]);

  // ── Render ───────────────────────────────────────────────────────
  const today = new Date();
  const current = events[activeIndex] ?? null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-[#16A34A]" />
          <h3 className="text-base uppercase tracking-wider font-black font-outfit text-[#0F172A] dark:text-white">
            On This Day
          </h3>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="flex gap-3">
            <div className="w-[60px] h-[60px] rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-[#16A34A]" />
          <h3 className="text-base uppercase tracking-wider font-black font-outfit text-[#0F172A] dark:text-white">
            On This Day
          </h3>
        </div>
        <p className="text-sm text-[#64748B] dark:text-gray-400 text-center py-6">
          A quiet day in football history, but the beautiful game continues on pitches worldwide.
        </p>
      </div>
    );
  }

  const badge = current ? BADGE[current.category] : null;
  const BadgeIcon = badge?.icon ?? Trophy;

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:glow-green transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#16A34A]" />
          <h3 className="text-base uppercase tracking-wider font-black font-outfit text-[#0F172A] dark:text-white">
            On This Day
          </h3>
          {events.length > 1 && (
            <span className="text-[10px] font-bold bg-[#16A34A]/10 text-[#16A34A] px-2 py-0.5 rounded-full">
              {activeIndex + 1}/{events.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#16A34A] hover:bg-[#16A34A]/10 transition-colors"
          title="Share this event"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Event Card */}
      {current && (
        <div
          className="transition-all duration-250 ease-in-out"
          style={{
            opacity: fading ? 0 : 1,
            transform: fading ? "translateY(6px)" : "translateY(0)",
          }}
        >
          <div className="flex items-start gap-3 bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
            {/* Thumbnail or date block */}
            {current.thumbnail ? (
              <div className="flex-shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={current.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 min-w-[60px] border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                  {format(today, "MMM")}
                </span>
                <span className="text-xl font-black text-[#16A34A] leading-none my-1">
                  {format(today, "dd")}
                </span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {current.year}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Category badge + year */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge?.colors}`}>
                  <BadgeIcon className="w-3 h-3" />
                  {badge?.label}
                </span>
                <span className="text-[10px] font-bold text-[#94A3B8] dark:text-gray-500">
                  {current.year}
                </span>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium line-clamp-3">
                {current.articleUrl ? (
                  <a
                    href={current.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#16A34A] transition-colors"
                  >
                    {current.text}
                  </a>
                ) : (
                  current.text
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation controls */}
      {events.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#16A34A] hover:bg-[#16A34A]/10 transition-colors"
              aria-label="Previous event"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#16A34A] hover:bg-[#16A34A]/10 transition-colors"
              aria-label="Next event"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center gap-1">
            {events.slice(0, 8).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-5 bg-[#16A34A] shadow-[0_0_6px_rgba(22,163,74,0.6)]"
                    : "w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-[#16A34A]/50"
                }`}
                aria-label={`Go to event ${i + 1}`}
              />
            ))}
            {events.length > 8 && (
              <span className="text-[10px] text-[#94A3B8] ml-1">
                +{events.length - 8}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="font-medium">Football History</span>
          </div>
        </div>
      )}

      {/* Single-event footer */}
      {events.length === 1 && (
        <div className="mt-4 flex items-center gap-1.5 justify-end text-[11px] text-gray-500">
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="font-medium">Football History</span>
        </div>
      )}
    </div>
  );
}
