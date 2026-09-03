import { Link, useLocation } from "@/lib/router-compat";
import { Home, Newspaper, Flame, User, Shield } from "lucide-react";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { topicPath } from "../lib/contentPaths";

export function MobileBottomNav() {
    const location = useLocation();
    const { fanClub } = useUserPreferences();

    // Hide on admin page
    if (location.pathname.includes("pitchside-manage")) return null;

    const tabs = [
        { to: "/", label: "Home", icon: Home },
        { to: "/stories", label: "Stories", icon: Newspaper },
    ];

    if (fanClub?.name) {
        tabs.push({ 
            to: topicPath(fanClub.name), 
            label: fanClub.name.length > 8 ? fanClub.name.substring(0, 7) + "." : fanClub.name, 
            icon: Shield 
        });
    } else {
        tabs.push({ to: "/debates", label: "Debate", icon: Flame });
    }

    tabs.push({ to: "/profile", label: "Profile", icon: User });

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-50 sm:hidden">
            {/* Frosted glass floating pill */}
            <div className="bg-white/80 dark:bg-[#0b1326]/70 backdrop-blur-2xl border ghost-border-dark dark:ghost-border rounded-[2.5rem] shadow-2xl ambient-shadow pb-[max(0rem,calc(env(safe-area-inset-bottom)-1rem))]">
                <div className="flex items-center justify-around px-2 py-2">
                    {tabs.map((tab) => {
                        const isActive = tab.to === "/"
                            ? location.pathname === "/"
                            : location.pathname.startsWith(tab.to);

                        return (
                            <Link
                                key={tab.to}
                                to={tab.to}
                                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-300 min-w-[56px] ${
                                    isActive
                                        ? "text-[#16A34A] bg-[#16A34A]/5"
                                        : "text-gray-400 dark:text-slate-400 active:scale-95 hover:bg-black/5 dark:hover:bg-white/5"
                                }`}
                            >
                                <div className="relative">
                                    <tab.icon
                                        className={`w-5 h-5 transition-all duration-300 ${
                                            isActive ? "stroke-[2.5]" : "stroke-[1.5]"
                                        }`}
                                    />
                                    {isActive && (
                                        <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#16A34A] glow-green animate-pulse" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-bold tracking-wide leading-tight transition-all duration-200 ${
                                    isActive ? "text-[#16A34A]" : ""
                                }`}>
                                    {tab.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
