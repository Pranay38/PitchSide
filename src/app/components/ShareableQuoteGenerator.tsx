"use client";

import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { Download, Copy, Check, Quote } from "lucide-react";

interface ShareableQuoteGeneratorProps {
  content: string; // The full article content or HTML
  author: string;
  defaultQuote?: string; // If one is already selected
}

export function ShareableQuoteGenerator({ content, author, defaultQuote }: ShareableQuoteGeneratorProps) {
  const [quote, setQuote] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultQuote) {
      setQuote(defaultQuote);
    } else {
      // Auto-extract
      const textOnly = content.replace(/<[^>]+>/g, " "); // Basic strip HTML
      const paragraphs = textOnly.split(/\n+/).map(p => p.trim()).filter(p => p.length > 50);
      
      // Heuristic: paragraph with stats/numbers or longest sentence
      let bestQuote = "";
      let maxScore = -1;
      
      paragraphs.forEach(p => {
        let score = 0;
        if (/\d+/.test(p)) score += 5; // Has numbers
        if (/!/.test(p)) score += 3; // Has exclamation
        score += p.length / 100; // Prefer longer but not too long
        
        if (score > maxScore && p.length < 300) {
          maxScore = score;
          bestQuote = p;
        }
      });
      
      if (!bestQuote && paragraphs.length > 0) {
        bestQuote = paragraphs[0];
      }
      
      setQuote(bestQuote.slice(0, 250) + (bestQuote.length > 250 ? "..." : ""));
    }
  }, [content, defaultQuote]);

  const handleDownload = async (format: "twitter" | "instagram") => {
    if (!cardRef.current) return;
    
    // Temporarily set dimensions
    const originalWidth = cardRef.current.style.width;
    const originalHeight = cardRef.current.style.height;
    
    if (format === "instagram") {
      cardRef.current.style.width = "1080px";
      cardRef.current.style.height = "1920px";
    } else {
      cardRef.current.style.width = "1200px";
      cardRef.current.style.height = "675px";
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0a0a0a"
      });
      
      const link = document.createElement("a");
      link.download = `quote-${format}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      // Restore dimensions
      cardRef.current.style.width = originalWidth;
      cardRef.current.style.height = originalHeight;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`"${quote}" - ${author}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Selected Quote</label>
        <textarea 
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="w-full p-3 bg-background border border-border rounded-lg"
          rows={3}
        />
      </div>

      <div className="overflow-auto border border-border rounded-xl p-4 bg-muted/30 flex justify-center">
        <div 
          ref={cardRef}
          className="relative overflow-hidden flex flex-col justify-center p-12 shrink-0 bg-[#0a0a0a]"
          style={{ width: "1200px", height: "675px", transform: "scale(0.5)", transformOrigin: "top left", marginBottom: "-337px" }}
        >
          <div className="absolute top-8 left-8 text-[#00ff87]/20 pointer-events-none">
            <Quote className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <blockquote className="font-serif font-bold text-5xl text-white leading-tight mb-10">
              "{quote}"
            </blockquote>
            
            <p className="text-xl font-bold text-[#00ff87] uppercase tracking-widest">
              — {author}
            </p>
          </div>
          
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <span className="text-white/50 font-bold tracking-widest text-lg">THE TOUCHLINE DRIBBLE</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => handleDownload("twitter")}
          className="inline-flex items-center gap-2 bg-[#16A34A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#15803d]"
        >
          <Download className="w-4 h-4" />
          Download for Twitter
        </button>
        <button 
          onClick={() => handleDownload("instagram")}
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          <Download className="w-4 h-4" />
          Download for Instagram
        </button>
        <button 
          onClick={handleCopy}
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium"
        >
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {isCopied ? "Copied!" : "Copy Text"}
        </button>
      </div>
    </div>
  );
}
