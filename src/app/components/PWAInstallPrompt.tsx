import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        // Check if already dismissed this session
        if (sessionStorage.getItem("pwa-prompt-dismissed")) {
            setDismissed(true);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const installedHandler = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", installedHandler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", installedHandler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setInstalled(true);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem("pwa-prompt-dismissed", "1");
    };

    if (!deferredPrompt || dismissed || installed) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-50 animate-float-in">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-[#16A34A]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-0.5">
                        Install The Touchline Dribble
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-gray-400 mb-3">
                        Add to your home screen for instant access & offline reading
                    </p>
                    <button
                        onClick={handleInstall}
                        className="px-4 py-1.5 bg-[#16A34A] text-white text-xs font-bold rounded-lg hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25"
                    >
                        Install App
                    </button>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
