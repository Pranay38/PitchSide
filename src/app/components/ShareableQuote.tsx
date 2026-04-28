import React from "react";
import { Twitter, Quote } from "lucide-react";

interface ShareableQuoteProps {
  quote: string;
  author?: string;
  url?: string;
}

export function ShareableQuote({ quote, author, url }: ShareableQuoteProps) {
  const handleTweet = () => {
    const text = encodeURIComponent(`"${quote}"\n\n${author ? `- ${author}` : ''}`);
    const shareUrl = encodeURIComponent(url || (typeof window !== "undefined" ? window.location.href : ""));
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, "_blank");
  };

  return (
    <div className="relative my-10 group overflow-hidden rounded-[2rem] border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-[#0F172A] dark:to-[#0B1120] p-8 md:p-10 shadow-sm transition-all hover:shadow-xl hover:border-[#16A34A]/30">
      <div className="absolute top-4 left-6 text-[#16A34A]/10 pointer-events-none">
        <Quote className="w-16 h-16 md:w-24 md:h-24" />
      </div>
      
      <div className="relative z-10">
        <blockquote className="font-outfit text-xl md:text-3xl font-black text-[#0F172A] dark:text-white leading-tight mb-6">
          "{quote}"
        </blockquote>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {author && (
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              — {author}
            </p>
          )}
          
          <button 
            onClick={handleTweet}
            className="inline-flex items-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <Twitter className="w-4 h-4" />
            Click to Tweet
          </button>
        </div>
      </div>
    </div>
  );
}
