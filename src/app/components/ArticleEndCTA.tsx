"use client";

import { Instagram, Twitter } from "lucide-react";
import { SupportBanner } from "./SupportBanner";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface ArticleEndCTAProps {
  authorName: string;
}

export function ArticleEndCTA({ authorName }: ArticleEndCTAProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("loading");
    // Simulate API call for newsletter
    setTimeout(() => {
      setStatus("success");
      toast.success("Thanks for subscribing!");
      setEmail("");
    }, 1000);
  };

  return (
    <div className="mt-16 mb-12 border border-border rounded-[2rem] overflow-hidden bg-card">
      {/* 1. Author Section */}
      <div className="p-8 sm:p-10 border-b border-border flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border border-border">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=16A34A&color=fff&size=160&bold=true`} 
            alt={authorName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-1">Written By</p>
          <h3 className="text-xl font-headline font-bold text-foreground mb-2">{authorName}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            Founder and lead writer at The Touchline Dribble. Obsessed with tactical nuances, data-driven scouting, and the beautiful game.
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <a href="https://twitter.com/thetouchlinedribble" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://instagram.com/thetouchlinedribble" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Newsletter Nudge */}
      <div className="p-8 sm:p-10 border-b border-border bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h4 className="text-xl font-headline font-bold text-foreground mb-2">Enjoyed this piece?</h4>
          <p className="text-muted-foreground text-sm mb-6">
            Join thousands of football fans who get our sharpest tactical analysis and weekend previews delivered straight to their inbox every Friday.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Your email address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70 whitespace-nowrap"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Support Card */}
      <div className="p-4 sm:p-6 bg-muted/10">
        <SupportBanner variant="compact" />
      </div>
    </div>
  );
}
