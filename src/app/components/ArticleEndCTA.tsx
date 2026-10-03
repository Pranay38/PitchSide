"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowUpRight, Heart, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import type { BlogPost } from "../data/posts";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useNewsletterTracking } from "../hooks/useNewsletterTracking";
import { trackGrowthEvent } from "../lib/analytics";

const SUPPORT_URL = "https://razorpay.me/@thetouchlinedribble";

interface ArticleEndCTAProps {
  postId: string;
  club?: string;
  config?: BlogPost["articleCta"];
}

export function ArticleEndCTA({ postId, club, config }: ArticleEndCTAProps) {
  const { user, isLoaded: userLoaded } = useUser();
  const { newsletterOptIn, setNewsletterOptIn, loading: preferencesLoading } = useUserPreferences();
  const accountEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "";
  const [email, setEmail] = useState(accountEmail);
  const [submitting, setSubmitting] = useState(false);
  const { subscribe, exposureRef } = useNewsletterTracking("article_end", postId);

  useEffect(() => {
    if (accountEmail) setEmail(accountEmail);
  }, [accountEmail]);

  if (config?.enabled === false || !userLoaded || preferencesLoading) return null;

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@") || submitting) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await subscribe({ email: normalizedEmail, clubPreferences: club ? [club] : [] });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not save your subscription.");
      }

      setNewsletterOptIn(true);
      toast.success(payload.alreadySubscribed ? "You're already on the list." : "The next edition is heading to your inbox.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  if (newsletterOptIn) {
    return (
      <aside ref={exposureRef} className="my-12 border-y border-border py-8" aria-label="Support The Touchline Dribble">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#16A34A]">
              <Heart className="h-4 w-4" aria-hidden="true" /> Independent football writing
            </p>
            <h2 className="font-headline text-2xl font-bold text-foreground">
              {config?.subscriberHeadline || "Enjoying the analysis?"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {config?.subscriberBody || "If The Touchline Dribble makes matchdays more interesting, consider supporting the independent writing and helping fund more tactical deep dives."}
            </p>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGrowthEvent("cta_support_click", { postId, readerState: "subscriber" })}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            Support via Razorpay <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </aside>
    );
  }

  return (
    <aside ref={exposureRef} className="my-12 border-y border-border py-8" aria-label="Subscribe to The Touchline Dribble">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-end">
        <div className="max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#16A34A]">
            <Mail className="h-4 w-4" aria-hidden="true" /> Delivered to your inbox
          </p>
          <h2 className="font-headline text-2xl font-bold text-foreground">
            {config?.nonSubscriberHeadline || "Get The Weekly Whistle"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {config?.nonSubscriberBody || "One strong football opinion and one useful lesson, every week."}
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label htmlFor={`article-cta-email-${postId}`} className="sr-only">Email address</label>
          <input
            id={`article-cta-email-${postId}`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {submitting ? "Sending…" : "Send it to my inbox"}
          </button>
        </form>
      </div>
    </aside>
  );
}
