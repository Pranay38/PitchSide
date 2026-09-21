"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "../hooks/useUserPreferences";

export function OneLineNewsletter({ className = "" }: { className?: string }) {
  const { newsletterOptIn, setNewsletterOptIn, loading } = useUserPreferences();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      toast.success(payload.alreadySubscribed ? "You're already subscribed." : "Subscribed to the newsletter!");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`mt-12 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full text-center md:text-left">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Never miss a tactical breakdown</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get the post-match analysis directly in your inbox.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
          <input
            type="email"
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
