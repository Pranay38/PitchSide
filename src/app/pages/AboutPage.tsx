"use client";
import { PUBLICATION_DESCRIPTION, PUBLICATION_ID, EDITOR_ID } from "../lib/publication";
import { NEWSLETTER_PROMISE } from "../lib/newsletterReading";
import { Link } from "@/lib/router-compat";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Mail, ArrowRight, Crosshair, Swords, MessageSquare, Zap, BookOpen } from "lucide-react";
import { InstagramLogo } from "@phosphor-icons/react";
import { useClubPreference } from "../hooks/useClubPreference";
import { SEO } from "../components/SEO";
import { SupportBanner } from "../components/SupportBanner";

function XIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export function AboutPage() {
    const { favoriteClub } = useClubPreference();

    return (
        <div className="page-atmosphere min-h-screen transition-colors duration-300">
            <SEO
                title="About"
                description={PUBLICATION_DESCRIPTION}
            />
            {/* Person JSON-LD for E-E-A-T author entity */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "@id": EDITOR_ID,
                        name: "Pranay Agrawal",
                        url: "https://www.thetouchlinedribble.in/about",
                        jobTitle: "Football Tactics Writer & Analyst",
                        description: "Founder and writer of The Touchline Dribble.",
                        worksFor: {
                            "@type": "Organization",
                            "@id": PUBLICATION_ID,
                            name: "The Touchline Dribble",
                            url: "https://www.thetouchlinedribble.in",
                            logo: "https://www.thetouchlinedribble.in/logo.png"
                        },
                    }),
                }}
            />
            <Header favoriteClub={favoriteClub} />

            <main className="max-w-[900px] mx-auto px-6 py-16 md:py-24">

                {/* ── Hero ── */}
                <section className="mb-20 text-center">
                    <p className="kicker text-primary mb-4">About</p>
                    <h1 className="font-headline font-bold text-5xl md:text-6xl lg:text-7xl text-foreground tracking-[-0.03em] leading-[1.02] mb-6">
                        Strong opinions.<br className="hidden md:block" /> Evidence behind them.
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                        {PUBLICATION_DESCRIPTION}
                    </p>
                </section>

                {/* ── What We Do ── */}
                <section className="mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
                        <div className="bg-card p-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-5">
                                <Crosshair className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-headline font-bold text-lg text-foreground mb-2">Tactical Breakdowns</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Post-match autopsies that explain the <em>why</em> behind every result. Formations, pressing triggers, and the moments that changed the game.</p>
                        </div>
                        <div className="bg-card p-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-5">
                                <Swords className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-headline font-bold text-lg text-foreground mb-2">Bold Opinions</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Hot takes backed by tactical reasoning, not vibes. The kind of arguments that fuel your group chat.</p>
                        </div>
                        <div className="bg-card p-8 text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-5">
                                <MessageSquare className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-headline font-bold text-lg text-foreground mb-2">Fan Debate</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Polls, predictions, and community debates. Your tactical opinion matters here — vote, argue, and get proven right (or wrong).</p>
                        </div>
                    </div>
                </section>

                {/* ── Newsletter Push ── */}
                <section className="mb-20">
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-foreground text-background p-10 md:p-14">
                        <div className="pointer-events-none absolute right-0 top-0 w-64 h-64 rounded-full bg-primary/20 blur-[100px]" />
                        <div className="relative flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="w-5 h-5 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Free Newsletter</span>
                                </div>
                                <h2 className="font-headline font-bold text-3xl md:text-4xl tracking-tight mb-3">
                                    Get the sharpest reads,<br />straight to your inbox.
                                </h2>
                                <p className="text-sm opacity-70 leading-relaxed max-w-md">
                                    The Weekly Whistle: {NEWSLETTER_PROMISE}
                                </p>
                            </div>
                            <div className="shrink-0 w-full md:w-auto">
                                <Link
                                    to="/subscribe"
                                    className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-full hover:bg-primary/90 transition-colors"
                                >
                                    Subscribe Free
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <p className="text-xs opacity-50 text-center mt-3">Start with a short welcome series.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-20" aria-labelledby="editorial-standards">
                    <h2 id="editorial-standards" className="font-headline text-3xl font-bold mb-5">How we approach the argument</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">Our editorial standard is a clear argument supported by observable evidence, with room for the strongest reasonable counterargument. Explainers answer a specific football question, show an example, and explain the limits of the answer.</p>
                    <p className="text-muted-foreground leading-relaxed mb-4">We prioritize original sources: competition rules, official statements, and the data provider’s own definitions. Reported claims should remain attributed reports; statistics need their competition, period, and source. Opinion and inference should be distinguishable from established fact.</p>
                    <p className="text-muted-foreground leading-relaxed">Found an error or a source we should consider? Email <a className="underline" href="mailto:thetouchlinedribble@gmail.com">thetouchlinedribble@gmail.com</a> with the article link, the passage, and supporting evidence.</p>
                    <p className="mt-5"><Link className="underline" to="/learn">Explore football explainers</Link> · <Link className="underline" to="/stories">Read long-form stories</Link></p>
                </section>

                {/* ── Author ── */}
                <section className="mb-20">
                    <p className="kicker text-primary mb-4">The Writer</p>
                    <div className="flex flex-col sm:flex-row items-start gap-8 border-t border-border pt-8">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-[#4ade80] flex items-center justify-center flex-shrink-0">
                            <span className="text-4xl font-bold text-white font-headline">P</span>
                        </div>
                        <div>
                            <h2 className="font-headline font-bold text-2xl text-foreground mb-1">Pranay Agrawal</h2>
                            <p className="text-sm text-primary font-bold uppercase tracking-widest mb-4">Founder & Tactical Writer</p>
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                Football obsessive since childhood. I started The Touchline Dribble because I was tired of pundits saying &ldquo;they wanted it more&rdquo; when the real story was a formation change in the 55th minute.
                                Every piece I write aims to make you see the game differently — the tactical shifts, the managerial mindgames, the details that decide matches.
                            </p>
                            <div className="flex items-center gap-3">
                                <a href="https://x.com/TouchlineDribbl" target="_blank" rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-secondary hover:bg-foreground hover:text-background text-muted-foreground transition-all"
                                    aria-label="Follow on X"
                                >
                                    <XIcon className="w-4 h-4" />
                                </a>
                                <a href="https://www.instagram.com/thetouchlinedribble/" target="_blank" rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-secondary hover:bg-[#E4405F] hover:text-white text-muted-foreground transition-all"
                                    aria-label="Follow on Instagram"
                                >
                                    <InstagramLogo className="w-4 h-4" />
                                </a>
                                <a href="mailto:thetouchlinedribble@gmail.com"
                                    className="p-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
                                    aria-label="Send email"
                                >
                                    <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ── Join the Team ── */}
                    <div className="mt-16 bg-primary/5 rounded-3xl p-8 border border-primary/20 text-center">
                        <h3 className="font-headline font-bold text-2xl text-foreground mb-3">Think you can do better?</h3>
                        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
                            We&apos;re always looking for sharp tactical minds to join the roster. If you can break down a low block better than the pundits on TV, we want you writing for us.
                        </p>
                        <a href="mailto:thetouchlinedribble@gmail.com?subject=Joining the Team" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-full hover:bg-primary/90 transition-colors">
                            Pitch us an article
                        </a>
                    </div>
                </section>

                {/* ── Why Subscribe ── */}
                <section className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-border bg-card p-7">
                            <BookOpen className="w-6 h-6 text-primary mb-4" />
                            <h3 className="font-headline font-bold text-foreground mb-2">Weekly Deep Dives</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Long-form tactical pieces that go beyond the scoreline. The kind of analysis you bookmark and come back to.</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-7">
                            <Zap className="w-6 h-6 text-primary mb-4" />
                            <h3 className="font-headline font-bold text-foreground mb-2">Quick Takes</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Rapid-fire post-match reactions and transfer opinions. Hot off the press, before the narratives harden.</p>
                        </div>
                    </div>
                </section>

                {/* ── Support CTA ── */}
                <section className="mb-20">
                    <SupportBanner variant="inline" />
                </section>

                {/* ── Bottom CTA ── */}
                <section className="text-center border-t border-border pt-16">
                    <h2 className="font-headline font-bold text-3xl md:text-4xl text-foreground tracking-tight mb-4">
                        Ready to see football differently?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        Start with our latest piece — or subscribe to never miss a breakdown.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-foreground text-background font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                            Start Reading
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/archive"
                            className="inline-flex items-center gap-2 border border-border text-foreground font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-full hover:border-primary hover:text-primary transition-colors"
                        >
                            Browse Archive
                        </Link>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
