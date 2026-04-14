"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ScrollytellingStep {
  id: string;
  content: React.ReactNode;
  visual: React.ReactNode;
}

export interface ScrollytellingPitchProps {
  steps: ScrollytellingStep[];
}

export function ScrollytellingPitch({ steps }: ScrollytellingPitchProps) {
  const [activeStepId, setActiveStepId] = useState<string>(steps[0]?.id || "");
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = new Map();
    
    // Create an intersection observer for each step
    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const stepId = entry.target.getAttribute("data-step-id");
          if (stepId) {
            setActiveStepId(stepId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(callback, {
      root: null,
      rootMargin: "-40% 0px -40% 0px", // Trigger when element is near the middle of the screen
      threshold: 0,
    });

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [steps]);

  const activeVisual = steps.find((s) => s.id === activeStepId)?.visual;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Scrolling Text */}
        <div className="space-y-[60vh] pb-[60vh] pt-[20vh]">
          {steps.map((step, index) => (
            <div
              key={step.id}
              ref={(el) => {
                stepRefs.current[index] = el;
              }}
              data-step-id={step.id}
              className={`transition-all duration-700 p-8 rounded-3xl backdrop-blur-md border border-white/5 ${
                activeStepId === step.id
                  ? "bg-white/10 opacity-100 shadow-2xl scale-100"
                  : "bg-transparent opacity-40 scale-95"
              }`}
            >
              {step.content}
            </div>
          ))}
        </div>

        {/* Right Column: Sticky Visual */}
        <div className="pointer-events-none hidden lg:block">
          <div className="sticky top-1/2 -translate-y-1/2 h-[70vh] rounded-3xl overflow-hidden bg-[#060E20] border border-white/10 shadow-2xl flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStepId}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full"
              >
                {activeVisual}
              </motion.div>
            </AnimatePresence>
            
            {/* Ambient Background Glow for cinematic feel */}
            <div className="absolute inset-0 bg-[#16A34A] opacity-5 mix-blend-screen pointer-events-none blur-3xl"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
