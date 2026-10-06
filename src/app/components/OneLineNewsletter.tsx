"use client";

import { GMAIL_INBOX_GUIDANCE } from "../lib/newsletterDelivery";
import { useNewsletterTracking } from "../hooks/useNewsletterTracking";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "../hooks/useUserPreferences";

export function OneLineNewsletter({ className = "", placement = "newsletter_inline", nextArticle }: { className?: string; placement?: string; nextArticle?: { href: string; title: string } }) {
  const { subscribe, exposureRef } = useNewsletterTracking(placement);
  const { newsletterOptIn, setNewsletterOptIn, loading } = useUserPreferences();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p role="status" className="p-4 text-sm">Checking your subscription…</p>;
  if (newsletterOptIn) return (
    <div role="status" className={`p-6 text-center ${className}`}>
      <h2 className="text-xl font-bold">You’re subscribed to The Weekly Whistle.</h2>
      <p className="mt-2 text-sm">One strong football opinion and one useful lesson, every week.</p>
      <p className="mt-3 text-sm text-slate-500">{GMAIL_INBOX_GUIDANCE}</p>
      <a className="mt-4 inline-block font-bold text-green-600 underline" href={nextArticle?.href || "/learn"}>
        {nextArticle ? `Read next: ${nextArticle.title}` : "Find your next useful football read"}
      </a>
    </div>
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@") || submitting) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await subscribe({ email: email.trim(), clubPreferences: [] });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof payload.error === "string" ? payload.error : "Could not save your subscription.",
        );
      }

      setNewsletterOptIn(true);
      toast.success(payload.alreadySubscribed ? "You're already subscribed." : "Subscribed to the newsletter!");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={exposureRef} className={`mt-12 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full text-center md:text-left">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">The Weekly Whistle</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">One strong football opinion and one useful lesson, every week.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
          <input
            type="email"
            aria-label="Email address"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="flex-1 md:w-64 min-h-12 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803d] px-6 text-sm font-bold text-white shadow-md active:scale-95 transition-all duration-300 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "..." : "Subscribe"}
          </button>
        </form>
      </div>
    </div>
  );
}
