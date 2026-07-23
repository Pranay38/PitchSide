"use client";

import React, { useState, useEffect } from "react";
import { Mail, X, FileText, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { toast } from "sonner";

export function InnerCircleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const CLUBS = ["Arsenal", "Chelsea", "Liverpool", "Man City", "Man United", "Spurs", "Real Madrid", "Barcelona"];

  const toggleClub = (club: string) => {
    setSelectedClubs((prev) =>
      prev.includes(club) ? prev.filter((c) => c !== club) : [...prev, club]
    );
  };
  const { newsletterOptIn, setNewsletterOptIn, loading } = useUserPreferences();

  useEffect(() => {
    // Only show if they haven't opted in yet
    if (loading || newsletterOptIn) return;

    // Has it been dismissed recently?
    const dismissed = localStorage.getItem("pitchside_modal_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 86400000 * 7) {
      return; // Wait 7 days before showing again if dismissed
    }

    // Show after 15 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [loading, newsletterOptIn]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("pitchside_modal_dismissed", Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), clubPreferences: selectedClubs }),
      });
      
      if (!res.ok) throw new Error("Failed to subscribe");
      
      setNewsletterOptIn(true);
      setSuccess(true);
      toast.success("Welcome to the Inner Circle!");
      
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      toast.error("Could not complete subscription. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-[#16A34A]/20 bg-gradient-to-br from-[#0F172A] via-[#0B1B2F] to-[#10203A] shadow-2xl animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          {!success ? (
            <>
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#16A34A]/20 flex items-center justify-center border border-[#16A34A]/30">
                  <FileText className="w-8 h-8 text-[#16A34A]" />
                </div>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black font-outfit text-center text-white mb-4">
                Unlock the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16A34A] to-emerald-300">Inner Circle</span>
              </h2>
              
              <p className="text-gray-400 text-center text-sm md:text-base leading-relaxed mb-8">
                Join 5,000+ tactical nerds. Get our exclusive deep-dive tactical analysis email every Friday. No fluff, just pure football intelligence.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#16A34A] transition-colors"
                />
                
                <div className="mt-1 mb-2">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider text-left">Optional: Select your clubs</p>
                  <div className="flex flex-wrap gap-2">
                    {CLUBS.map((club) => (
                      <button
                        key={club}
                        type="button"
                        onClick={() => toggleClub(club)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 border ${
                          selectedClubs.includes(club)
                            ? "bg-[#16A34A]/20 border-[#16A34A] text-[#4ade80]"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {club}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803d] text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(22,163,74,0.5)] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Send className="w-4 h-4" /> Join the Inner Circle
                    </>
                  )}
                </button>
              </form>
              <p className="text-center text-xs text-gray-500 mt-4">
                No spam. Unsubscribe at any time.
              </p>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center text-center">
              <CheckCircle2 className="w-16 h-16 text-[#16A34A] mb-4 animate-bounce" />
              <h2 className="text-2xl font-black font-outfit text-white mb-2">You're in.</h2>
              <p className="text-gray-400">Check your inbox for the welcome email.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
