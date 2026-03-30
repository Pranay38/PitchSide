import { Link, useLocation } from "@/lib/router-compat";
import { Home, Newspaper, ArrowLeftRight, Flame, User } from "lucide-react";

const tabs = [
    { to: "/", label: "Home", icon: Home },
    { to: "/stories", label: "Stories", icon: Newspaper },
    { to: "/transfers", label: "Transfers", icon: ArrowLeftRight },
    { to: "/debates", label: "Debate", icon: Flame },
    { to: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
    const location = useLocation();

    // Hide on admin page
    if (location.pathname.includes("pitchside-manage")) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            {/* Frosted glass backdrop */}
            <div className="bg-white/80 dark:bg-[#0a0e1a]/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
                {/* Safe area padding for notched phones */}
                <div className="flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    {tabs.map((tab) => {
                        const isActive = tab.to === "/"
                            ? location.pathname === "/"
                            : location.pathname.startsWith(tab.to);

                        return (
                            <Link
                                key={tab.to}
                                to={tab.to}
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                                    isActive
                                        ? "text-[#16A34A]"
                                        : "text-gray-400 dark:text-gray-500 active:scale-95"
                                }`}
                            >
                                <div className="relative">
                                    <tab.icon
                                        className={`w-5 h-5 transition-all duration-200 ${
                                            isActive ? "stroke-[2.5]" : "stroke-[1.5]"
                                        }`}
                                    />
                                    {isActive && (
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#16A34A]" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-semibold leading-tight transition-all duration-200 ${
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
