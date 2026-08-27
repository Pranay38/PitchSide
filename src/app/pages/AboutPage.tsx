"use client";
import { Link } from "@/lib/router-compat";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Twitter, Instagram, Mail, PenLine, MessageSquare, Crosshair, Swords } from "lucide-react";
import { useClubPreference } from "../hooks/useClubPreference";
import { SEO } from "../components/SEO";
import { GlowButton } from "../components/ui/GlowButton";

export function AboutPage() {
    const { favoriteClub } = useClubPreference();

    return (
        <div className="page-atmosphere min-h-screen transition-colors duration-300">
            {/* Person JSON-LD for E-E-A-T author entity */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Person",
                        name: "Pranay Agrawal",
                        url: "https://www.thetouchlinedribble.in/about",
                        jobTitle: "Football Tactics Writer & Analyst",
                        description: "Tactical writer and football obsessive. Founder of The Touchline Dribble — post-match breakdowns, formation deep dives, and the bold opinions your pundit won't give you.",
                        sameAs: [
                            "https://x.com/TouchlineDribbl",
                            "https://www.instagram.com/thetouchlinedribble/"
                        ],
                        worksFor: {
                            "@type": "Organization",
                            name: "The Touchline Dribble",
                            url: "https://www.thetouchlinedribble.in",
                            logo: "https://www.thetouchlinedribble.in/logo.png"
                        },
                    }),
                }}
            />
            <Header favoriteClub={favoriteClub} />

            <main className="max-w-[800px] mx-auto px-6 py-12">
                {/* Hero */}
                <div className="editorial-hero rounded-[2rem] border border-gray-200 p-8 shadow-xl shadow-[#0F172A]/[0.04] dark:border-gray-800 md:p-12 mb-12 text-center overflow-hidden relative">
                    <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" />
                    <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-[#16A34A]/10 blur-3xl" />
                    <div className="relative">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#16A34A]/10 mb-6">
                            <img src="/logo.png" alt="The Touchline Dribble" className="w-12 h-12 object-contain rounded" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white mb-4 leading-tight">
                            About The Touchline Dribble
                        </h1>
                        <p className="text-lg text-[#64748B] dark:text-gray-400 leading-relaxed max-w-lg mx-auto">
                            We break down what actually happened on the pitch — the tactical shifts, the managerial gambles, the moments your pundit missed. Sharp analysis. Bold opinions. No PR fluff.
                        </p>
                    </div>
                </div>

                {/* What We Do */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-[#0F172A] rounded-[1.75rem] p-6 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#16A34A]/10 mb-4">
                            <Crosshair className="w-5 h-5 text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-[#0F172A] dark:text-white mb-2">Tactical Breakdowns</h3>
                        <p className="text-sm text-[#64748B] dark:text-gray-400">Post-match autopsies that explain the <em>why</em> behind every result. Formations, pressing triggers, and the moments that changed the game.</p>
                    </div>
                    <div className="bg-white dark:bg-[#0F172A] rounded-[1.75rem] p-6 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#16A34A]/10 mb-4">
                            <Swords className="w-5 h-5 text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-[#0F172A] dark:text-white mb-2">Bold Opinions</h3>
                        <p className="text-sm text-[#64748B] dark:text-gray-400">Hot takes backed by tactical reasoning, not vibes. The kind of arguments that fuel your group chat.</p>
                    </div>
                    <div className="bg-white dark:bg-[#0F172A] rounded-[1.75rem] p-6 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#16A34A]/10 mb-4">
                            <MessageSquare className="w-5 h-5 text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-[#0F172A] dark:text-white mb-2">Fan Debate</h3>
                        <p className="text-sm text-[#64748B] dark:text-gray-400">Polls, predictions, and community debates. Your tactical opinion matters here — vote, argue, and get proven right (or wrong).</p>
                    </div>
                </div>

                {/* Author */}
                <div className="bg-white dark:bg-[#0F172A] rounded-[1.75rem] p-8 border border-gray-200 dark:border-gray-800 mb-12 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#16A34A] to-[#4ade80] flex items-center justify-center flex-shrink-0">
                            <span className="text-4xl font-bold text-white">P</span>
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-1">Pranay Agrawal</h2>
                            <p className="text-sm text-[#16A34A] font-medium mb-3">Founder & Tactical Writer</p>
                            <p className="text-sm text-[#64748B] dark:text-gray-400 leading-relaxed mb-4">
                                Football obsessive since childhood. I started The Touchline Dribble because I was tired of pundits saying "they wanted it more" when the real story was a formation change in the 55th minute.
                                Every piece I write aims to make you see the game differently — the tactical shifts, the managerial mindgames, the details that decide matches.
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-3">
                                <a href="https://x.com/TouchlineDribbl" target="_blank" rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] text-[#64748B] dark:text-gray-400 transition-all">
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a href="https://www.instagram.com/thetouchlinedribble/" target="_blank" rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#E4405F]/10 hover:text-[#E4405F] text-[#64748B] dark:text-gray-400 transition-all">
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a href="mailto:thetouchlinedribble@gmail.com"
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#16A34A]/10 hover:text-[#16A34A] text-[#64748B] dark:text-gray-400 transition-all">
                                    <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-8">
                    <GlowButton href="/">
                        Start Reading
                    </GlowButton>
                </div>
            </main>

            <Footer />
        </div>
    );
}
