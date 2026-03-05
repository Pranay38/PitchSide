import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setShowBanner(true);
        };

        const handleOnline = () => {
            setIsOffline(false);
            // Show "back online" briefly
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3000);
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    if (!showBanner) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${isOffline
                    ? "bg-amber-500 text-white"
                    : "bg-[#16A34A] text-white"
                }`}
        >
            {isOffline ? (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span>You're offline — cached articles are still available</span>
                </>
            ) : (
                <>
                    <Wifi className="w-4 h-4" />
                    <span>Back online!</span>
                </>
            )}
        </div>
    );
}
