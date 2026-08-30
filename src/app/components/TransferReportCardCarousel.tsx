"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, GraduationCap, Loader2, X } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { getClubByName } from "../data/clubs";
import { getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import type { TransferReportCards } from "../lib/transferReportCards";
import type { ClubReportCard, GradeEntry } from "./TransferReportCard";

const SUBJECTS: { key: keyof ClubReportCard["grades"]; label: string }[] = [
  { key: "incomings", label: "INCOMINGS" },
  { key: "outgoings", label: "OUTGOINGS" },
  { key: "valueForMoney", label: "VALUE FOR MONEY" },
  { key: "squadBalance", label: "SQUAD BALANCE" },
];

const gradeTone = (grade: string) => {
  if (grade.startsWith("A")) return "#18854b";
  if (grade.startsWith("B")) return "#487f25";
  if (grade.startsWith("C")) return "#b66a16";
  return "#bc3434";
};

const score = (grade: string) => ({ "A+": 10, A: 9, "A-": 8.5, "B+": 8, B: 7, "B-": 6.5, "C+": 6, C: 5.5, "C-": 5, "D+": 4.5, D: 4, "D-": 3, F: 2 }[grade] ?? 5);
const TEACHER_NOTE_LIMIT = 145;

function formatTeacherNote(note: string) {
  if (note.length <= TEACHER_NOTE_LIMIT) return note;
  const trimmed = note.slice(0, TEACHER_NOTE_LIMIT - 1);
  return `${trimmed.slice(0, trimmed.lastIndexOf(" ")) || trimmed}...`;
}

export const InstagramTransferReportCard = forwardRef<HTMLDivElement, { card: ClubReportCard; windowLabel: string; season: string; index?: number; animated?: boolean; showWatermark?: boolean }>(({ card, windowLabel, season, index = 0, animated = false, showWatermark = false }, ref) => {
  const overall = card.grades.overall;
  const stampColor = gradeTone(overall.grade);
  const clubData = getClubByName(card.club);
  return <div ref={ref} className="report-instagram-card relative aspect-[4/5] w-full overflow-hidden bg-[#fffdf7] text-[#172030]" style={{ fontFamily: "Georgia, serif" }}>
    <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 47px, rgba(109, 154, 199, 0.22) 48px, transparent 49px)" }} />
    <div className="absolute inset-y-0 left-[13.5%] w-px bg-[#e96f6f]/70" />
    <div className="absolute left-0 right-0 top-0 h-3 bg-[#172030]" />
    <div className="relative flex h-full flex-col px-[17%] pb-[5%] pt-[7%]">
      <div className="flex items-start justify-between gap-3 border-b-2 border-[#172030] pb-4"><div><div className="mb-2 flex items-center gap-2 text-[9px] font-bold tracking-[0.18em] text-[#617083]"><GraduationCap className="h-[1em] w-[1em]" /> {windowLabel.toUpperCase()} / {season}</div><h3 className="text-[25px] font-black leading-[0.92]">TRANSFER<br />REPORT</h3></div><span className="mt-1 border-2 border-[#172030] px-2 py-1 text-[9px] font-black tracking-[0.14em]">TERM {index + 1}</span></div>
      <div className="flex items-end justify-between gap-4 py-3"><div className="flex items-end gap-3"><div><p className="text-[9px] font-bold tracking-[0.2em] text-[#687588]">CLUB</p><p className="text-[25px] font-black leading-none">{card.club}</p><p className="mt-1 text-[11px] font-bold italic text-[#607082]">{card.league}</p></div>{clubData?.logo && <img src={clubData.logo} alt="" crossOrigin="anonymous" className="mb-1 h-12 w-12 object-contain" />}</div><div className={`${animated ? "report-stamp" : ""} relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full border-[3px]`} style={{ borderColor: stampColor, color: stampColor }}><span className="absolute inset-1 rounded-full border border-current opacity-70" /><span className="relative text-[40px] font-black leading-none" style={{ fontFamily: "Comic Sans MS, Chalkboard, cursive" }}>{overall.grade}</span></div></div>
      <div className="border-y-2 border-[#172030]">{SUBJECTS.map(({ key, label }) => { const entry = card.grades[key] as GradeEntry; const mark = score(entry.grade); return <div key={key} className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#172030]/25 py-2 last:border-b-0"><div><div className="flex items-baseline justify-between gap-2"><p className="text-[10px] font-black tracking-[0.1em]">{label}</p><span className="text-[13px] font-bold text-[#687588]">{mark}/10</span><span className="text-[18px] font-black" style={{ color: gradeTone(entry.grade), fontFamily: "Comic Sans MS, Chalkboard, cursive" }}>{entry.grade}</span></div><div className="mt-1 h-[3px] bg-[#172030]/15"><div className={`${animated ? "report-mark" : ""} h-full origin-left`} style={{ width: `${mark * 10}%`, backgroundColor: gradeTone(entry.grade) }} /></div><p className="mt-1 line-clamp-1 text-[9px] leading-[1.25] text-[#344457]">{entry.comment}</p></div></div>; })}</div>
      <div className="mt-auto border-t-2 border-dashed border-[#172030]/45 pt-3"><p className="text-[9px] font-bold tracking-[0.18em] text-[#687588]">TEACHER'S NOTE</p><p className="mt-1 line-clamp-3 min-h-[50px] text-[12px] font-bold italic leading-[1.4]">&ldquo;{formatTeacherNote(card.teachersComment)}&rdquo;</p><div className="mt-3 grid grid-cols-3 border-t border-[#172030]/30 pt-2 text-center text-[10px] font-bold"><span>SPEND <b className="block text-[13px]">{card.totalSpend}</b></span><span>INCOME <b className="block text-[13px]">{card.totalIncome}</b></span><span>NET <b className="block text-[13px]">{card.netSpend}</b></span></div>{showWatermark && <p className="mt-3 text-center text-[8px] font-black tracking-[0.2em] text-[#64748b]">TOUCHLINE DRIBBLE</p>}</div>
    </div>
  </div>;
});
InstagramTransferReportCard.displayName = "InstagramTransferReportCard";

async function exportCard(element: HTMLElement, filename: string) {
  element.dataset.exporting = "true";
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const canvas = await html2canvas(element, { scale: 1080 / element.getBoundingClientRect().width, useCORS: true, backgroundColor: "#fffdf7", logging: false });
  delete element.dataset.exporting;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not create image");
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function TransferReportCardCarousel() {
  const [data, setData] = useState<TransferReportCards | null>(null); const [active, setActive] = useState(0); const [dismissed, setDismissed] = useState(false); const [downloading, setDownloading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null); const cards = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => { getSiteSettingsAsync().then((settings) => setData(settings.transferReportCards)).catch(() => toast.error("Could not load transfer report")); }, []);
  const go = useCallback((index: number) => { scroller.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" }); }, []);
  const onScroll = () => { const node = scroller.current; if (node) setActive(Math.round(node.scrollLeft / node.clientWidth)); };
  if (!data || !data.enabled || !data.clubs.length || dismissed) return null;
  const current = data.clubs[active] ?? data.clubs[0];
  return <section className="relative overflow-hidden border-y border-[#172030]/10 bg-[#eef3f4] py-10 dark:bg-[#0d1720]"><style>{`@keyframes report-stamp { 0%{transform:scale(2.1) rotate(-18deg);opacity:0} 65%{transform:scale(.88) rotate(4deg)} 100%{transform:scale(1) rotate(-5deg);opacity:1} } @keyframes report-mark { from{transform:scaleX(0)} to{transform:scaleX(1)} } .report-stamp{animation:report-stamp .65s cubic-bezier(.2,.9,.2,1) both} .report-mark{animation:report-mark .75s .18s ease-out both} .report-instagram-card[data-exporting="true"] .report-stamp,.report-instagram-card[data-exporting="true"] .report-mark{animation:none!important;transform:none!important} @media (prefers-reduced-motion: reduce){.report-stamp,.report-mark{animation:none}}`}</style><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[0.22em] text-[#16834b]">THE MARKBOOK</p><h2 className="mt-1 text-2xl font-black text-[#172030] dark:text-white sm:text-3xl">Transfer Report Cards</h2></div><button onClick={() => setDismissed(true)} aria-label="Hide transfer reports" className="grid h-9 w-9 place-items-center border border-[#172030]/15 bg-white text-[#172030] dark:bg-[#172030] dark:text-white"><X className="h-4 w-4" /></button></div><div ref={scroller} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none]">{data.clubs.map((club, index) => <div key={`${club.club}-${index}`} className="w-full shrink-0 snap-start px-[max(0px,calc((100%-430px)/2))]"><InstagramTransferReportCard ref={(node) => { cards.current[index] = node; }} card={club} windowLabel={data.window} season={data.season} index={index} animated={index === active} showWatermark /></div>)}</div><div className="mt-5 flex items-center justify-between gap-3"><div className="flex gap-2">{data.clubs.map((club, index) => <button key={club.club} aria-label={`Show ${club.club}`} onClick={() => go(index)} className={`h-2.5 w-2.5 rounded-full ${index === active ? "bg-[#16834b]" : "bg-[#172030]/20 dark:bg-white/25"}`} />)}</div><div className="flex items-center gap-2"><button onClick={() => go((active - 1 + data.clubs.length) % data.clubs.length)} aria-label="Previous club" className="grid h-10 w-10 place-items-center border border-[#172030]/15 bg-white text-[#172030] dark:bg-[#172030] dark:text-white"><ChevronLeft className="h-5 w-5" /></button><button onClick={() => go((active + 1) % data.clubs.length)} aria-label="Next club" className="grid h-10 w-10 place-items-center border border-[#172030]/15 bg-white text-[#172030] dark:bg-[#172030] dark:text-white"><ChevronRight className="h-5 w-5" /></button><button disabled={downloading} onClick={async () => { const card = cards.current[active]; if (!card) return; setDownloading(true); try { await exportCard(card, `${current.club.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-transfer-report.png`); toast.success("Instagram PNG downloaded"); } catch { toast.error("Could not export image"); } finally { setDownloading(false); } }} className="flex h-10 items-center gap-2 bg-[#16834b] px-4 text-xs font-black text-white disabled:opacity-60">{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} SAVE PNG</button></div></div></div></section>;
}
