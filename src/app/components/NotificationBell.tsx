import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

// Convert VAPID key from base64 to Uint8Array for the Push API
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

type PermState = "default" | "granted" | "denied" | "unsupported";

export function NotificationBell() {
    const [permission, setPermission] = useState<PermState>("default");
    const [loading, setLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Check if push is supported
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    useEffect(() => {
        if (!isSupported) {
            setPermission("unsupported");
            return;
        }
        setPermission(Notification.permission as PermState);

        // Check existing subscription
        navigator.serviceWorker.ready.then(async (reg) => {
            const sub = await reg.pushManager.getSubscription();
            setIsSubscribed(!!sub);
        });
    }, [isSupported]);

    const registerPushSW = useCallback(async () => {
        // Register the push service worker alongside the PWA one
        try {
            await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
        } catch {
            // May already be registered, that's fine
        }
    }, []);

    const handleToggle = async () => {
        if (!isSupported || loading) return;
        setLoading(true);

        try {
            if (isSubscribed) {
                // Unsubscribe
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    await fetch("/api/push", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "unsubscribe", endpoint: sub.endpoint }),
                    });
                    await sub.unsubscribe();
                }
                setIsSubscribed(false);
            } else {
                // Subscribe
                await registerPushSW();

                const result = await Notification.requestPermission();
                setPermission(result as PermState);

                if (result !== "granted") {
                    setLoading(false);
                    return;
                }

                // Get VAPID public key from server
                const keyRes = await fetch("/api/push");
                const { publicKey } = await keyRes.json();

                if (!publicKey) {
                    console.error("VAPID public key not configured");
                    setLoading(false);
                    return;
                }

                const reg = await navigator.serviceWorker.ready;
                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
                });

                // Send subscription to backend
                await fetch("/api/push", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "subscribe",
                        subscription: subscription.toJSON(),
                    }),
                });

                setIsSubscribed(true);
            }
        } catch (err) {
            console.error("Push notification toggle error:", err);
        }

        setLoading(false);
    };

    if (permission === "unsupported") return null;

    const Icon = loading ? Loader2 : isSubscribed ? BellRing : permission === "denied" ? BellOff : Bell;
    const title = loading
        ? "Setting up notifications..."
        : isSubscribed
        ? "Notifications enabled — click to disable"
        : permission === "denied"
        ? "Notifications blocked in browser settings"
        : "Enable push notifications";

    return (
        <button
            onClick={handleToggle}
            disabled={loading || permission === "denied"}
            title={title}
            className={`relative p-2 rounded-xl transition-all duration-200 ${
                isSubscribed
                    ? "text-[#16A34A] bg-[#16A34A]/10 hover:bg-[#16A34A]/20"
                    : permission === "denied"
                    ? "text-gray-400 cursor-not-allowed opacity-50"
                    : "text-gray-500 dark:text-gray-400 hover:text-[#16A34A] hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
        >
            <Icon className={`w-5 h-5 ${loading ? "animate-spin" : ""} ${isSubscribed ? "animate-bounce-once" : ""}`} />
            {isSubscribed && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
            )}
        </button>
    );
}
