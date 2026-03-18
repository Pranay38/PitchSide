import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Pause, Play, Square } from "lucide-react";
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
  return `${Math.max(1, Math.round(minutes))} min audio`;
}

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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const narrationText = useMemo(() => extractNarrationText(title, excerpt, model), [excerpt, model, title]);
  const estimatedAudio = useMemo(() => estimateMinutes(narrationText, rate), [narrationText, rate]);

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
    };
  }, []);

  const stopPlayback = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlayerState("idle");
  };

  const togglePlayback = () => {
    if (!supported) return;

    if (playerState === "speaking") {
      window.speechSynthesis.pause();
      setPlayerState("paused");
      return;
    }

    if (playerState === "paused") {
      window.speechSynthesis.resume();
      setPlayerState("speaking");
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
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setPlayerState("idle");
    };
    utterance.onpause = () => setPlayerState("paused");
    utterance.onresume = () => setPlayerState("speaking");

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlayerState("speaking");
  };

  if (!supported) {
    return null;
  }

  return (
    <div className="mb-8 rounded-[2rem] border border-[#16A34A]/15 bg-[#0F172A] p-5 text-white shadow-xl shadow-[#0F172A]/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#86efac]">
            <Headphones className="h-3.5 w-3.5" />
            Listen To Article
          </p>
          <h2 className="mt-3 text-xl font-black font-outfit text-white">Audio mode for this long read</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">
            Browser voice playback for a cleaner listen-through. {estimatedAudio}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-full bg-[#16A34A] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
          >
            {playerState === "speaking" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {playerState === "speaking" ? "Pause audio" : playerState === "paused" ? "Resume audio" : "Play audio"}
          </button>
          <button
            type="button"
            onClick={stopPlayback}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-bold text-white/82 transition-colors hover:border-white/20 hover:text-white"
          >
            <Square className="h-4 w-4" />
            Stop
          </button>
          <select
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white outline-none"
          >
            <option value={0.9}>0.9x</option>
            <option value={1}>1.0x</option>
            <option value={1.15}>1.15x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
