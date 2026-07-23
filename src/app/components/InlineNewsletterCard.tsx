"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "../hooks/useUserPreferences";

interface InlineNewsletterCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function InlineNewsletterCard({
  title = "Stop arguing with emotion. Start arguing with data.",
  description = "Mainstream pundits won't give you the unadulterated tactical truth. Subscribe to get one brutal, data-backed breakdown every week before the timeline catches on.",
  className = "",
}: InlineNewsletterCardProps) {
  const { newsletterOptIn, setNewsletterOptIn, loading } = useUserPreferences();
  const [email, setEmail] = useState("");
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const CLUBS = ["Arsenal", "Chelsea", "Liverpool", "Man City", "Man United", "Spurs", "Real Madrid", "Barcelona"];

  const toggleClub = (club: string) => {
    setSelectedClubs((prev) =>
      prev.includes(club) ? prev.filter((c) => c !== club) : [...prev, club]
    );
  };

  if (loading || newsletterOptIn) {
    return null;
  }

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
        body: JSON.stringify({ email: email.trim(), clubPreferences: selectedClubs }),
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
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`overflow-hidden rounded-[2rem] border border-[#16A34A]/15 bg-gradient-to-br from-[#0F172A] via-[#0B1B2F] to-[#10203A] p-6 text-white shadow-xl ${className}`}>
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#86efac]">
          <Mail className="h-3.5 w-3.5" />
          Newsletter
        </p>
        <h2 className="mt-4 text-2xl font-black font-outfit leading-tight md:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">
          {description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="min-h-12 flex-1 rounded-2xl border border-white/12 bg-white/8 px-4 text-sm text-white placeholder:text-white/35 focus:border-[#4ade80] focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#16A34A] to-[#22c55e] border border-transparent hover:border-white/10 px-6 text-sm font-bold text-white shadow-md hover:shadow-lg hover:shadow-[#16A34A]/30 active:scale-95 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Saving..." : "Subscribe"}
          </button>
        </div>
        
        <div className="mt-2">
          <p className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Optional: Select your clubs</p>
          <div className="flex flex-wrap gap-2">
            {CLUBS.map((club) => (
              <button
                key={club}
                type="button"
                onClick={() => toggleClub(club)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 border ${
                  selectedClubs.includes(club)
                    ? "bg-[#16A34A]/20 border-[#16A34A] text-[#4ade80]"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {club}
              </button>
            ))}
          </div>
        </div>
      </form>
    </section>
  );
}
