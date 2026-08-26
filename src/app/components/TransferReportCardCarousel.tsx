"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GraduationCap, Eye, EyeOff, TrendingUp, TrendingDown, Scale, Users } from "lucide-react";
import { getClubByName } from "@/app/data/clubs";
import { getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import type { TransferReportCards } from "../lib/transferReportCards";
import type { ClubReportCard, GradeEntry } from "./TransferReportCard";

/* ------------------------------------------------------------------ */
/*  Grade colour helpers                                               */
/* ------------------------------------------------------------------ */
const getGradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "bg-[#16A34A]";
  if (grade.startsWith("B")) return "bg-[#65A30D]";
  if (grade.startsWith("C")) return "bg-[#D97706]";
  if (grade.startsWith("D")) return "bg-[#DC2626]";
  if (grade === "F") return "bg-[#991B1B]";
  return "bg-gray-500";
};

const getGradeText = (grade: string) => {
  if (grade.startsWith("A")) return "text-[#16A34A]";
  if (grade.startsWith("B")) return "text-[#65A30D]";
  if (grade.startsWith("C")) return "text-[#D97706]";
  if (grade.startsWith("D")) return "text-[#DC2626]";
  if (grade === "F") return "text-[#991B1B]";
  return "text-gray-500";
};

/* ------------------------------------------------------------------ */
/*  Grade row                                                          */
/* ------------------------------------------------------------------ */
const GRADE_ICONS: Record<string, React.ElementType> = {
  incomings: TrendingUp,
  outgoings: TrendingDown,
  valueForMoney: Scale,
  squadBalance: Users,
};

