"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, ChevronDown, X } from "lucide-react";
import type { TeamXI, XIPlayer, Formation } from "../data/worldCupXI";
import { FORMATIONS, LEAGUES } from "../data/worldCupXI";

// ─── HELPERS ────────────────────────────────────────────────

const FLAG_URL = (code: string) =>
  `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

const POS_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  GK:  { bg: "#F59E0B", text: "#78350F", ring: "rgba(245,158,11,0.5)" },
  DEF: { bg: "#3B82F6", text: "#1E3A5F", ring: "rgba(59,130,246,0.5)" },
  MID: { bg: "#16A34A", text: "#052E16", ring: "rgba(22,163,74,0.5)" },
  FWD: { bg: "#EF4444", text: "#450A0A", ring: "rgba(239,68,68,0.5)" },
};

function getRatingColor(rating: number) {
  if (rating >= 9) return "#16A34A";
  if (rating >= 8) return "#22C55E";
  if (rating >= 7) return "#EAB308";
  return "#94A3B8";
}

// ─── PLAYER MARKER (on-pitch dot) ───────────────────────────

interface PlayerMarkerProps {
  player: XIPlayer;
  index: number;
  onSelect: (player: XIPlayer, rect: DOMRect) => void;
  isSelected: boolean;
}

function PlayerMarker({ player, index, onSelect, isSelected }: PlayerMarkerProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const posColor = POS_COLORS[player.position] ?? POS_COLORS.MID;

  const handleClick = useCallback(() => {
    if (ref.current) {
      onSelect(player, ref.current.getBoundingClientRect());
    }
  }, [player, onSelect]);

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.08 * index, type: "spring", stiffness: 260, damping: 20 }}
      onClick={handleClick}
      onMouseEnter={handleClick}
      className="group relative flex flex-col items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-xl"
      aria-label={`${player.name} — ${player.club}`}
      style={{ zIndex: isSelected ? 30 : 10 }}
    >
      {/* Rating badge */}
      {player.rating && (
        <motion.span
          className="absolute -top-1 -right-1 z-20 flex h-[22px] min-w-[22px] items-center justify-center rounded-md px-1 text-[10px] font-black text-white shadow-lg"
          style={{ backgroundColor: getRatingColor(player.rating) }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.08 * index + 0.3, type: "spring" }}
        >
          {player.rating.toFixed(1)}
        </motion.span>
      )}

      {/* Player image circle */}
      <div
        className="relative h-[52px] w-[52px] sm:h-[62px] sm:w-[62px] rounded-full overflow-hidden border-[2.5px] shadow-lg transition-transform duration-300 group-hover:scale-110"
        style={{
          borderColor: isSelected ? "#ffffff" : posColor.bg,
          boxShadow: isSelected
            ? `0 0 0 3px ${posColor.ring}, 0 8px 24px rgba(0,0,0,0.4)`
            : `0 4px 16px rgba(0,0,0,0.3)`,
        }}
      >
        <img
          src={player.image}
          alt={player.name}
          className="h-full w-full object-cover object-top bg-slate-700"
          loading="lazy"
          onError={(e) => {
            // Fallback to initials on error
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent && !parent.querySelector(".initials-fallback")) {
              const div = document.createElement("div");
              div.className = "initials-fallback absolute inset-0 flex items-center justify-center text-white font-black text-lg";
              div.style.background = posColor.bg;
              div.textContent = player.displayName.split(" ").map(w => w[0]).join("").slice(0, 2);
              parent.appendChild(div);
            }
          }}
        />
      </div>

      {/* Club badge (overlaid bottom-right of the circle) */}
      <div className="absolute bottom-5 -right-0.5 sm:bottom-6 z-10 h-[20px] w-[20px] sm:h-[22px] sm:w-[22px] rounded-full bg-white dark:bg-[#1E293B] shadow-md flex items-center justify-center p-[2px]">
        <img
          src={player.clubLogo}
          alt={player.club}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Player name tag */}
      <div className="rounded-md bg-[#0B1120]/90 px-2 py-0.5 backdrop-blur-sm shadow-md">
        <span className="text-[10px] sm:text-[11px] font-bold text-white whitespace-nowrap leading-none">
          {player.displayName}
        </span>
      </div>
    </motion.button>
  );
}

// ─── TOOLTIP (expanded player info — FootMob style) ─────────

interface TooltipProps {
  player: XIPlayer;
  onClose: () => void;
}

function PlayerTooltip({ player, onClose }: TooltipProps) {
  const posColor = POS_COLORS[player.position] ?? POS_COLORS.MID;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-x-3 bottom-3 sm:absolute sm:inset-auto sm:bottom-full sm:left-1/2 sm:-translate-x-1/2 sm:mb-3 sm:w-[340px] z-50 rounded-2xl border border-white/10 bg-[#0F172A]/95 backdrop-blur-xl p-4 shadow-2xl shadow-black/40"
      role="tooltip"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close on mobile */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 sm:hidden p-1 rounded-full bg-white/10 text-white/60"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2"
          style={{ borderColor: posColor.bg }}
        >
          <img src={player.image} alt={player.name} className="h-full w-full object-cover object-top bg-slate-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-outfit text-base font-black text-white truncate">{player.name}</h3>
            {player.rating && (
              <span
                className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-black text-white"
                style={{ backgroundColor: getRatingColor(player.rating) }}
              >
                {player.rating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/60">
            <img src={player.clubLogo} alt={player.club} className="h-4 w-4 object-contain" />
            <span className="font-medium">{player.club}</span>
            <span className="text-white/30">·</span>
            <img src={FLAG_URL(player.countryCode)} alt={player.country} className="h-3 w-auto rounded-[2px]" />
            <span>{player.country}</span>
          </div>
        </div>
      </div>

      {/* Position + Number */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
          style={{ backgroundColor: `${posColor.bg}20`, color: posColor.bg }}
        >
          {player.position === "GK" ? "Goalkeeper" : player.position === "DEF" ? "Defender" : player.position === "MID" ? "Midfielder" : "Forward"}
        </span>
        <span className="text-[10px] font-bold text-white/40">#{player.number}</span>
      </div>

      {/* Reason */}
      <p className="mt-3 text-[13px] leading-relaxed text-white/80 font-medium">
        {player.reason}
      </p>

      {/* Stats */}
      {player.stats && (
        <div className="mt-3 rounded-xl bg-white/5 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1">Tournament Stats</p>
          <p className="text-[12px] font-semibold text-[#4ADE80]">{player.stats}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── PITCH SVG BACKGROUND ───────────────────────────────────

function PitchBackground() {
  return (
    <svg
      viewBox="0 0 680 1000"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a5c2a" />
          <stop offset="50%" stopColor="#1e6b30" />
          <stop offset="100%" stopColor="#1a5c2a" />
        </linearGradient>
        {/* Grass stripes */}
        <pattern id="grassStripes" width="680" height="100" patternUnits="userSpaceOnUse">
          <rect width="680" height="50" fill="rgba(255,255,255,0.015)" />
          <rect y="50" width="680" height="50" fill="transparent" />
        </pattern>
      </defs>

      {/* Pitch base */}
      <rect width="680" height="1000" rx="16" fill="url(#pitchGrad)" />
      <rect width="680" height="1000" rx="16" fill="url(#grassStripes)" />

      {/* Outer boundary */}
      <rect x="30" y="30" width="620" height="940" rx="4" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />

      {/* Halfway line */}
      <line x1="30" y1="500" x2="650" y2="500" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />

      {/* Center circle */}
      <circle cx="340" cy="500" r="80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <circle cx="340" cy="500" r="4" fill="rgba(255,255,255,0.3)" />

      {/* Top penalty area */}
      <rect x="170" y="30" width="340" height="160" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <rect x="230" y="30" width="220" height="60" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <circle cx="340" cy="142" r="4" fill="rgba(255,255,255,0.25)" />
      {/* Top penalty arc */}
      <path d="M 260 190 Q 340 230 420 190" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* Bottom penalty area */}
      <rect x="170" y="810" width="340" height="160" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <rect x="230" y="910" width="220" height="60" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <circle cx="340" cy="858" r="4" fill="rgba(255,255,255,0.25)" />
      {/* Bottom penalty arc */}
      <path d="M 260 810 Q 340 770 420 810" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

      {/* Corner arcs */}
      <path d="M 30 38 Q 38 30 46 30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <path d="M 634 30 Q 642 30 650 38" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <path d="M 30 962 Q 38 970 46 970" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <path d="M 634 970 Q 642 970 650 962" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
    </svg>
  );
}

// ─── FORMATION SELECTOR ─────────────────────────────────────

interface FormationSelectorProps {
  current: string;
  onChange: (id: string) => void;
}

function FormationSelector({ current, onChange }: FormationSelectorProps) {
  const [open, setOpen] = useState(false);
  const formation = FORMATIONS[current];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
      >
        <span className="text-white/40">Formation</span>
        <span className="text-white font-black">{formation?.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-1 z-40 rounded-xl border border-white/10 bg-[#0F172A]/95 backdrop-blur-xl p-1 shadow-xl"
          >
            {Object.values(FORMATIONS).map((f) => (
              <button
                key={f.id}
                onClick={() => { onChange(f.id); setOpen(false); }}
                className={`block w-full rounded-lg px-4 py-2 text-left text-[12px] font-bold transition-colors ${
                  f.id === current
                    ? "bg-[#16A34A]/20 text-[#4ADE80]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────

interface PitchXIProps {
  team: TeamXI;
  /** Compact mode for homepage widget */
  compact?: boolean;
}

export function PitchXI({ team, compact = false }: PitchXIProps) {
  const [formationId, setFormationId] = useState(team.formationId);
  const [selectedPlayer, setSelectedPlayer] = useState<XIPlayer | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);

  const formation = FORMATIONS[formationId] ?? FORMATIONS["4-3-3"];
  const playerMap = new Map(team.players.map((p) => [p.id, p]));

  // Close tooltip on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pitchRef.current && !pitchRef.current.contains(e.target as Node)) {
        setSelectedPlayer(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedPlayer(null);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSelectPlayer = useCallback((player: XIPlayer) => {
    setSelectedPlayer((prev) => (prev?.id === player.id ? null : player));
  }, []);

  const isTournament = team.context.type === "tournament";
  const contextLabel = isTournament
    ? (team.context as any).tournament
    : `${LEAGUES[(team.context as any).league]?.name ?? "League"} MW${(team.context as any).matchweek}`;

  return (
    <div
      ref={pitchRef}
      className={`relative mx-auto w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-black/20 ${
        compact ? "max-w-[440px]" : "max-w-[600px]"
      }`}
    >
      {/* Top gradient overlay for header */}
      <div className="absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            {isTournament && <Trophy className="h-4 w-4 text-[#FBBF24]" />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
              {contextLabel}
            </span>
          </div>
          <h2 className={`font-outfit font-black text-white ${compact ? "text-lg" : "text-xl sm:text-2xl"} mt-0.5 leading-tight`}>
            {team.title}
          </h2>
          {!compact && team.subtitle && (
            <p className="mt-0.5 text-[11px] text-white/50 font-medium">{team.subtitle}</p>
          )}
        </div>
        {!compact && <FormationSelector current={formationId} onChange={setFormationId} />}
      </div>

      {/* Pitch */}
      <div className={`relative ${compact ? "aspect-[3/4.2]" : "aspect-[3/4.5]"}`}>
        <PitchBackground />

        {/* Player rows */}
        <div className="absolute inset-0 flex flex-col-reverse justify-between px-3 sm:px-6 pt-20 pb-4 sm:pt-24 sm:pb-6">
          {formation.rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center justify-around">
              {row.map((playerId, pIdx) => {
                const player = playerMap.get(playerId);
                if (!player) return null;
                return (
                  <div key={playerId} className="relative">
                    <PlayerMarker
                      player={player}
                      index={rowIdx * 4 + pIdx}
                      onSelect={(p) => handleSelectPlayer(p)}
                      isSelected={selectedPlayer?.id === playerId}
                    />
                    {/* Tooltip */}
                    <AnimatePresence>
                      {selectedPlayer?.id === playerId && (
                        <PlayerTooltip
                          player={player}
                          onClose={() => setSelectedPlayer(null)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom info strip */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3 sm:px-5 sm:py-4 pointer-events-none">
        <div className="flex items-center gap-2 text-[10px] text-white/50 font-medium">
          <Star className="h-3 w-3 text-[#FBBF24]" />
          <span>Tap a player for the reason behind the pick</span>
        </div>
        {!compact && team.author && (
          <span className="text-[10px] text-white/30 font-medium">by {team.author}</span>
        )}
      </div>
    </div>
  );
}

export default PitchXI;
