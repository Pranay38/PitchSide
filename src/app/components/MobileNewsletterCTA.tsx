"use client";

import { useState, useEffect } from "react";
import { Send, X } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "../hooks/useUserPreferences";

export function MobileNewsletterCTA() {
  const { newsletterOptIn, setNewsletterOptIn, loading } = useUserPreferences();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // Default to true to prevent hydration mismatch, set false in effect

  useEffect(() => {
    // Check if dismissed in last 7 days
    const checkDismissal = () => {
      const dismissDate = localStorage.getItem("pitchside_newsletter_dismissed");
      if (dismissDate) {
        const daysSince = (new Date().getTime() - new Date(dismissDate).getTime()) / (1000 * 3600 * 24);
        if (daysSince < 7) {
          return true;
        } else {
          localStorage.removeItem("pitchside_newsletter_dismissed");
        }
      }
      return false;
    };

    if (!checkDismissal()) {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    if (dismissed || loading || newsletterOptIn) return;

    const handleScroll = () => {
      // Only run on mobile
      if (!window.matchMedia('(max-width: 768px)').matches) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      if (documentHeight <= 0) return;

      const currentScroll = window.scrollY;
      const scrollPercentage = (currentScroll / documentHeight) * 100;
      
      if (scrollPercentage > 50 && !isVisible) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissed, loading, newsletterOptIn, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem("pitchside_newsletter_dismissed", new Date().toISOString());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@") || submitting) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), clubPreferences: [] }),
        credentials: "same-origin",
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof payload.error === "string" ? payload.error : "Could not save your subscription.",
        );
      }

      setNewsletterOptIn(true);
      toast.success(payload.alreadySubscribed ? "You're already subscribed." : "Subscribed.");
      setIsVisible(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  if (dismissed || loading || newsletterOptIn || !isVisible) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 769px) {
          .mobile-newsletter-cta { display: none !important; }
        }
      `}} />
      <div className="mobile-newsletter-cta fixed bottom-0 left-0 right-0 z-[50] p-4 bg-[#0F172A] border-t border-[#16A34A]/20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform transition-transform duration-300 translate-y-0">
        <button 
          onClick={handleDismiss}
          className="absolute -top-3 -right-1 p-1 bg-[#1E293B] border border-white/10 rounded-full text-white/60 hover:text-white"
          aria-label="Dismiss newsletter signup"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-white text-sm font-bold mb-3">
          Get tactical breakdowns in your inbox →
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#4ade80] focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#16A34A] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#15803d] disabled:opacity-60"
          >
            {submitting ? "..." : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </>
  );
}
