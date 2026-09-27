import { useState, useRef, useEffect } from "react";
import { X, Download, Copy, Share2, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { articleShareUrl } from "../lib/shareLinks";
import { trackContentEvent } from "../lib/analytics";
import type { BlogPost } from "../data/posts";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
}

export function ImageShareModal({ isOpen, onClose, post }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<'portrait' | 'square'>('portrait');
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], select'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [isOpen, onClose]);
  
  if (!isOpen || !post) return null;

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      setIsGenerating(true);
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High resolution for Instagram (e.g. 400px * 3 = 1200px width)
        useCORS: true,
        backgroundColor: "#0F172A", // Dark theme background
        logging: false,
      });

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png", 1.0);
      });
    } catch (err) {
      console.error("Custom image generation failed:", err);
      toast.error("Failed to generate image");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `touchline-dribble-${post.slug || "insight"}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    trackContentEvent("share_download", { article_id: post.id, placement: "quote_card", shape });
    toast.success("Image downloaded!");
  };

  const handleNativeShare = async () => {
    const blob = await generateImage();
    if (!blob) return;

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], "tactical-insight.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: post.title,
            text: `${post.editorial?.shareQuote || post.title} ${articleShareUrl(post, "reader_share", "quote_card")}`,
            files: [file],
          });
          toast.success("Shared successfully!");
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            toast.error("Failed to share to apps.");
          }
        }
      } else {
        handleDownload(); // Fallback
      }
    } else {
      handleDownload(); // Fallback for desktop/unsupported browsers
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Share this argument" className="bg-[#1E293B] rounded-3xl w-full max-w-lg border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0F172A]">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share this argument
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Download a quote card or share the article link</p>
          </div>
          <button 
            aria-label="Close sharing dialog"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 px-4 py-3 text-white"><label className="text-sm">Image format<select value={shape} onChange={e => setShape(e.target.value as typeof shape)} className="ml-3 rounded border border-gray-600 bg-slate-900 p-2"><option value="portrait">Portrait</option><option value="square">Square</option></select></label></div>
        {/* Content Preview Container */}
        <div className="p-6 overflow-y-auto flex-1 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-900/50">
          {/* THE CAPTURE TARGET - explicitly sized to mimic a mobile screen 9:16 */}
          <div 
            ref={cardRef}
            className={`relative w-full max-w-[360px] shrink-0 ${shape === "square" ? "aspect-square" : "aspect-[9/16]"} bg-[#0B1120] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl isolate`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-[40%] bg-gradient-to-b from-[#16A34A]/30 to-transparent mix-blend-overlay" />
            <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-[#16A34A]/20 blur-[80px] rounded-full" />
            <div className="absolute -bottom-[50px] -left-[50px] w-[250px] h-[250px] bg-blue-500/10 blur-[80px] rounded-full" />
            
            {/* Outline border */}
            <div className="absolute inset-0 border border-white/10 rounded-[2rem] z-10 pointer-events-none" />

            {/* Inner Content */}
            <div className="relative z-20 flex flex-col h-full p-5">
              
              {/* Header Branding */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#16A34A] to-emerald-400 flex items-center justify-center">
                  <span className="font-black text-white text-xs">TD</span>
                </div>
                <span className="font-black tracking-tight text-white/90 text-sm">
                  THE TOUCHLINE DRIBBLE
                </span>
              </div>

              {/* Tag */}
              {post.club && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1.5 bg-white/5 border border-white/10 text-[#16A34A] rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {post.club}
                  </span>
                </div>
              )}

              {/* Main Text */}
              <h1 
                className="font-black text-white leading-[1.15] tracking-tight mb-6 mt-auto"
                style={{ fontSize: shape === 'square' ? '18px' : post.title.length > 50 ? '28px' : '34px', fontFamily: "'Outfit', sans-serif" }}
              >
                {post.title}
              </h1>

              {/* Body Text */}
              <div className="mb-auto">
                <div className="w-10 h-1 bg-[#16A34A] rounded-full mb-6" />
                <p className="text-gray-300 text-sm leading-relaxed font-medium line-clamp-5">
                  &ldquo;{post.editorial?.shareQuote || post.editorial?.verdict || post.excerpt}&rdquo;
                </p>
              </div>

              {/* Footer CTA */}
              <div className="pt-8 border-t border-white/10 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest">
                  <Zap className="w-4 h-4 text-[#16A34A]" />
                  Read the full argument
                </div>
                <div className="text-[#16A34A] font-bold text-[10px]">
                  thetouchlinedribble.in
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="button" className="mx-4 my-2 rounded-xl border border-gray-600 p-3 text-white flex items-center justify-center gap-2" onClick={async () => {
          try { await navigator.clipboard.writeText(articleShareUrl(post, 'reader_share', 'quote_card')); trackContentEvent('share_click', { article_id: post.id, platform: 'copy', placement: 'quote_card' }); toast.success('Article link copied'); }
          catch { toast.error('Could not copy the link. Use your browser to copy the article address.'); }
        }}><Copy className="h-4 w-4" />Copy article link</button>
        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-800 bg-[#0F172A] flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleNativeShare}
            disabled={isGenerating}
            className="flex-1 py-3.5 px-4 bg-[#16A34A] hover:bg-[#15803d] text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#16A34A]/20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
            Share to Socials
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="py-3.5 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
