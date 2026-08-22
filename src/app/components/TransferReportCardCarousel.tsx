"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, GraduationCap, Eye, EyeOff } from "lucide-react";
import { TransferReportCard, type ClubReportCard } from "./TransferReportCard";
import { getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import type { TransferReportCards } from "../lib/transferReportCards";

export function TransferReportCardCarousel() {
  const [data, setData] = useState<TransferReportCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    setIsMounted(true);
    const hiddenState = localStorage.getItem("ttd_report_card_hidden");
    if (hiddenState === "true") {
      setIsHidden(true);
    }

    const fetchData = async () => {
      try {
        const settings = await getSiteSettingsAsync();
        setData(settings.transferReportCards);
      } catch (error) {
        console.error("Failed to load transfer report cards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleVisibility = () => {
    const newState = !isHidden;
    setIsHidden(newState);
    localStorage.setItem("ttd_report_card_hidden", newState.toString());
  };

  // Only render client side content after mount to avoid hydration mismatch
  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="tinted-panel rounded-[2rem] border border-gray-200 p-5 shadow-sm dark:border-gray-800 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
        <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
    );
  }

  if (!data || !data.enabled || !data.clubs || data.clubs.length === 0) {
    return null;
  }

  return (
    <div className="tinted-panel rounded-[2rem] border border-gray-200 p-5 shadow-sm dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-[#16A34A]" />
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A] mb-1 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Season Grades</span>
            </div>
            <h2 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white flex items-center gap-2">
              Transfer Window Report Card
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold font-sans">
                {data.window}
              </span>
            </h2>
          </div>
        </div>
        <button
          onClick={toggleVisibility}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          aria-label={isHidden ? "Show transfer report cards" : "Hide transfer report cards"}
        >
          {isHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>

      {!isHidden && (
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y -ml-4">
              {data.clubs.map((club, index) => {
                const isActive = index === selectedIndex;
                return (
                  <div 
                    key={club.club} 
                    className={`flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_80%] lg:flex-[0_0_60%] transition-all duration-500 ease-out ${
                      isActive 
                        ? "opacity-100 scale-100 blur-0" 
                        : "opacity-40 scale-[0.85] blur-[1px] cursor-pointer"
                    }`}
                    onClick={() => !isActive && scrollTo(index)}
                  >
                    <div className={isActive ? "shadow-2xl" : "shadow-sm pointer-events-none"}>
                      <TransferReportCard card={club} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -ml-2 lg:-ml-6 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center transition-all ${
              !canScrollPrev ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105"
            }`}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 -mr-2 lg:-mr-6 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center transition-all ${
              !canScrollNext ? "opacity-0 pointer-events-none" : "opacity-100 hover:scale-105"
            }`}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex justify-center gap-1.5 mt-6">
            {data.clubs.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? "bg-[#16A34A] w-4"
                    : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
