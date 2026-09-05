"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SEO } from "../components/SEO";
import { CheckCircle2, XCircle } from "lucide-react";
import { SupportBanner } from "../components/SupportBanner";
import { InlineNewsletterCard } from "../components/InlineNewsletterCard";
import { Link } from "@/lib/router-compat";

interface Feature {
  name: string;
  us: boolean;
  them: boolean;
}

interface CompetitorPageProps {
  competitorName: string;
  competitorDescription: string;
  whySwitch: string;
  features: Feature[];
}

export function CompetitorPage({ competitorName, competitorDescription, whySwitch, features }: CompetitorPageProps) {
  return (
    <div className="page-atmosphere min-h-screen transition-colors duration-300">
      <SEO
        title={`The Touchline Dribble vs ${competitorName}`}
        description={`Thinking of switching from ${competitorName}? See how The Touchline Dribble compares.`}
      />
      <Header />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6">
        <div className="mb-16 border-l-4 border-primary pl-5">
          <div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-primary">
            COMPARE
          </div>
          <h1 className="mt-3 font-headline text-5xl font-bold leading-none text-foreground sm:text-6xl">
            The Touchline Dribble vs {competitorName}
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-relaxed text-muted-foreground font-newsreader italic">
            Thinking about making the switch? Here is an honest comparison of how we stack up against {competitorName}.
          </p>
        </div>

        <section className="mb-20">
          <h2 className="font-headline font-bold text-3xl mb-6">Why read The Touchline Dribble?</h2>
          <div className="bg-card rounded-2xl border border-border p-8 md:p-10 text-lg leading-relaxed text-muted-foreground">
            {whySwitch}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="font-headline font-bold text-3xl mb-8">Feature Comparison</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="p-5 font-headline font-bold text-lg">Feature</th>
                  <th className="p-5 font-headline font-bold text-lg text-primary text-center">The Touchline Dribble</th>
                  <th className="p-5 font-headline font-bold text-lg text-center text-muted-foreground">{competitorName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {features.map((feature, i) => (
                  <tr key={i} className="transition-colors hover:bg-secondary/30">
                    <td className="p-5 font-medium">{feature.name}</td>
                    <td className="p-5 text-center">
                      {feature.us ? (
                        <CheckCircle2 className="mx-auto h-6 w-6 text-primary" />
                      ) : (
                        <XCircle className="mx-auto h-6 w-6 text-muted-foreground opacity-50" />
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {feature.them ? (
                        <CheckCircle2 className="mx-auto h-6 w-6 text-primary" />
                      ) : (
                        <XCircle className="mx-auto h-6 w-6 text-muted-foreground opacity-50" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-20">
          <div className="bg-secondary/50 rounded-2xl border border-border p-10 text-center">
            <h2 className="font-headline font-bold text-3xl mb-4">Ready for better football analysis?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of smart fans getting the best tactical breakdowns and boldest opinions delivered straight to their inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-colors">
                Read the Latest Articles
              </Link>
            </div>
          </div>
        </section>

        <div className="section-divider my-16" />
        
        <section className="w-full max-w-2xl mx-auto space-y-12">
          <SupportBanner variant="compact" />
          <InlineNewsletterCard />
        </section>
      </main>

      <Footer />
    </div>
  );
}
