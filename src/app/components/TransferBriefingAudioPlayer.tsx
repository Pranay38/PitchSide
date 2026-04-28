"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Pause, Play, Radio, RotateCcw, Volume2 } from "lucide-react";

type PlayerState = "idle" | "speaking" | "paused";

const RATES = [0.9, 1, 1.15, 1.3];

function estimateMinutes(text: string, rate: number): string {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = words / Math.max(130, 170 * rate);
  return `${Math.max(1, Math.round(minutes))} min`;
}

export function TransferBriefingAudioPlayer({
  title,
  summary,
  text,
}: {
  title: string;
  summary: string;
  text: string;
}) {
  const [supported, setSupported] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const estimatedAudio = useMemo(() => estimateMinutes(text, rate), [text, rate]);
  const estimatedDurationMs = useMemo(() => {
    const words = text.split(/\s+/).filter(Boolean).length;
    return (words / Math.max(130, 170 * rate)) * 60 * 1000;
  }, [text, rate]);

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
    if (!progressInterval.current) return;
    clearInterval(progressInterval.current);
    progressInterval.current = null;
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
    const utterance = new SpeechSynthesisUtterance(text);
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

  const isActive = playerState !== "idle";

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#16A34A]/20 bg-[#08111f] text-white shadow-xl shadow-[#0F172A]/25">
      <div className="h-[3px] w-full bg-white/5">
        <div
          className="h-full bg-[#16A34A] transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-5 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={togglePlayback}
              disabled={!supported}
              className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                supported
                  ? isActive
                    ? "bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/20"
                    : "bg-white/10 text-white hover:bg-white/15"
                  : "cursor-not-allowed bg-white/5 text-white/50"
              }`}
            >
              {playerState === "speaking" ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px]" />
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <Volume2 className="h-3.5 w-3.5 text-[#4ade80] animate-pulse" />
                ) : (
                  <Radio className="h-3.5 w-3.5 text-[#4ade80]" />
                )}
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#4ade80]">
                  Audio Briefing
                </p>
              </div>
              <h3 className="mt-2 text-2xl font-black font-outfit text-white">
                {title}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                {summary}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                {supported ? `${estimatedAudio} narration · Browser voice · ${rate}x speed` : "Audio playback requires browser speech synthesis"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            <button
              type="button"
              onClick={cycleRate}
              disabled={!supported}
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:border-[#16A34A]/40 hover:text-[#4ade80] disabled:cursor-not-allowed disabled:text-white/40"
            >
              {rate}x
            </button>
            {isActive && (
              <button
                type="button"
                onClick={stopPlayback}
                className="rounded-full border border-white/10 p-2 text-white/70 transition-colors hover:border-rose-400/30 hover:text-rose-300"
                title="Stop playback"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-[#4ade80]" />
            <span>
              {isActive
                ? playerState === "paused"
                  ? "Brief paused"
                  : "Brief in your ears now"
                : "Tap play for the narrated market read"}
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            Transfer Radar Pro
          </span>
        </div>
      </div>
    </div>
  );
}
