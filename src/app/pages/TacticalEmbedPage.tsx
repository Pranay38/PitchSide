import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "@/lib/router-compat";
import { LoaderCircle, Pause, Play, Square } from "lucide-react";

interface Player {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

interface Arrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

interface Keyframe {
  id: string;
  players: Player[];
  arrows: Arrow[];
}

interface SavedTactic {
  id: string;
  title: string;
  formation: string;
  keyframes: Keyframe[];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function interpolatePlayers(fromPlayers: Player[], toPlayers: Player[], t: number): Player[] {
  const toById = new Map(toPlayers.map((player) => [player.id, player]));

  return fromPlayers.map((player) => {
    const target = toById.get(player.id);
    if (!target) return player;

    return {
      ...player,
      x: lerp(player.x, target.x, t),
      y: lerp(player.y, target.y, t),
      label: t < 0.5 ? player.label : target.label,
      color: t < 0.5 ? player.color : target.color,
    };
  });
}

function interpolateArrows(fromArrows: Arrow[], toArrows: Arrow[], t: number): Arrow[] {
  const maxCount = Math.max(fromArrows.length, toArrows.length);
  const output: Arrow[] = [];

  for (let index = 0; index < maxCount; index += 1) {
    const start = fromArrows[index] || toArrows[index];
    const end = toArrows[index] || fromArrows[index];
    if (!start || !end) continue;

    output.push({
      x1: lerp(start.x1, end.x1, t),
      y1: lerp(start.y1, end.y1, t),
      x2: lerp(start.x2, end.x2, t),
      y2: lerp(start.y2, end.y2, t),
      color: t < 0.5 ? start.color : end.color,
    });
  }

  return output;
}

function PitchMarkings() {
  return (
    <g stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.3">
      <rect x="5" y="2" width="90" height="96" rx="1" />
      <line x1="5" y1="50" x2="95" y2="50" />
      <circle cx="50" cy="50" r="12" />
      <circle cx="50" cy="50" r="0.8" fill="#ffffff" />
      <rect x="22" y="2" width="56" height="18" />
      <rect x="32" y="2" width="36" height="7" />
      <circle cx="50" cy="14" r="0.8" fill="#ffffff" />
      <path d="M 36 20 A 12 12 0 0 0 64 20" />
      <rect x="22" y="80" width="56" height="18" />
      <rect x="32" y="91" width="36" height="7" />
      <circle cx="50" cy="86" r="0.8" fill="#ffffff" />
      <path d="M 36 80 A 12 12 0 0 1 64 80" />
      <path d="M 5 5 A 3 3 0 0 0 8 2" />
      <path d="M 92 2 A 3 3 0 0 0 95 5" />
      <path d="M 5 95 A 3 3 0 0 1 8 98" />
      <path d="M 92 98 A 3 3 0 0 1 95 95" />
    </g>
  );
}

export function TacticalEmbedPage() {
  const { id } = useParams();
  const [tactic, setTactic] = useState<SavedTactic | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playhead, setPlayhead] = useState(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playheadRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastTickRef.current = null;
  }, []);

  const applyInterpolatedFrame = useCallback((progressInput: number, frames: Keyframe[]) => {
    if (frames.length === 0) return;

    const maxProgress = Math.max(0, frames.length - 1);
    const progress = clamp(progressInput, 0, maxProgress);
    const fromIndex = Math.floor(progress);
    const toIndex = Math.min(maxProgress, fromIndex + 1);
    const localProgress = progress - fromIndex;
    const eased = easeInOutSine(localProgress);
    const fromFrame = frames[fromIndex];
    const toFrame = frames[toIndex];

    if (!fromFrame || !toFrame) return;

    playheadRef.current = progress;
    setPlayhead(progress);
    setCurrentFrameIndex(fromIndex);
    setPlayers(interpolatePlayers(fromFrame.players, toFrame.players, eased));
    setArrows(interpolateArrows(fromFrame.arrows, toFrame.arrows, eased));
  }, []);

