"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import type { ArticleContentModel } from "./ArticleContentRenderer";

type PlayerState = "idle" | "speaking" | "paused";

function extractNarrationText(title: string, excerpt: string, model: ArticleContentModel): string {
  if (model.isRich) {
    if (typeof DOMParser === "undefined") {
      return `${title}. ${excerpt}`;
    }

    const doc = new DOMParser().parseFromString(model.html || "", "text/html");
    const bodyText = doc.body.textContent?.replace(/\s+/g, " ").trim() || "";
    return `${title}. ${excerpt}. ${bodyText}`.trim();
  }

  const bodyText = (model.blocks || [])
    .map((block) => {
      if (block.type === "heading") return block.text;
      if (block.type === "blockquote") return block.text;
      if (block.type === "paragraph") return block.text;
      if (block.type === "unordered-list" || block.type === "ordered-list") return block.items.join(". ");
      if (block.block.kind === "quote-block") {
        return `${block.block.data.quote} ${block.block.data.attribution || ""}`.trim();
      }
      if (block.block.kind === "timeline") {
        return block.block.items.map((item) => `${item.label}. ${item.title}. ${item.note || ""}`.trim()).join(". ");
      }
      if (block.block.kind === "stats-card") {
        return block.block.items.map((item) => `${item.label}: ${item.value}. ${item.hint || ""}`.trim()).join(". ");
      }
      if (block.block.kind === "key-takeaways") {
        return block.block.data.items.join(". ");
      }
      if (block.block.kind === "comparison-table") {
        return block.block.data.rows.map((row) => row.join(". ")).join(". ");
      }
      return "";
    })
    .join(". ");

  return `${title}. ${excerpt}. ${bodyText}`.replace(/\s+/g, " ").trim();
}

function estimateMinutes(text: string, rate: number): string {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = words / Math.max(130, 170 * rate);
  return `${Math.max(1, Math.round(minutes))} min`;
}

const RATES = [0.9, 1, 1.15, 1.3];

export function ArticleAudioPlayer({
  title,
  excerpt,
  model,
}: {
  title: string;
  excerpt: string;
  model: ArticleContentModel;
}) {
  const [supported, setSupported] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const narrationText = useMemo(() => extractNarrationText(title, excerpt, model), [excerpt, model, title]);
  const estimatedAudio = useMemo(() => estimateMinutes(narrationText, rate), [narrationText, rate]);

  const estimatedDurationMs = useMemo(() => {
    const words = narrationText.split(/\s+/).filter(Boolean).length;
    return (words / Math.max(130, 170 * rate)) * 60 * 1000;
  }, [narrationText, rate]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      return;
    }

    setSupported(true);

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const startProgressTracking = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    startTimeRef.current = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / estimatedDurationMs) * 100);
      setProgress(pct);
      if (pct >= 100 && progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }, 250);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const stopPlayback = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlayerState("idle");
    setProgress(0);
    stopProgressTracking();
  };

  const cycleRate = () => {
    const currentIndex = RATES.indexOf(rate);
    const nextIndex = (currentIndex + 1) % RATES.length;
    setRate(RATES[nextIndex]);
  };

  const togglePlayback = () => {
    if (!supported) return;

    if (playerState === "speaking") {
      window.speechSynthesis.pause();
      setPlayerState("paused");
      stopProgressTracking();
      return;
    }

    if (playerState === "paused") {
      window.speechSynthesis.resume();
      setPlayerState("speaking");
      startProgressTracking();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narrationText);
    const preferredVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onend = () => {
      utteranceRef.current = null;
      setPlayerState("idle");
      setProgress(100);
      stopProgressTracking();
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setPlayerState("idle");
      setProgress(0);
      stopProgressTracking();
    };
    utterance.onpause = () => {
      setPlayerState("paused");
      stopProgressTracking();
    };
    utterance.onresume = () => {
      setPlayerState("speaking");
      startProgressTracking();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlayerState("speaking");
    setProgress(0);
    startProgressTracking();
  };

  if (!supported) {
    return null;
  }

  const isActive = playerState !== "idle";

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0F172A] overflow-hidden">
      {/* Progress bar */}
      <div className="h-[3px] w-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full bg-[#16A34A] transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
        {/* Play / Pause button */}
        <button
          type="button"
          onClick={togglePlayback}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
            isActive
              ? "bg-[#16A34A] text-white shadow-md shadow-[#16A34A]/20"
              : "bg-[#16A34A]/10 text-[#16A34A] hover:bg-[#16A34A]/20"
          }`}
        >
          {playerState === "speaking" ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px]" />
          )}
        </button>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isActive ? (
              <Volume2 className="h-3.5 w-3.5 shrink-0 text-[#16A34A] animate-pulse" />
            ) : (
              <Headphones className="h-3.5 w-3.5 shrink-0 text-[#16A34A]" />
            )}
            <p className="truncate text-sm font-bold text-[#0F172A] dark:text-white">
              {isActive
                ? playerState === "paused"
                  ? "Paused"
                  : "Listening…"
                : "Listen to this article"}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-[#64748B] dark:text-gray-400">
            {estimatedAudio} · Browser voice · {rate}x speed
          </p>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Speed toggle */}
          <button
            type="button"
            onClick={cycleRate}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-black text-[#0F172A] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-700 dark:text-white dark:hover:border-[#16A34A]/30"
          >
            {rate}x
          </button>

          {/* Stop / Reset */}
          {isActive && (
            <button
              type="button"
              onClick={stopPlayback}
              className="rounded-lg border border-gray-200 p-1.5 text-[#64748B] transition-colors hover:border-red-300 hover:text-red-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-800 dark:hover:text-red-400"
              title="Stop playback"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
