"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { trackContentEvent } from "../lib/analytics";
import { AtSign, Check, ChevronDown, Copy, Link2, MessageCircle, Share2, X } from "lucide-react";

interface ShareBarProps {
  title: string;
  url: string;
  className?: string;
}

export const ShareBar = ({ title, url, className = "" }: ShareBarProps) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const trackedUrl = (source: string) => {
    const link = new URL(url, 'https://www.thetouchlinedribble.in');
    link.search = new URLSearchParams({ utm_source: source, utm_medium: 'social', utm_campaign: link.pathname.split('/').pop() || 'article', utm_content: 'article_share' }).toString();
    trackContentEvent('share_click', { destination: link.pathname, platform: source, placement: 'article' });
    return link.toString();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackedUrl("reader_share"));
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Could not copy the link. Copy the article address from your browser.");
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(title);
    const urlString = encodeURIComponent(trackedUrl("x"));
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${urlString}&via=TouchlineDribbl`, '_blank');
    setOpen(false);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title} ${trackedUrl("whatsapp")}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setOpen(false);
  };

  const handleFacebookShare = () => {
    const urlString = encodeURIComponent(trackedUrl("facebook"));
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${urlString}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleEmailShare = () => {
    const shareUrl = trackedUrl("email");
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Thought you might enjoy this: ${shareUrl}`)}`;
    setOpen(false);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: trackedUrl("reader_share") });
      } catch (err) {
        console.error("Error sharing", err);
      }
      setOpen(false);
    }
  };

  const menuItemClass = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
      >
        <Share2 className="h-4 w-4" />
        Share
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" aria-label="Share this post" className="absolute left-0 top-full z-50 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-black/20 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div>
              <p className="text-sm font-bold text-slate-950 dark:text-white">Share this post</p>
              <p className="mt-0.5 text-xs text-slate-500">Pass it on to a fellow fan.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close share menu" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <button type="button" role="menuitem" onClick={handleCopyLink} className={`${menuItemClass} ${copied ? "text-[#16A34A]" : ""}`}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button type="button" role="menuitem" onClick={handleTwitterShare} className={menuItemClass}>
            <span className="flex h-4 w-4 items-center justify-center text-xs font-black">𝕏</span>
            Share to X
          </button>
          <button type="button" role="menuitem" onClick={handleWhatsAppShare} className={`${menuItemClass} hover:text-[#25D366]`}>
            <MessageCircle className="h-4 w-4" />
            Share to WhatsApp
          </button>
          <button type="button" role="menuitem" onClick={handleFacebookShare} className={menuItemClass}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2] text-xs font-bold text-white">f</span>
            Share to Facebook
          </button>
          <button type="button" role="menuitem" onClick={handleEmailShare} className={menuItemClass}>
            <AtSign className="h-4 w-4" />
            Send by email
          </button>
          {canNativeShare && (
            <button type="button" role="menuitem" onClick={handleNativeShare} className={menuItemClass}>
              <Link2 className="h-4 w-4" />
              More sharing options
            </button>
          )}
        </div>
      )}
    </div>
  );
};