  useEffect(() => {
    if (!id) {
      setError("Missing tactical sequence.");
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    fetch(`/api/tactics?id=${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load tactical sequence.");
        }
        return response.json();
      })
      .then((data: SavedTactic) => {
        if (!mounted) return;
        setTactic(data);
        setError("");
        setLoading(false);
        applyInterpolatedFrame(0, data.keyframes);
      })
      .catch((fetchError) => {
        if (!mounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Could not load tactical sequence.");
        setLoading(false);
      });

    return () => {
      mounted = false;
      stopPlayback();
    };
  }, [applyInterpolatedFrame, id, stopPlayback]);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const handlePlay = () => {
    if (!tactic || tactic.keyframes.length <= 1) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsPlaying(true);
    lastTickRef.current = null;
    const maxProgress = tactic.keyframes.length - 1;

    const tick = (timestamp: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const delta = timestamp - lastTickRef.current;
      lastTickRef.current = timestamp;
      const nextProgress = playheadRef.current + delta / 1200;

      if (nextProgress >= maxProgress) {
        applyInterpolatedFrame(maxProgress, tactic.keyframes);
        stopPlayback();
        return;
      }

      applyInterpolatedFrame(nextProgress, tactic.keyframes);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="min-h-screen bg-[#08111f] px-4 py-4 text-white">
      <div className="mx-auto max-w-[780px] rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#0f172a,#111f35)] p-4 shadow-2xl shadow-[#0F172A]/20">
        {loading ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 text-white/72">
            <LoaderCircle className="h-8 w-8 animate-spin text-[#4ade80]" />
            <p className="text-sm font-medium">Loading tactical sequence...</p>
          </div>
        ) : error || !tactic ? (
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-3 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Tactical Board</p>
            <h1 className="text-2xl font-black font-outfit text-white">Sequence unavailable</h1>
            <p className="max-w-md text-sm leading-6 text-white/68">{error || "This embed could not be loaded."}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#4ade80]">Tactical Board</p>
                <h1 className="mt-2 text-2xl font-black font-outfit text-white">{tactic.title}</h1>
                <p className="mt-2 text-sm text-white/68">{tactic.formation} · {tactic.keyframes.length} frame{tactic.keyframes.length === 1 ? "" : "s"}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlay}
                  className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopPlayback();
                    applyInterpolatedFrame(0, tactic.keyframes);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/82 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Square className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <svg viewBox="0 0 100 100" className="w-full aspect-square">
                <defs>
                  <linearGradient id="pitch-gradient-embed" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#15803d" />
                    <stop offset="25%" stopColor="#166534" />
                    <stop offset="50%" stopColor="#15803d" />
                    <stop offset="75%" stopColor="#166534" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                  <pattern id="grass-embed" width="100" height="10" patternUnits="userSpaceOnUse">
                    <rect width="100" height="5" fill="#16a34a" opacity="0.15" />
                    <rect y="5" width="100" height="5" fill="#15803d" opacity="0.15" />
                  </pattern>
                </defs>

                <rect width="100" height="100" fill="url(#pitch-gradient-embed)" />
                <rect width="100" height="100" fill="url(#grass-embed)" />
                <PitchMarkings />

                {arrows.map((arrow, index) => (
                  <line
                    key={`arrow-${index}`}
                    x1={arrow.x1}
                    y1={arrow.y1}
                    x2={arrow.x2}
                    y2={arrow.y2}
                    stroke={arrow.color}
                    strokeWidth="0.8"
                    strokeDasharray="2,1"
                    opacity="0.85"
                  />
                ))}

                {players.map((player) => (
                  <g key={player.id}>
                    <circle cx={player.x} cy={player.y} r="3.8" fill={player.color} opacity="0.2" />
                    <circle cx={player.x} cy={player.y} r="2.8" fill={player.color} stroke="#ffffff" strokeWidth="0.5" />
                    <text
                      x={player.x}
                      y={player.y + 0.6}
                      textAnchor="middle"
                      fontSize="1.8"
                      fontWeight="bold"
                      fill="#ffffff"
                      style={{ textShadow: "0 0.5px 1px rgba(0,0,0,0.5)" }}
                    >
                      {player.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                <span>Sequence Progress</span>
                <span>Frame {currentFrameIndex + 1} / {Math.max(1, tactic.keyframes.length)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, tactic.keyframes.length - 1)}
                step={0.01}
                value={playhead}
                onChange={(event) => {
                  stopPlayback();
                  applyInterpolatedFrame(Number(event.target.value), tactic.keyframes);
                }}
                className="w-full accent-[#16A34A]"
                disabled={tactic.keyframes.length <= 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
