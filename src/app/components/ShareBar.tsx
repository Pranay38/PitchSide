"use client";

import { useState } from "react";
import { Link2, Share2, MessageCircle, Check } from "lucide-react";

interface ShareBarProps {
  title: string;
  url: string;
  excerpt?: string;
  className?: string;
}

export const ShareBar = ({ title, url, excerpt, className = "" }: ShareBarProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(excerpt ? `${excerpt}\n\n` : `${title}\n\n`);
    const urlString = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${urlString}`, '_blank');
  };

  const handleRedditShare = () => {
    const titleString = encodeURIComponent(title);
    const urlString = encodeURIComponent(url);
    window.open(`https://reddit.com/r/soccer/submit?url=${urlString}&title=${titleString}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title} - ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
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

      <button onClick={handleRedditShare} className={btnClass} title="Share to Reddit" style={{ color: '#FF4500' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12 6.627 0 12-5.373 12-12C24 5.373 18.627 0 12 0zm5.127 9.873c-.63 0-1.187.357-1.464.887l-3.327-1.57c.05-.187.082-.38.082-.577 0-1.243-1.01-2.253-2.253-2.253-1.244 0-2.253 1.01-2.253 2.253 0 .197.032.39.082.577L4.667 10.76c-.277-.53-.834-.887-1.464-.887-1.243 0-2.253 1.01-2.253 2.253 0 1.244 1.01 2.254 2.253 2.254.127 0 .25-.015.37-.043l1.838 3.52c.877 1.68 2.65 2.8 4.713 2.8s3.837-1.12 4.714-2.8l1.837-3.52c.12.028.243.043.37.043 1.243 0 2.253-1.01 2.253-2.254 0-1.243-1.01-2.253-2.253-2.253zM10.165 8.62c0-.503.41-.913.913-.913.504 0 .914.41.914.913 0 .504-.41.914-.914.914-.503 0-.913-.41-.913-.914zm-4.7 3.506c-.503 0-.913-.41-.913-.913 0-.504.41-.914.913-.914.504 0 .914.41.914.914 0 .503-.41.913-.914.913zm6.657 4.194c-1.554.783-3.136.634-4.24-.035-.205-.124-.266-.39-.14-.593.125-.204.39-.267.594-.143.766.465 1.954.58 3.12-.007.214-.108.473-.02.58.193.107.214.02.473-.193.58h-.002a.852.852 0 01-.12.005zm1.517-4.194c-.504 0-.914-.41-.914-.913 0-.504.41-.914.914-.914.503 0 .913.41.913.914 0 .503-.41.913-.913.913z" />
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
