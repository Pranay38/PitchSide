import React from "react";
import { Quote } from "lucide-react";

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
    <div className="relative my-10 group overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-10 shadow-sm transition-all hover:shadow-xl hover:border-primary/30">
      <div className="absolute top-4 left-6 text-[#16A34A]/10 pointer-events-none">
        <Quote className="w-16 h-16 md:w-24 md:h-24" />
      </div>
      
      <div className="relative z-10">
        <blockquote className="font-headline font-bold text-xl md:text-3xl text-foreground leading-tight mb-6">
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
            className="inline-flex items-center gap-2 bg-foreground/10 hover:bg-foreground hover:text-background text-foreground px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            Share on X
          </button>
        </div>
      </div>
    </div>
  );
}
