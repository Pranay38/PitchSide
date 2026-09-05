/**
 * CommunityContributorCTA — "Write a Take" section inspired by BPF's
 * "Write for BPF" community recruitment block. Invites guest contributors
 * to submit analysis, creating a community pipeline and SEO content benefit.
 */

import { PenLine, ArrowRight, Users, Trophy, TrendingUp } from "lucide-react";

export function CommunityContributorCTA() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1fr_auto]">
        {/* Content Side */}
        <div className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              Community
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-headline font-bold tracking-tight text-foreground leading-tight">
            Your analysis,{" "}
            <span className="text-primary">our platform.</span>
          </h2>

          <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
            Have a tactical breakdown that needs an audience? A hot take backed by data?
            We publish fan-written analysis alongside our editorial — submit your pitch
            and get your byline on The Touchline Dribble.
          </p>

          {/* Benefits list */}
          <ul className="mt-6 space-y-3">
            {[
              { icon: Users, text: "Your byline on a growing football analysis platform" },
              { icon: TrendingUp, text: "Editorial feedback to sharpen your writing" },
              { icon: Trophy, text: "Top community takes get featured on the homepage" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <a
              href="mailto:thetouchlinedribble@gmail.com?subject=Guest%20Analysis%20Pitch"
              className="group inline-flex items-center gap-2.5 bg-foreground text-background font-black uppercase tracking-widest text-[11px] px-6 py-3.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Send a Pitch
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Accent side (desktop only) */}
        <div className="hidden md:flex w-48 bg-secondary items-center justify-center border-l border-border">
          <div className="text-center space-y-3 px-6">
            <div className="text-6xl font-headline font-bold text-foreground/10">
              ✍
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Guest takes published alongside editorial analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
