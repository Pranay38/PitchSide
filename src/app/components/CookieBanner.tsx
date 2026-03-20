import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("pitchside_cookie_consent");
    if (!consent) {
      // Small delay to let the page load before showing the banner
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("pitchside_cookie_consent", "accepted");
    // Here you would typically initialize Google Analytics / AdSense scripts dynamically
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("pitchside_cookie_consent", "declined");
    // Ensure tracking scripts are blocked or removed
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] sm:p-4 pointer-events-none">
      <div className="mx-auto max-w-5xl pointer-events-auto">
        <div className="bg-white dark:bg-slate-900 border-t sm:border border-gray-200 dark:border-gray-800 sm:rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative overflow-hidden">
          
          {/* Decorative left accent */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#16A34A]"></div>

          <div className="flex-shrink-0 bg-green-50 dark:bg-green-500/10 p-3 rounded-full hidden sm:block">
            <Cookie className="w-6 h-6 text-[#16A34A]" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-2">
              <span className="sm:hidden"><Cookie className="w-4 h-4 text-[#16A34A]" /></span>
              We value your privacy
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              Pitchside uses cookies and similar technologies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies required for analytics and monetization tools.
            </p>
          </div>

          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={handleDecline}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#16A34A] hover:bg-green-700 focus:ring-4 focus:ring-green-500/20 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] w-full sm:w-auto text-center"
            >
              Accept All
            </button>
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
