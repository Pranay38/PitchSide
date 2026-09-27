"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trackContentEvent } from "../lib/analytics";
import { Link2, Share2, MessageCircle, Check } from "lucide-react";

interface ShareBarProps {
  title: string;
  url: string;
  className?: string;
}

export const ShareBar = ({ title, url, className = "" }: ShareBarProps) => {
  const [copied, setCopied] = useState(false);
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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Could not copy the link. Copy the article address from your browser.");
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(title);
    const urlString = encodeURIComponent(trackedUrl("x"));
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${urlString}&via=TouchlineDribbl`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title} ${trackedUrl("whatsapp")}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: trackedUrl("reader_share") });
      } catch (err) {
        console.error("Error sharing", err);
      }
    }
  };

  const btnClass = "w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 hover:border-[#16A34A]/40 hover:shadow-md transition-all duration-200 text-[#475569] dark:text-gray-400";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button 
        onClick={handleCopyLink} 
        className={copied ? "w-10 h-10 rounded-full flex items-center justify-center border hover:border-[#16A34A]/40 hover:shadow-md transition-all duration-200 bg-[#16A34A] text-white border-[#16A34A]" : btnClass}
        title="Copy Link"
      >
        {copied ? <Check size={18} /> : <Link2 size={18} />}
      </button>

      <button onClick={handleTwitterShare} className={btnClass} title="Share to X">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      <button onClick={handleWhatsAppShare} className={btnClass} title="Share to WhatsApp" style={{ color: '#25D366' }}>
        <MessageCircle size={18} />
      </button>

      {typeof navigator !== 'undefined' && "share" in navigator && (
        <button onClick={handleNativeShare} className={btnClass} title="Share">
          <Share2 size={18} />
        </button>
      )}
    </div>
  );
};