function GradeRow({ label, entry, iconKey, delay }: { label: string; entry: GradeEntry; iconKey: string; delay: number }) {
  const Icon = GRADE_ICONS[iconKey] || Scale;
  return (
    <div
      className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800/60 last:border-0"
      style={{ animation: `rcFadeSlideUp 0.35s ease-out ${delay}s both` }}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/80 flex items-center justify-center mt-0.5">
        <Icon className="w-4 h-4 text-[#94A3B8] dark:text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-[#0F172A] dark:text-white">{label}</span>
          <span className={`text-[15px] font-black ${getGradeText(entry.grade)}`}>{entry.grade}</span>
        </div>
        <p className="text-[12px] leading-[1.5] text-[#64748B] dark:text-gray-400 mt-0.5">{entry.comment}</p>
        {entry.names && entry.names.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {entry.names.map((n) => (
              <span key={n} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-[#475569] dark:text-gray-400">
                {n}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single club slide                                                  */
/* ------------------------------------------------------------------ */
function ClubSlide({ card, windowLabel }: { card: ClubReportCard; windowLabel: string }) {
  const clubData = getClubByName(card.club);
  const overall = card.grades.overall;

  const subjects: { key: string; label: string; entry: GradeEntry }[] = [
    { key: "incomings", label: "Incomings", entry: card.grades.incomings },
    { key: "outgoings", label: "Outgoings", entry: card.grades.outgoings },
    { key: "valueForMoney", label: "Value for Money", entry: card.grades.valueForMoney },
    { key: "squadBalance", label: "Squad Balance", entry: card.grades.squadBalance },
  ];

  return (
    <div className="px-4 sm:px-5 py-5">
      {/* Club header */}
      <div className="flex items-center gap-3 mb-4" style={{ animation: "rcFadeSlideUp 0.4s ease-out both" }}>
        {clubData?.logo && (
          <img src={clubData.logo} alt={card.club} className="w-10 h-10 object-contain flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white truncate">{card.club}</h3>
          <p className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-500">{card.league}</p>
        </div>
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-sm ${getGradeColor(overall.grade)}`}
          style={{ animation: "rcGradePopIn 0.5s ease-out 0.1s both" }}
        >
          {overall.grade}
        </div>
      </div>

      {/* Overall comment */}
      <p
        className="text-[13px] font-semibold text-[#334155] dark:text-gray-300 mb-4 pl-[52px]"
        style={{ animation: "rcFadeSlideUp 0.35s ease-out 0.12s both" }}
      >
        {overall.comment}
      </p>

      {/* Grade rows */}
      <div className="mb-4">
        {subjects.map((s, i) => (
          <GradeRow key={s.key} label={s.label} entry={s.entry} iconKey={s.key} delay={0.15 + i * 0.06} />
        ))}
      </div>

      {/* Teacher's comment */}
      <div
        className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 mb-4"
        style={{ animation: "rcFadeSlideUp 0.35s ease-out 0.45s both" }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#94A3B8] dark:text-gray-500 mb-1.5">
          Teacher&apos;s Comment
        </p>
        <p className="font-serif italic text-[13px] leading-[1.65] text-[#334155] dark:text-gray-300">
          &ldquo;{card.teachersComment}&rdquo;
        </p>
      </div>

      {/* Financial footer */}
      <div
        className="flex items-center justify-between text-center px-2"
        style={{ animation: "rcFadeSlideUp 0.3s ease-out 0.5s both" }}
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#94A3B8] dark:text-gray-500">Spend</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">{card.totalSpend}</p>
        </div>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#94A3B8] dark:text-gray-500">Income</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">{card.totalIncome}</p>
        </div>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#94A3B8] dark:text-gray-500">Net</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">{card.netSpend}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main carousel — one club per slide                                 */
/* ------------------------------------------------------------------ */
export function TransferReportCardCarousel() {
  const [data, setData] = useState<TransferReportCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* Fetch data */
  useEffect(() => {
    setIsMounted(true);
    const hiddenState = localStorage.getItem("ttd_report_card_hidden");
    if (hiddenState === "true") setIsHidden(true);

    getSiteSettingsAsync()
      .then((settings) => setData(settings.transferReportCards))
      .catch((err) => console.error("Failed to load transfer report cards:", err))
      .finally(() => setLoading(false));
  }, []);

  /* IntersectionObserver to track which slide is visible */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || isHidden || !data) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = slideRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx !== -1) setActiveSlide(idx);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    for (const el of slideRefs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [data, isHidden]);

  /* Dot click scrolls to that slide */
  const scrollToSlide = useCallback((idx: number) => {
    const el = slideRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  const toggleVisibility = () => {
    const next = !isHidden;
    setIsHidden(next);
    localStorage.setItem("ttd_report_card_hidden", next.toString());
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="tinted-panel rounded-[2rem] border border-gray-200 p-5 shadow-sm dark:border-gray-800 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
        <div className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (!data || !data.enabled || !data.clubs || data.clubs.length === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rcFadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rcFadeScaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes rcGradePopIn {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .rc-no-scrollbar::-webkit-scrollbar { display: none; }
        .rc-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="tinted-panel rounded-[2rem] border border-gray-200 shadow-sm dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-[#16A34A]" />
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#16A34A] mb-0.5 flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Season Grades</span>
              </div>
              <h2 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white flex items-center gap-2 flex-wrap">
                Transfer Window Report Card
                <span className="ml-1 px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold font-sans">
                  {data.window}
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={toggleVisibility}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors flex-shrink-0"
            aria-label={isHidden ? "Show transfer report cards" : "Hide transfer report cards"}
          >
            {isHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        {!isHidden && (
          <>
            {/* Club name indicator */}
            <div className="px-5 pb-3 flex items-center justify-between">
              <p className="text-[12px] font-bold text-[#64748B] dark:text-gray-400">
                {activeSlide + 1} / {data.clubs.length}
                <span className="ml-2 text-[#0F172A] dark:text-white font-black">{data.clubs[activeSlide]?.club}</span>
              </p>
              <p className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-500">
                swipe →
              </p>
            </div>

            {/* Carousel — one club per slide */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory rc-no-scrollbar"
            >
              {data.clubs.map((club, idx) => (
                <div
                  key={club.club}
                  ref={(el) => { slideRefs.current[idx] = el; }}
                  className="flex-shrink-0 w-full snap-center"
                >
                  <ClubSlide card={club} windowLabel={data.window} />
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 pb-5 pt-1">
              {data.clubs.map((club, idx) => {
                const clubInfo = getClubByName(club.club);
                const isActive = idx === activeSlide;
                return (
                  <button
                    key={club.club}
                    onClick={() => scrollToSlide(idx)}
                    className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                      isActive
                        ? "w-8 h-8 bg-[#0F172A] dark:bg-white shadow-md scale-105"
                        : "w-6 h-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 opacity-60"
                    }`}
                    aria-label={`Go to ${club.club}`}
                  >
                    {clubInfo?.logo ? (
                      <img
                        src={clubInfo.logo}
                        alt=""
                        className={`object-contain ${isActive ? "w-5 h-5" : "w-3.5 h-3.5"}`}
                      />
                    ) : (
                      <span className={`font-black text-white dark:text-[#0F172A] ${isActive ? "text-[10px]" : "text-[8px]"}`}>
                        {club.club.charAt(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
