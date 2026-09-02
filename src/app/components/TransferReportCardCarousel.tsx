"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, GraduationCap, Link2, Loader2, Share2, X } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { getClubByName } from "../data/clubs";
import { getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import type { TransferReportCards } from "../lib/transferReportCards";
import type { ClubReportCard, GradeEntry } from "./TransferReportCard";

/** Convert an external image URL to a base64 data URL to avoid CORS issues with html2canvas */
function useProxiedLogo(url: string | undefined): string | undefined {
  const [dataUrl, setDataUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!url) { setDataUrl(undefined); return; }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setDataUrl(canvas.toDataURL("image/png"));
        }
      } catch {
        // CORS tainted — fall back to original URL for on-screen display
        setDataUrl(url);
      }
    };
    img.onerror = () => { if (!cancelled) setDataUrl(url); };
    img.src = url;
    return () => { cancelled = true; };
  }, [url]);
  return dataUrl;
}

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
  const logoSrc = useProxiedLogo(clubData?.logo);
  return <div ref={ref} className="report-instagram-card relative w-full bg-[#fffdf7] text-[#172030]" style={{ fontFamily: "Georgia, serif", aspectRatio: "4 / 5" }}>
    <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 47px, rgba(109, 154, 199, 0.22) 48px, transparent 49px)" }} />
    <div className="absolute inset-y-0 left-[13.5%] w-px bg-[#e96f6f]/70" />
    <div className="absolute left-0 right-0 top-0 h-3 bg-[#172030]" />
    <div className="relative flex h-full flex-col px-[17%] pb-[5%] pt-[7%]">
      <div className="flex items-start justify-between gap-3 border-b-2 border-[#172030] pb-3"><div><div className="mb-1.5 flex items-center gap-2 text-[9px] font-bold tracking-[0.18em] text-[#617083]"><GraduationCap className="h-[1em] w-[1em]" /> {windowLabel.toUpperCase()} / {season}</div><h3 className="text-[22px] font-black leading-[0.92]">TRANSFER<br />REPORT</h3></div><span className="mt-1 border-2 border-[#172030] px-2 py-1 text-[9px] font-black tracking-[0.14em]">TERM {index + 1}</span></div>
      <div className="flex items-end justify-between gap-4 py-2.5"><div className="flex items-end gap-3"><div><p className="text-[9px] font-bold tracking-[0.2em] text-[#687588]">CLUB</p><p className="text-[22px] font-black leading-none">{card.club}</p><p className="mt-1 text-[10px] font-bold italic text-[#607082]">{card.league}</p></div>{logoSrc && <img src={logoSrc} alt="" className="mb-1 h-12 w-12 object-contain" />}</div><div className={`${animated ? "report-stamp" : ""} relative grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full border-[3px]`} style={{ borderColor: stampColor, color: stampColor }}><span className="absolute inset-1 rounded-full border border-current opacity-70" /><span className="relative text-[36px] font-black leading-none" style={{ fontFamily: "Comic Sans MS, Chalkboard, cursive" }}>{overall.grade}</span></div></div>
      <div className="border-y-2 border-[#172030]">{SUBJECTS.map(({ key, label }) => { const entry = card.grades[key] as GradeEntry; const mark = score(entry.grade); return <div key={key} className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#172030]/25 py-1.5 last:border-b-0"><div><div className="flex items-baseline justify-between gap-2"><p className="text-[10px] font-black tracking-[0.1em]">{label}</p><span className="text-[12px] font-bold text-[#687588]">{mark}/10</span><span className="text-[17px] font-black" style={{ color: gradeTone(entry.grade), fontFamily: "Comic Sans MS, Chalkboard, cursive" }}>{entry.grade}</span></div><div className="mt-0.5 h-[3px] bg-[#172030]/15"><div className={`${animated ? "report-mark" : ""} h-full origin-left`} style={{ width: `${mark * 10}%`, backgroundColor: gradeTone(entry.grade) }} /></div><p className="mt-0.5 line-clamp-2 text-[9px] leading-[1.3] text-[#344457]">{entry.comment}</p></div></div>; })}</div>
      <div className="mt-auto border-t-2 border-dashed border-[#172030]/45 pt-2.5"><p className="text-[9px] font-bold tracking-[0.18em] text-[#687588]">TEACHER'S NOTE</p><p className="mt-1 line-clamp-3 min-h-[40px] text-[11px] font-bold italic leading-[1.4]">&ldquo;{formatTeacherNote(card.teachersComment)}&rdquo;</p><div className="mt-2.5 grid grid-cols-3 border-t border-[#172030]/30 pt-2 text-center text-[10px] font-bold"><span>SPEND <b className="block text-[13px]">{card.totalSpend}</b></span><span>INCOME <b className="block text-[13px]">{card.totalIncome}</b></span><span>NET <b className="block text-[13px]">{card.netSpend}</b></span></div>{showWatermark && <p className="mt-2.5 text-center text-[8px] font-black tracking-[0.2em] text-[#64748b]">TOUCHLINE DRIBBLE</p>}</div>
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


const SITE_URL = "https://www.thetouchlinedribble.in";

function buildShareText(club: string, grade: string, window: string) {
  return `${club} gets a ${grade} on their ${window} Transfer Report Card 📋\n\nFull breakdown on The Touchline Dribble 👇\n${SITE_URL}`;
}

export function TransferReportCardCarousel() {
  const [data, setData] = useState<TransferReportCards | null>(null); const [active, setActive] = useState(0); const [dismissed, setDismissed] = useState(false); const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null); const cards = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => { getSiteSettingsAsync().then((settings) => setData(settings.transferReportCards)).catch(() => toast.error("Could not load transfer report")); }, []);
  const go = useCallback((index: number) => { scroller.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" }); }, []);
  const onScroll = () => { const node = scroller.current; if (node) setActive(Math.round(node.scrollLeft / node.clientWidth)); };
  if (!data || !data.enabled || !data.clubs.length || dismissed) return null;
  const current = data.clubs[active] ?? data.clubs[0];
  const shareText = buildShareText(current.club, current.grades.overall.grade, data.window);

  const copyLink = async () => {
    await navigator.clipboard.writeText(SITE_URL);
    toast.success("Link copied!");
    setShareOpen(false);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try { await navigator.share({ title: `${current.club} Transfer Report Card`, text: shareText, url: SITE_URL }); } catch { /* user cancelled */ }
    setShareOpen(false);
  };

  const shareToX = () => {
    const text = encodeURIComponent(`${current.club} gets a ${current.grades.overall.grade} on their ${data.window} Transfer Report Card 📋\n\nFull breakdown 👇`);
    const url = encodeURIComponent(SITE_URL);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=550,height=420");
    setShareOpen(false);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareOpen(false);
  };

  return <section className="relative overflow-hidden border-y border-[#172030]/10 bg-[#eef3f4] py-10 dark:bg-[#0d1720]"><style>{`@keyframes report-stamp { 0%{transform:scale(2.1) rotate(-18deg);opacity:0} 65%{transform:scale(.88) rotate(4deg)} 100%{transform:scale(1) rotate(-5deg);opacity:1} } @keyframes report-mark { from{transform:scaleX(0)} to{transform:scaleX(1)} } .report-stamp{animation:report-stamp .65s cubic-bezier(.2,.9,.2,1) both} .report-mark{animation:report-mark .75s .18s ease-out both} .report-instagram-card[data-exporting="true"] .report-stamp,.report-instagram-card[data-exporting="true"] .report-mark{animation:none!important;transform:none!important} @media (prefers-reduced-motion: reduce){.report-stamp,.report-mark{animation:none}}`}</style><div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-black tracking-[0.22em] text-[#16834b]">THE MARKBOOK</p><h2 className="mt-1 text-2xl font-black text-[#172030] dark:text-white sm:text-3xl">Transfer Report Cards</h2></div><button onClick={() => setDismissed(true)} aria-label="Hide transfer reports" className="grid h-9 w-9 place-items-center border border-[#172030]/15 bg-white text-[#172030] dark:bg-[#172030] dark:text-white"><X className="h-4 w-4" /></button></div><div ref={scroller} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none]">{data.clubs.map((club, index) => <div key={`${club.club}-${index}`} className="w-full shrink-0 snap-start px-[max(0px,calc((100%-430px)/2))]"><InstagramTransferReportCard ref={(node) => { cards.current[index] = node; }} card={club} windowLabel={data.window} season={data.season} index={index} animated={index === active} showWatermark /></div>)}</div><div className="mt-5 flex items-center justify-between gap-3"><div className="flex gap-2">{data.clubs.map((club, index) => <button key={club.club} aria-label={`Show ${club.club}`} onClick={() => go(index)} className={`h-2.5 w-2.5 rounded-full ${index === active ? "bg-[#16834b]" : "bg-[#172030]/20 dark:bg-white/25"}`} />)}</div><div className="flex items-center gap-2"><button onClick={() => go((active - 1 + data.clubs.length) % data.clubs.length)} aria-label="Previous club" className="grid h-10 w-10 place-items-center border border-[#172030]/15 bg-white text-[#172030] dark:bg-[#172030] dark:text-white"><ChevronLeft className="h-5 w-5" /></button><button onClick={() => go((active + 1) % data.clubs.length)} aria-label="Next club" className="grid h-10 w-10 place-items-center border border-[#172030]/15 bg-white text-[#172030] dark:bg-[#172030] dark:text-white"><ChevronRight className="h-5 w-5" /></button><button disabled={downloading} onClick={async () => { const card = cards.current[active]; if (!card) return; setDownloading(true); try { await exportCard(card, `${current.club.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-transfer-report.png`); toast.success("Instagram PNG downloaded"); } catch { toast.error("Could not export image"); } finally { setDownloading(false); } }} className="flex h-10 items-center gap-2 bg-[#16834b] px-4 text-xs font-black text-white disabled:opacity-60">{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} SAVE PNG</button>
    {/* Share Dropdown */}
    <div className="relative">
      <button onClick={() => setShareOpen(!shareOpen)} aria-label="Share report card" className="grid h-10 w-10 place-items-center border border-[#172030]/15 bg-white text-[#172030] dark:bg-[#172030] dark:text-white"><Share2 className="h-4 w-4" /></button>
      {shareOpen && <>
        <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
        <div className="absolute bottom-full right-0 z-50 mb-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-[#172030]">
          <button onClick={shareToX} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[#172030] transition-colors hover:bg-gray-50 dark:text-white dark:hover:bg-white/5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            Post on X
          </button>
          <button onClick={shareToWhatsApp} className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-[#172030] transition-colors hover:bg-gray-50 dark:border-gray-700/50 dark:text-white dark:hover:bg-white/5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            WhatsApp
          </button>
          <button onClick={copyLink} className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-[#172030] transition-colors hover:bg-gray-50 dark:border-gray-700/50 dark:text-white dark:hover:bg-white/5">
            <Link2 className="h-4 w-4" />
            Copy Link
          </button>
          {typeof navigator !== "undefined" && navigator.share && <button onClick={handleNativeShare} className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-[#172030] transition-colors hover:bg-gray-50 dark:border-gray-700/50 dark:text-white dark:hover:bg-white/5">
            <Share2 className="h-4 w-4" />
            More...
          </button>}
        </div>
      </>}
    </div>
  </div></div></div></section>;
}

