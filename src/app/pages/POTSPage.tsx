"use client";
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Users, BarChart3, TrendingUp, Info, CheckCircle2, Star, ChevronRight, Award, Quote, Loader2 } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { toast } from "sonner";
import { getSiteSettingsAsync, updateSiteSettingsAsync } from "../lib/siteSettingsStorage";
import { type POTSContender } from "../lib/pots";

const POTS_CONTENDERS: POTSContender[] = [
    {
        id: "saka",
        name: "Bukayo Saka",
        club: "Arsenal",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400&h=500&auto=format&fit=crop",
        votes: 12450,
        stats: [
            { label: "Goals", value: 18 },
            { label: "Assists", value: 14 },
            { label: "Chances Created", value: 82 },
            { label: "Dribbles p/g", value: "2.4" }
        ],
        verdict: "The heart of Arsenal's title charge. Saka has evolved into a world-class output machine, delivering in high-pressure moments consistently.",
        highlights: ["Winner vs Man City", "Hat-trick vs Spurs", "Player of Month (Dec)"]
    },
    {
        id: "palmer",
        name: "Cole Palmer",
        club: "Chelsea",
        image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400&h=500&auto=format&fit=crop",
        votes: 11200,
        stats: [
            { label: "Goals", value: 22 },
            { label: "Assists", value: 11 },
            { label: "xG Overperf.", value: "+4.2" },
            { label: "Pass Accuracy", value: "88%" }
        ],
        verdict: "Carrying a transitional Chelsea side on his shoulders. Cold as ice from the spot and a creative genius in the final third.",
        highlights: ["4 Goals vs Everton", "Last-minute winner vs Utd", "Young POTY Frontrunner"]
    },
    {
        id: "rodri",
        name: "Rodri",
        club: "Man City",
        image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=400&h=500&auto=format&fit=crop",
        votes: 9800,
        stats: [
            { label: "Passes", value: 3105 },
            { label: "Recoveries", value: 240 },
            { label: "Goals", value: 8 },
            { label: "Win Rate", value: "78%" }
        ],
        verdict: "The most important player in world football. City simply do not lose when he starts. He dictates everything.",
        highlights: ["Unbeaten Streak", "Clutch Goal vs Pool", "Midfield Dominance"]
    }
];

