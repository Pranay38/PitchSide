"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  GraduationCap,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  Share2,
  Download,
  Loader2,
  Instagram,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { getClubByName } from "@/app/data/clubs";
import { getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import type { TransferReportCards } from "../lib/transferReportCards";
import type { ClubReportCard, GradeEntry } from "./TransferReportCard";

/* ------------------------------------------------------------------ */
/*  Grade → numeric score mapping  (subjects show X / 10)              */
/* ------------------------------------------------------------------ */
const GRADE_SCORE: Record<string, number> = {
  "A+": 10,
  A: 9,
  "A-": 8.5,
  "B+": 8,
  B: 7,
  "B-": 6.5,
  "C+": 6,
  C: 5.5,
  "C-": 5,
  "D+": 4.5,
  D: 4,
  "D-": 3,
  F: 2,
};

function gradeToScore(grade: string): number {
  return GRADE_SCORE[grade] ?? 5;
}

/* ------------------------------------------------------------------ */
/*  Grade colour helpers                                               */
/* ------------------------------------------------------------------ */
const getGradeBg = (grade: string) => {
  if (grade.startsWith("A")) return "bg-[#16A34A]";
  if (grade.startsWith("B")) return "bg-[#65A30D]";
  if (grade.startsWith("C")) return "bg-[#D97706]";
  if (grade.startsWith("D")) return "bg-[#DC2626]";
  if (grade === "F") return "bg-[#991B1B]";
  return "bg-gray-500";
};

const getScoreColor = (score: number) => {
  if (score >= 8.5) return "text-[#16A34A]";
  if (score >= 7) return "text-[#65A30D]";
  if (score >= 5.5) return "text-[#D97706]";
  if (score >= 4) return "text-[#DC2626]";
  return "text-[#991B1B]";
};

const getScoreBarColor = (score: number) => {
  if (score >= 8.5) return "bg-[#16A34A]";
  if (score >= 7) return "bg-[#65A30D]";
  if (score >= 5.5) return "bg-[#D97706]";
  if (score >= 4) return "bg-[#DC2626]";
  return "bg-[#991B1B]";
};

/* ------------------------------------------------------------------ */
/*  Subject icons                                                      */
/* ------------------------------------------------------------------ */
const SUBJECT_ICONS: Record<string, React.ElementType> = {
  incomings: TrendingUp,
  outgoings: TrendingDown,
  valueForMoney: Scale,
  squadBalance: Users,
};

/* ------------------------------------------------------------------ */
/*  Subject row  — shows marks out of 10                               */
/* ------------------------------------------------------------------ */
function SubjectRow({
  label,
  entry,
  iconKey,
  delay,
}: {
  label: string;
  entry: GradeEntry;
  iconKey: string;
  delay: number;
}) {
  const Icon = SUBJECT_ICONS[iconKey] || Scale;
  const score = gradeToScore(entry.grade);
  const pct = (score / 10) * 100;

  return (
    <div
      className="py-3 border-b border-[#3B82F6]/10 dark:border-[#3B82F6]/5 last:border-b-0"
      style={{ animation: `rcFadeIn 0.4s ease-out ${delay}s both` }}
    >
      {/* Label + Score */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#6B7280] dark:text-gray-500" />
          <span className="text-[13px] font-bold font-serif text-[#1E293B] dark:text-gray-200 tracking-wide">
            {label}
          </span>
        </div>
        <span className={`text-[15px] font-black tabular-nums ${getScoreColor(score)}`}>
          {score}
          <span className="text-[11px] font-bold text-[#9CA3AF] dark:text-gray-500">/10</span>
        </span>
      </div>

      {/* Score bar */}
      <div className="h-[5px] rounded-full bg-[#E5E7EB]/60 dark:bg-gray-700/40 overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full ${getScoreBarColor(score)} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%`, animation: `rcBarGrow 0.6s ease-out ${delay + 0.1}s both` }}
        />
      </div>

      {/* Comment */}
      <p className="text-[12px] italic leading-[1.55] text-[#1a365d] dark:text-[#93c5fd] font-serif pl-5">
        {entry.comment}
      </p>

      {/* Player names as pills */}
      {entry.names && entry.names.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 pl-5">
          {entry.names.map((n) => (
            <span
              key={n}
              className="px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-gray-800 text-[9px] font-bold text-[#475569] dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60"
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single club slide — ruled notebook paper                           */
/* ------------------------------------------------------------------ */
function ClubSlide({
  card,
  windowLabel,
  slideRef,
}: {
  card: ClubReportCard;
  windowLabel: string;
  slideRef: React.Ref<HTMLDivElement>;
}) {
  const clubData = getClubByName(card.club);
  const overall = card.grades.overall;

  const subjects: { key: string; label: string; entry: GradeEntry }[] = [
    { key: "incomings", label: "Incomings", entry: card.grades.incomings },
    { key: "outgoings", label: "Outgoings", entry: card.grades.outgoings },
    { key: "valueForMoney", label: "Value for Money", entry: card.grades.valueForMoney },
    { key: "squadBalance", label: "Squad Balance", entry: card.grades.squadBalance },
  ];

  return (
    <div className="px-3 sm:px-4 py-4">
      {/* --- PAPER CARD --- */}
      <div
        ref={slideRef}
        className="relative mx-auto max-w-[420px] transform -rotate-[0.4deg] hover:rotate-0 transition-transform duration-300 select-none"
      >
        <div
          className="relative overflow-hidden rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          style={{
            background: "var(--rc-paper-bg, #FFFDF7)",
            backgroundImage: `
              linear-gradient(90deg, transparent 54px, rgba(239, 68, 68, 0.35) 54px, rgba(239, 68, 68, 0.35) 56px, transparent 56px),
              repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(59, 130, 246, 0.18) 27px, rgba(59, 130, 246, 0.18) 28px)
            `,
          }}
        >
          {/* Hole punches */}
          <div className="absolute left-[20px] top-[60px] w-[14px] h-[14px] rounded-full bg-white dark:bg-[#0a0a1a] border-2 border-gray-300 dark:border-gray-600 shadow-inner z-20" />
          <div className="absolute left-[20px] top-[220px] w-[14px] h-[14px] rounded-full bg-white dark:bg-[#0a0a1a] border-2 border-gray-300 dark:border-gray-600 shadow-inner z-20" />
          <div className="absolute left-[20px] bottom-[100px] w-[14px] h-[14px] rounded-full bg-white dark:bg-[#0a0a1a] border-2 border-gray-300 dark:border-gray-600 shadow-inner z-20" />

          {/* Coffee stain */}
          <div
            className="absolute bottom-20 right-6 w-20 h-20 rounded-full pointer-events-none opacity-[0.12] dark:opacity-[0.06] mix-blend-multiply dark:mix-blend-screen z-10"
            style={{
              background:
                "radial-gradient(circle, transparent 35%, #8B5A2B 85%, #6b4423 100%)",
              transform: "rotate(-20deg) scale(1.15) skew(3deg, 6deg)",
            }}
          />

          {/* Dog-ear fold */}
          <div
            className="absolute top-0 right-0 w-0 h-0 z-20"
            style={{
              borderStyle: "solid",
              borderWidth: "0 28px 28px 0",
              borderColor: "transparent var(--rc-fold-color, #e8e4dc) transparent transparent",
            }}
          />
          <div
            className="absolute top-0 right-0 w-0 h-0 z-20"
            style={{
              borderStyle: "solid",
              borderWidth: "28px 0 0 28px",
              borderColor: "var(--rc-fold-shadow, #d4cfc5) transparent transparent transparent",
            }}
          />

          {/* ─── Content ─── */}
          <div className="pl-[66px] pr-5 pt-6 pb-5 relative z-10">
            {/* Header: REPORT CARD stamp */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <GraduationCap className="w-4 h-4 text-[#6B7280] dark:text-gray-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9CA3AF] dark:text-gray-500">
                    {windowLabel}
                  </span>
                </div>
                <h3 className="font-serif text-[17px] font-black uppercase tracking-wider text-[#1E293B] dark:text-gray-200 leading-tight">
                  Transfer Window
                  <br />
                  Report Card
                </h3>
                <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-gray-400">
                  {card.club} • {card.league}
                </div>
              </div>

              {/* Club crest */}
              {clubData?.logo && (
                <div className="flex-shrink-0 ml-3 mt-1">
                  <img
                    src={clubData.logo}
                    alt={card.club}
                    width={44}
                    height={44}
                    className="object-contain drop-shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Subjects — marks out of 10 */}
            <div className="mb-4">
              {subjects.map((s, i) => (
                <SubjectRow
                  key={s.key}
                  label={s.label}
                  entry={s.entry}
                  iconKey={s.key}
                  delay={0.08 + i * 0.06}
                />
              ))}
            </div>

            {/* ─── OVERALL GRADE — stamp animation ─── */}
            <div className="mt-3 pt-4 border-t-2 border-dashed border-[#1E293B]/20 dark:border-gray-600/40 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9CA3AF] dark:text-gray-500 mb-1">
                  Overall Grade
                </div>
                <p className="text-[13px] font-bold italic font-serif text-[#1a365d] dark:text-[#93c5fd] leading-snug">
                  &ldquo;{overall.comment}&rdquo;
                </p>
              </div>
              <div
                className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg ring-[3px] ring-white/80 dark:ring-gray-900/80 ${getGradeBg(overall.grade)}`}
                style={{
                  animation: "rcGradeStamp 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both",
                  boxShadow: "0 0 0 3px rgba(0,0,0,0.08), 0 6px 20px rgba(0,0,0,0.15)",
                }}
              >
                {overall.grade}
              </div>
            </div>

            {/* Teacher's Comment */}
            <div className="mt-5 pt-3 relative">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9CA3AF] dark:text-gray-500 mb-2 font-serif">
                Teacher&apos;s Comments
              </div>
              <p className="font-serif italic text-[13px] leading-[1.7] text-[#1a365d] dark:text-[#93c5fd]">
                &ldquo;{card.teachersComment}&rdquo;
              </p>
            </div>
          </div>

          {/* Financial footer — registrar stamp feel */}
          <div className="bg-[#F8F5EE] dark:bg-[#111827] border-t border-[#D1C9B8]/60 dark:border-gray-700/50 pl-[66px] pr-5 py-3 text-center">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#9CA3AF] dark:text-gray-500">
                  Spend
                </span>
                <span className="text-[13px] font-bold text-[#1E293B] dark:text-gray-200 tabular-nums">
                  {card.totalSpend}
                </span>
              </div>
              <div className="w-px h-6 bg-[#D1C9B8]/60 dark:bg-gray-700/40" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#9CA3AF] dark:text-gray-500">
                  Income
                </span>
                <span className="text-[13px] font-bold text-[#1E293B] dark:text-gray-200 tabular-nums">
                  {card.totalIncome}
                </span>
              </div>
              <div className="w-px h-6 bg-[#D1C9B8]/60 dark:bg-gray-700/40" />
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#9CA3AF] dark:text-gray-500">
                  Net
                </span>
                <span className="text-[13px] font-bold text-[#1E293B] dark:text-gray-200 tabular-nums">
                  {card.netSpend}
                </span>
              </div>
            </div>
            {/* Watermark branding */}
            <div className="mt-2 text-[8px] font-bold tracking-[0.25em] uppercase text-[#C4B99A] dark:text-gray-600">
              pitchside • touchlinedribble.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Share helper — html2canvas capture + share/download                */
/* ------------------------------------------------------------------ */
async function captureCardAsBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    const isDark = document.documentElement.classList.contains("dark");
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: isDark ? "#0f0f23" : "#FFFDF7",
      logging: false,
    });
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
    });
  } catch (err) {
    console.error("Report card capture failed:", err);
    return null;
  }
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Share buttons row                                                  */
/* ------------------------------------------------------------------ */
function ShareButtons({
  cardRef,
  clubName,
  windowLabel,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  clubName: string;
  windowLabel: string;
}) {
  const [busy, setBusy] = useState<"ig" | "tw" | null>(null);

  const handleInstagramShare = async () => {
    if (!cardRef.current) return;
    setBusy("ig");
    try {
      const blob = await captureCardAsBlob(cardRef.current);
      if (!blob) {
        toast.error("Failed to generate image");
        return;
      }

      const file = new File([blob], `${clubName.toLowerCase().replace(/\s+/g, "-")}-report-card.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${clubName} Transfer Report Card`,
            text: `${clubName} ${windowLabel} Transfer Report Card 📝⚽ via @touchlinedribble`,
            files: [file],
          });
          toast.success("Shared!");
        } catch (e: any) {
          if (e.name !== "AbortError") {
            await downloadBlob(blob, file.name);
            toast.success("Image downloaded — share it on Instagram!");
          }
        }
      } else {
        await downloadBlob(blob, file.name);
        toast.success("Image downloaded — share it on Instagram!");
      }
    } finally {
      setBusy(null);
    }
  };

  const handleTwitterShare = async () => {
    if (!cardRef.current) return;
    setBusy("tw");
    try {
      const blob = await captureCardAsBlob(cardRef.current);
      if (!blob) {
        toast.error("Failed to generate image");
        return;
      }

      const filename = `${clubName.toLowerCase().replace(/\s+/g, "-")}-report-card.png`;
      await downloadBlob(blob, filename);

      const tweetText = `${clubName} ${windowLabel} Transfer Report Card 📝⚽\n\nFull grades at touchlinedribble.com\n\n@touchlinedribble`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
        "_blank"
      );
      toast.success("Image downloaded — attach it to your tweet!");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3 justify-center">
      <button
        onClick={handleInstagramShare}
        disabled={!!busy}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all
          bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white
          hover:shadow-lg hover:shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy === "ig" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Instagram className="w-3.5 h-3.5" />
        )}
        Instagram
      </button>
      <button
        onClick={handleTwitterShare}
        disabled={!!busy}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all
          bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A]
          hover:shadow-lg hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy === "tw" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Twitter className="w-3.5 h-3.5" />
        )}
        Twitter / X
      </button>
      <button
        onClick={async () => {
          if (!cardRef.current) return;
          setBusy("ig"); // reuse loading state
          const blob = await captureCardAsBlob(cardRef.current);
          if (blob) {
            await downloadBlob(
              blob,
              `${clubName.toLowerCase().replace(/\s+/g, "-")}-report-card.png`
            );
            toast.success("PNG downloaded!");
          }
          setBusy(null);
        }}
        disabled={!!busy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all
          bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
          hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy && busy !== "tw" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Save
      </button>
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
  const cardCaptureRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      {/* CSS custom properties + keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --rc-paper-bg: #FFFDF7;
          --rc-fold-color: #e8e4dc;
          --rc-fold-shadow: #d4cfc5;
        }
        .dark {
          --rc-paper-bg: #111827;
          --rc-fold-color: #1f2937;
          --rc-fold-shadow: #0f172a;
        }

        @keyframes rcFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes rcBarGrow {
          from { width: 0%; }
        }

        @keyframes rcGradeStamp {
          0%   { opacity: 0; transform: scale(2.8) rotate(-12deg); }
          45%  { opacity: 1; transform: scale(0.92) rotate(3deg); }
          65%  { transform: scale(1.06) rotate(-1.5deg); }
          80%  { transform: scale(0.98) rotate(0.5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .rc-no-scrollbar::-webkit-scrollbar { display: none; }
        .rc-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

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
                <span className="ml-2 text-[#0F172A] dark:text-white font-black">
                  {data.clubs[activeSlide]?.club}
                </span>
              </p>
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-semibold text-[#94A3B8] dark:text-gray-500">
                  swipe →
                </p>
              </div>
            </div>

            {/* Carousel — one club per slide */}
            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory rc-no-scrollbar"
            >
              {data.clubs.map((club, idx) => (
                <div
                  key={club.club}
                  ref={(el) => {
                    slideRefs.current[idx] = el;
                  }}
                  className="flex-shrink-0 w-full snap-center"
                >
                  <ClubSlide
                    card={club}
                    windowLabel={data.window}
                    slideRef={(el: HTMLDivElement | null) => {
                      cardCaptureRefs.current[idx] = el;
                    }}
                  />
                  {/* Share buttons */}
                  <ShareButtons
                    cardRef={{ current: cardCaptureRefs.current[idx] ?? null }}
                    clubName={club.club}
                    windowLabel={data.window}
                  />
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 pb-5 pt-3">
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
                      <span
                        className={`font-black text-white dark:text-[#0F172A] ${
                          isActive ? "text-[10px]" : "text-[8px]"
                        }`}
                      >
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
