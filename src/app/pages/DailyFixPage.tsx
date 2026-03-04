import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useClubPreference } from "../hooks/useClubPreference";
import { ManagerPressureWidget, ManagerPressure } from "../components/ManagerPressureWidget";
import { OnThisDayWidget, OnThisDayEvent } from "../components/OnThisDayWidget";
import { RumorMillWidget, RumorMill } from "../components/RumorMillWidget";
import { RefreshCw, Zap } from "lucide-react";

interface DailyFeaturesData {
    lastUpdated: string;
    onThisDay: OnThisDayEvent;
    rumorMill: RumorMill;
    managerPressure: ManagerPressure[];
}

export function DailyFixPage() {
    const { favoriteClub, setFavoriteClub } = useClubPreference();
    const [data, setData] = useState<DailyFeaturesData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/data/daily_features.json")
            .then((res) => {
                if (!res.ok) throw new Error("Data not found");
                return res.json();
            })
            .then((jsonData) => {
                setData(jsonData);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching daily features:", err);
                setLoading(false);
            });
    }, []);

    const handleChangeClub = () => {
        // Usually handled by modal, here we just trigger standard flow
        setFavoriteClub("");
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
            <Header onChangeClub={handleChangeClub} favoriteClub={favoriteClub} />

            <main className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 py-10 flex-grow">
                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-12 animate-float-in">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
                            <h1 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tight text-[#0F172A] dark:text-white">
                                The Daily Fix
                            </h1>
                        </div>
                        <p className="text-lg text-[#64748B] dark:text-gray-400 font-medium max-w-xl">
                            Your bite-sized daily dose of football history, transfer gossip, and the managerial hot seat index.
                        </p>
                    </div>

                    {data && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-full border border-gray-200 dark:border-gray-700">
                            <RefreshCw className="w-4 h-4 text-[#16A34A]" />
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                Updated {new Date(data.lastUpdated).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Left Column - History */}
                        <div className="lg:col-span-1 flex flex-col gap-8 animate-float-in" style={{ animationDelay: "100ms" }}>
                            <OnThisDayWidget data={data.onThisDay} />
                        </div>

                        {/* Middle Column - Rumors */}
                        <div className="lg:col-span-1 flex flex-col gap-8 animate-float-in" style={{ animationDelay: "200ms" }}>
                            <RumorMillWidget data={data.rumorMill} />
                        </div>

                        {/* Right Column - Pressure Index */}
                        <div className="lg:col-span-1 flex flex-col gap-8 animate-float-in" style={{ animationDelay: "300ms" }}>
                            <ManagerPressureWidget data={data.managerPressure} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 glass-card rounded-2xl border border-red-200 dark:border-red-900">
                        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Data Unavailable</h2>
                        <p className="text-gray-600 dark:text-gray-400">The daily data feed hasn't been generated yet today.</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