export function POTSPage() {
    const queryClient = useQueryClient();
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeContender, setActiveContender] = useState<POTSContender | null>(null);

    const { data: potsData, isLoading } = useQuery({
        queryKey: ['potsSettings'],
        queryFn: async () => {
            const settings = await getSiteSettingsAsync();
            if (settings.pots && settings.pots.contenders.length > 0) {
                return {
                    title: settings.pots.title,
                    description: settings.pots.description,
                    contenders: settings.pots.contenders
                };
            }
            return {
                title: "Player of the Season",
                description: "Vote for your Player of the Season.",
                contenders: POTS_CONTENDERS
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const voteMutation = useMutation({
        mutationFn: async (id: string) => {
            const settings = await getSiteSettingsAsync();
            const updatedContenders = settings.pots.contenders.map(c => 
                c.id === id ? { ...c, votes: c.votes + 1 } : c
            );
            await updateSiteSettingsAsync({
                pots: {
                    ...settings.pots,
                    contenders: updatedContenders
                }
            });
            return updatedContenders;
        },
        onMutate: async (id) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['potsSettings'] });
            const previousData = queryClient.getQueryData(['potsSettings']) as any;
            
            if (previousData) {
                queryClient.setQueryData(['potsSettings'], {
                    ...previousData,
                    contenders: previousData.contenders.map((c: any) => 
                        c.id === id ? { ...c, votes: c.votes + 1 } : c
                    )
                });
            }
            return { previousData };
        },
        onError: (err, id, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['potsSettings'], context.previousData);
            }
            toast.error("Failed to sync vote to server");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['potsSettings'] });
        },
    });

    useEffect(() => {
        if (potsData && potsData.contenders.length > 0 && !activeContender) {
            setActiveContender(potsData.contenders[0]);
        }
    }, [potsData, activeContender]);

    useEffect(() => {
        const savedVote = localStorage.getItem("pots_voted_2026");
        if (savedVote) {
            setHasVoted(true);
            setSelectedId(savedVote);
        }
    }, []);

    const contenders = potsData?.contenders || [];
    const title = potsData?.title || "";
    const description = potsData?.description || "";
    const totalVotes = contenders.reduce((sum: number, c: POTSContender) => sum + c.votes, 0);

    const handleVote = (id: string) => {
        if (hasVoted) return;

        setHasVoted(true);
        setSelectedId(id);
        toast.success("Vote recorded! Thanks for participating.");
        
        localStorage.setItem("pots_voted_2026", id);
        
        voteMutation.mutate(id);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#16A34A] animate-spin" />
            </div>
        );
    }

    if (!activeContender) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] font-manrope">
            <SEO 
                title={`${title} - Fan Vote & Stats`}
                description={description}
            />
            <Header />

            {/* --- HERO SECTION --- */}
            <section className="relative pt-16 pb-20 px-4 overflow-hidden bg-[#0F172A]">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#16A34A]/10 to-transparent pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#16A34A]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 text-center sm:text-left">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 text-[#16A34A] text-xs font-black uppercase tracking-widest mb-6"
                    >
                        <Award className="w-3.5 h-3.5" /> Official Fan Vote
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-7xl font-black font-outfit text-white mb-6 leading-tight uppercase"
                    >
                        {title.split(' ').map((word, i) => (
                            word.toLowerCase() === 'player' ? <span key={i} className="text-[#16A34A]">{word} </span> : word + ' '
                        ))}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-2xl text-gray-400 text-lg sm:text-xl font-medium mb-10 leading-relaxed"
                    >
                        {description}
                    </motion.p>
                </div>
            </section>

            {/* --- MAIN INTERACTIVE SECTION --- */}
            <section className="max-w-7xl mx-auto px-4 -mt-12 mb-24">
                <div className="grid lg:grid-cols-12 gap-8">
                    
                    {/* Contender Sidebar (Desktop) / Carousel (Mobile) */}
                    <div className="lg:col-span-4 space-y-4">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
                             The Shortlist <span className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800" />
                        </h2>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                            {contenders.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveContender(c)}
                                    className={`group relative flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                                        activeContender.id === c.id 
                                            ? 'bg-white dark:bg-[#1E293B] border-[#16A34A] shadow-xl scale-[1.02]' 
                                            : 'bg-white/50 dark:bg-[#1E293B]/50 border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#16A34A]/20">
                                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <div className="text-sm font-black text-[#0F172A] dark:text-white leading-none mb-1">{c.name}</div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{c.club}</div>
                                    </div>
                                    {hasVoted && (
                                        <div className="ml-auto pr-2">
                                            <div className="text-xs font-black text-[#16A34A]">{Math.round((c.votes / totalVotes) * 100)}%</div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contender Detail & Stats */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeContender.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden"
                            >
                                <div className="grid md:grid-cols-2">
                                    {/* Player Profile */}
                                    <div className="relative h-[400px] md:h-auto overflow-hidden">
                                        <img src={activeContender.image} alt={activeContender.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        <div className="absolute bottom-8 left-8">
                                            <div className="text-[10px] font-black text-[#16A34A] uppercase tracking-[0.3em] mb-2">Contender #{contenders.indexOf(activeContender) + 1}</div>
                                            <h3 className="text-4xl font-black font-outfit text-white uppercase">{activeContender.name}</h3>
                                            <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">{activeContender.club}</p>
                                        </div>
                                    </div>

                                    {/* Content & Stats */}
                                    <div className="p-8 sm:p-10 flex flex-col">
                                        <div className="mb-8">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <BarChart3 className="w-4 h-4" /> Season Metrics
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {activeContender.stats.map((s, i) => (
                                                    <div key={i} className="bg-gray-50 dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                                        <div className="text-2xl font-black text-[#0F172A] dark:text-white font-outfit">{s.value}</div>
                                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mb-8 flex-1">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" /> Our Verdict
                                            </h4>
                                            <div className="bg-[#16A34A]/5 border-l-4 border-[#16A34A] p-4 rounded-r-xl relative">
                                                <Quote className="absolute top-2 right-2 w-8 h-8 text-[#16A34A]/10" />
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                                    "{activeContender.verdict}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => handleVote(activeContender.id)}
                                                disabled={hasVoted}
                                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
                                                    hasVoted 
                                                        ? selectedId === activeContender.id 
                                                            ? 'bg-[#16A34A] text-white' 
                                                            : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                                        : 'bg-[#16A34A] text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#16A34A]/20'
                                                }`}
                                            >
                                                {hasVoted ? (
                                                    selectedId === activeContender.id ? <><CheckCircle2 className="w-4 h-4" /> Voted</> : "Voted elsewhere"
                                                ) : "Cast Your Vote"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </section>

            {/* --- LIVE RESULTS SUMMARY --- */}
            <section className="bg-white dark:bg-[#1E293B] py-24 border-y border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl sm:text-4xl font-black font-outfit text-[#0F172A] dark:text-white mb-4 uppercase">The Fan Pulse</h2>
                    <p className="text-gray-500 font-medium mb-12">Tracking {totalVotes.toLocaleString()} total votes from readers worldwide.</p>
                    
                    <div className="space-y-6">
                        {contenders.sort((a,b) => b.votes - a.votes).map((c, i) => {
                            const pct = Math.round((c.votes / totalVotes) * 100);
                            return (
                                <div key={c.id} className="relative">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-gray-400">0{i+1}</span>
                                            <span className="text-sm font-bold text-[#0F172A] dark:text-white">{c.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-[#16A34A]">{pct}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 dark:bg-[#0F172A] rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${pct}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className={`h-full ${i === 0 ? 'bg-[#16A34A]' : 'bg-gray-400 dark:bg-gray-600'}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- FAQ / SEO BOTTOM --- */}
            <section className="max-w-4xl mx-auto px-4 py-24">
                <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-2xl font-black uppercase font-outfit text-[#16A34A]">How is the POTS determined?</h2>
                    <p>
                        The Premier League Player of the Season award is typically a combination of fan votes, a panel of experts, and the captains of each of the 20 Premier League clubs. Our reader poll serves as the definitive 'Fan Voice' of the season.
                    </p>
                    <h2 className="text-2xl font-black uppercase font-outfit text-[#16A34A]">Previous Winners</h2>
                    <ul className="list-none p-0 grid sm:grid-cols-2 gap-4">
                        <li className="bg-gray-100 dark:bg-[#1E293B] p-4 rounded-xl flex justify-between">
                            <span className="font-bold">2024/25</span>
                            <span className="text-gray-500">Phil Foden</span>
                        </li>
                        <li className="bg-gray-100 dark:bg-[#1E293B] p-4 rounded-xl flex justify-between">
                            <span className="font-bold">2023/24</span>
                            <span className="text-gray-500">Erling Haaland</span>
                        </li>
                    </ul>
                </div>
            </section>

            <Footer />
        </div>
    );
}
