"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function ChallengeTheTake() {
  const [challengeText, setChallengeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!challengeText.trim()) return;
    
    setIsSubmitting(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    setChallengeText("");
    
    // Reset success state after a few seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 4000);
  };

  return (
    <div className="mx-auto max-w-xl text-left mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-[1px] w-8 bg-[#16A34A]/50"></div>
        <h3 className="font-outfit text-sm font-semibold tracking-widest uppercase text-gray-300">Challenge the Take</h3>
      </div>
      
      <p className="text-sm text-gray-500 mb-6 font-light">Prove me wrong below. The strongest argument gets featured tomorrow.</p>
      
      <div className="relative">
        <textarea 
          value={challengeText}
          onChange={(e) => setChallengeText(e.target.value)}
          disabled={isSubmitting || isSuccess}
          className="w-full bg-transparent border-b border-white/10 p-2 pb-10 text-white text-base focus:outline-none focus:border-[#16A34A] transition-colors resize-none disabled:opacity-50"
          rows={2}
          placeholder="I completely disagree because..."
          maxLength={280}
        />
        
        {/* X/Twitter Style Character Count Ring */}
        <div className="absolute bottom-3 left-2 flex items-center justify-center opacity-70">
          {challengeText.length > 0 && (
            <div className="relative flex items-center justify-center h-5 w-5">
              <svg className="transform -rotate-90 w-full h-full">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="transparent" className="text-gray-800" />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="transparent"
                  strokeDasharray="50.26" /* 2 * PI * 8 */
                  strokeDashoffset={Math.max(0, 50.26 - (50.26 * challengeText.length) / 280)}
                  className={`${
                    challengeText.length >= 280 
                      ? "text-red-500" 
                      : challengeText.length > 260 
                        ? "text-yellow-500" 
                        : "text-[#16A34A]"
                  } transition-all duration-200 ease-out`}
                />
              </svg>
            </div>
          )}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || isSuccess || !challengeText.trim()}
          className={`absolute bottom-2 right-0 font-medium text-xs tracking-wide px-4 py-1.5 rounded-full transition-all duration-300 ${
            isSuccess 
              ? "text-[#16A34A]" 
              : "text-gray-300 hover:text-white disabled:opacity-30"
          }`}
        >
          {isSubmitting ? "Sending..." : isSuccess ? (
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Sent</span>
          ) : "Submit"}
        </button>
      </div>
    </div>
  );
}
