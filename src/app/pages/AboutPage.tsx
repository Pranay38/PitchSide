import { Link } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Twitter, Instagram, Mail, PenLine, BarChart3, Zap } from "lucide-react";
import { useClubPreference } from "../hooks/useClubPreference";

export function AboutPage() {
    const { favoriteClub } = useClubPreference();

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            <Header favoriteClub={favoriteClub} />

            <main className="max-w-[720px] mx-auto px-6 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#16A34A]/10 mb-6">
                        <video src="/logo.mp4" autoPlay loop muted playsInline className="w-12 h-12 object-contain rounded" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white mb-4">
                        About The Touchline Dribble
                    </h1>
                    <p className="text-lg text-[#64748B] dark:text-gray-400 leading-relaxed max-w-lg mx-auto">
                        From the touchline to your timeline — sharp football analysis, tactical breakdowns, and bold opinions for the beautiful game.
                    </p>
                </div>

                {/* What We Do */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#16A34A]/10 mb-4">
                            <PenLine className="w-5 h-5 text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-[#0F172A] dark:text-white mb-2">Deep Analysis</h3>
                        <p className="text-sm text-[#64748B] dark:text-gray-400">Tactical breakdowns and match analysis that go beyond the surface.</p>
                    </div>
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#16A34A]/10 mb-4">
                            <BarChart3 className="w-5 h-5 text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-[#0F172A] dark:text-white mb-2">Data Driven</h3>
                        <p className="text-sm text-[#64748B] dark:text-gray-400">Stats-backed insights that add context to every story and opinion piece.</p>
                    </div>
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-gray-100 dark:border-gray-800 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#16A34A]/10 mb-4">
                            <Zap className="w-5 h-5 text-[#16A34A]" />
                        </div>
                        <h3 className="font-bold text-[#0F172A] dark:text-white mb-2">Bold Opinions</h3>
                        <p className="text-sm text-[#64748B] dark:text-gray-400">Honest takes that spark conversation. We say what fans are thinking.</p>
                    </div>
                </div>

                {/* Author */}
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-gray-100 dark:border-gray-800 mb-12">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#16A34A] to-[#4ade80] flex items-center justify-center flex-shrink-0">
                            <span className="text-4xl font-bold text-white">P</span>
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl font-bold text-[#0F172A] dark:text-white mb-1">Pranay Agrawal</h2>
                            <p className="text-sm text-[#16A34A] font-medium mb-3">Founder & Writer</p>
                            <p className="text-sm text-[#64748B] dark:text-gray-400 leading-relaxed mb-4">
                                Football obsessive since childhood. I started The Touchline Dribble to combine my love for the beautiful game with data-driven analysis.
                                Every article is written with the goal of making you see the game differently.
                            </p>
                            <div className="flex items-center justify-center sm:justify-start gap-3">
                                <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] text-[#64748B] dark:text-gray-400 transition-all">
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#E4405F]/10 hover:text-[#E4405F] text-[#64748B] dark:text-gray-400 transition-all">
                                    <Instagram className="w-4 h-4" />
                                </a>
                                <a href="mailto:hello@pitchside.com"
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-[#16A34A]/10 hover:text-[#16A34A] text-[#64748B] dark:text-gray-400 transition-all">
                                    <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#16A34A] text-white font-semibold rounded-xl hover:bg-[#15803d] transition-all hover:shadow-lg hover:shadow-[#16A34A]/25"
                    >
                        ← Start Reading
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
