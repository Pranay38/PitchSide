/**
 * PushPrompt — A non-intrusive, dismissible prompt asking users
 * to enable push notifications for breaking transfer news and match updates.
 * Shows once per session, only after user has been on the site for 30 seconds.
 */
import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "../hooks/usePushNotifications";

export function PushPrompt() {
  const { state, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already subscribed, denied, unsupported, or dismissed this session
    if (state !== "prompt") return;
    if (sessionStorage.getItem("push_prompt_dismissed")) return;

    // Show after 30 seconds of browsing
    const timer = setTimeout(() => setVisible(true), 30_000);
    return () => clearTimeout(timer);
  }, [state]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem("push_prompt_dismissed", "1");
  };

  const handleSubscribe = async () => {
    await subscribe();
    setVisible(false);
    sessionStorage.setItem("push_prompt_dismissed", "1");
  };

  if (!visible || dismissed || state !== "prompt") return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[90] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl shadow-black/10 dark:border-gray-800 dark:bg-[#0F172A]">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16A34A]/10">
            <Bell className="h-5 w-5 text-[#16A34A]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">
              Never miss a transfer buzz 🚨
            </p>
            <p className="mt-1 text-xs leading-5 text-[#64748B] dark:text-gray-400">
              Get instant alerts for breaking transfers, match updates, and new articles.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSubscribe}
            className="flex-1 rounded-xl bg-[#16A34A] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#15803d]"
          >
            Enable Notifications
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-[#64748B] transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
