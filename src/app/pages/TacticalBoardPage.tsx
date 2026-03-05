import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router";
import {
    ArrowLeft, RotateCcw, Download, Palette, Users, Pencil, Eraser,
    ChevronDown, Trash2, Play, Pause, Plus, Save, FolderOpen
} from "lucide-react";
import { SEO } from "../components/SEO";

/* ─── Types ─── */
interface Player {
    id: string;
    x: number; // % of pitch width
    y: number; // % of pitch height
    label: string;
    color: string;
}

interface Arrow {
    x1: number; y1: number;
    x2: number; y2: number;
    color: string;
}

export interface Keyframe {
    id: string;
    players: Player[];
    arrows: Arrow[];
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
    const toById = new Map(toPlayers.map((p) => [p.id, p]));

    return fromPlayers.map((fromPlayer) => {
        const toPlayer = toById.get(fromPlayer.id);
        if (!toPlayer) return fromPlayer;

        return {
            ...fromPlayer,
            x: lerp(fromPlayer.x, toPlayer.x, t),
            y: lerp(fromPlayer.y, toPlayer.y, t),
            label: t < 0.5 ? fromPlayer.label : toPlayer.label,
            color: t < 0.5 ? fromPlayer.color : toPlayer.color,
        };
    });
}

function interpolateArrows(fromArrows: Arrow[], toArrows: Arrow[], t: number): Arrow[] {
    const maxCount = Math.max(fromArrows.length, toArrows.length);
    const output: Arrow[] = [];

    for (let idx = 0; idx < maxCount; idx++) {
        const start = fromArrows[idx] || toArrows[idx];
        const end = toArrows[idx] || fromArrows[idx];
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

/* ─── Formation Presets ─── */
const FORMATIONS: Record<string, { name: string; positions: { x: number; y: number; label: string }[] }> = {
    "4-3-3": {
        name: "4-3-3",
        positions: [
            { x: 50, y: 92, label: "GK" },
            { x: 18, y: 75, label: "LB" }, { x: 38, y: 78, label: "CB" }, { x: 62, y: 78, label: "CB" }, { x: 82, y: 75, label: "RB" },
            { x: 30, y: 55, label: "CM" }, { x: 50, y: 50, label: "CM" }, { x: 70, y: 55, label: "CM" },
            { x: 18, y: 25, label: "LW" }, { x: 50, y: 22, label: "ST" }, { x: 82, y: 25, label: "RW" },
        ],
    },
    "4-4-2": {
        name: "4-4-2",
        positions: [
            { x: 50, y: 92, label: "GK" },
            { x: 18, y: 75, label: "LB" }, { x: 38, y: 78, label: "CB" }, { x: 62, y: 78, label: "CB" }, { x: 82, y: 75, label: "RB" },
            { x: 15, y: 52, label: "LM" }, { x: 38, y: 55, label: "CM" }, { x: 62, y: 55, label: "CM" }, { x: 85, y: 52, label: "RM" },
            { x: 38, y: 25, label: "ST" }, { x: 62, y: 25, label: "ST" },
        ],
    },
    "3-5-2": {
        name: "3-5-2",
        positions: [
            { x: 50, y: 92, label: "GK" },
            { x: 25, y: 78, label: "CB" }, { x: 50, y: 80, label: "CB" }, { x: 75, y: 78, label: "CB" },
            { x: 12, y: 55, label: "LWB" }, { x: 35, y: 58, label: "CM" }, { x: 50, y: 52, label: "CM" }, { x: 65, y: 58, label: "CM" }, { x: 88, y: 55, label: "RWB" },
            { x: 38, y: 25, label: "ST" }, { x: 62, y: 25, label: "ST" },
        ],
    },
    "4-2-3-1": {
        name: "4-2-3-1",
        positions: [
            { x: 50, y: 92, label: "GK" },
            { x: 18, y: 75, label: "LB" }, { x: 38, y: 78, label: "CB" }, { x: 62, y: 78, label: "CB" }, { x: 82, y: 75, label: "RB" },
            { x: 38, y: 60, label: "CDM" }, { x: 62, y: 60, label: "CDM" },
            { x: 18, y: 40, label: "LW" }, { x: 50, y: 38, label: "CAM" }, { x: 82, y: 40, label: "RW" },
            { x: 50, y: 20, label: "ST" },
        ],
    },
    "3-4-3": {
        name: "3-4-3",
        positions: [
            { x: 50, y: 92, label: "GK" },
            { x: 25, y: 78, label: "CB" }, { x: 50, y: 80, label: "CB" }, { x: 75, y: 78, label: "CB" },
            { x: 15, y: 55, label: "LM" }, { x: 40, y: 58, label: "CM" }, { x: 60, y: 58, label: "CM" }, { x: 85, y: 55, label: "RM" },
            { x: 20, y: 25, label: "LW" }, { x: 50, y: 22, label: "ST" }, { x: 80, y: 25, label: "RW" },
        ],
    },
    "5-3-2": {
        name: "5-3-2",
        positions: [
            { x: 50, y: 92, label: "GK" },
            { x: 10, y: 72, label: "LWB" }, { x: 30, y: 78, label: "CB" }, { x: 50, y: 80, label: "CB" }, { x: 70, y: 78, label: "CB" }, { x: 90, y: 72, label: "RWB" },
            { x: 30, y: 55, label: "CM" }, { x: 50, y: 50, label: "CM" }, { x: 70, y: 55, label: "CM" },
            { x: 38, y: 25, label: "ST" }, { x: 62, y: 25, label: "ST" },
        ],
    },
};

const TEAM_COLORS = [
    { name: "Red", home: "#EF4444", away: "#3B82F6" },
    { name: "Blue", home: "#3B82F6", away: "#EF4444" },
    { name: "Green", home: "#22C55E", away: "#F97316" },
    { name: "Yellow", home: "#EAB308", away: "#8B5CF6" },
    { name: "White", home: "#E2E8F0", away: "#0F172A" },
];

const ARROW_COLORS = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#E2E8F0"];

/* ─── Pitch SVG Component ─── */
function PitchMarkings() {
    return (
        <g stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.3">
            {/* Outer boundary */}
            <rect x="5" y="2" width="90" height="96" rx="1" />
            {/* Half line */}
            <line x1="5" y1="50" x2="95" y2="50" />
            {/* Center circle */}
            <circle cx="50" cy="50" r="12" />
            <circle cx="50" cy="50" r="0.8" fill="#ffffff" />
            {/* Top penalty area */}
            <rect x="22" y="2" width="56" height="18" />
            <rect x="32" y="2" width="36" height="7" />
            <circle cx="50" cy="14" r="0.8" fill="#ffffff" />
            {/* Top penalty arc */}
            <path d="M 36 20 A 12 12 0 0 0 64 20" />
            {/* Bottom penalty area */}
            <rect x="22" y="80" width="56" height="18" />
            <rect x="32" y="91" width="36" height="7" />
            <circle cx="50" cy="86" r="0.8" fill="#ffffff" />
            {/* Bottom penalty arc */}
            <path d="M 36 80 A 12 12 0 0 1 64 80" />
            {/* Corner arcs */}
            <path d="M 5 5 A 3 3 0 0 0 8 2" />
            <path d="M 92 2 A 3 3 0 0 0 95 5" />
            <path d="M 5 95 A 3 3 0 0 1 8 98" />
            <path d="M 92 98 A 3 3 0 0 1 95 95" />
        </g>
    );
}

/* ─── Main Page ─── */
export function TacticalBoardPage() {
    const [formation, setFormation] = useState("4-3-3");
    const [players, setPlayers] = useState<Player[]>([]);
    const [arrows, setArrows] = useState<Arrow[]>([]);
    const [dragging, setDragging] = useState<string | null>(null);
    const [drawMode, setDrawMode] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
    const [activeColor, setActiveColor] = useState(0);
    const [arrowColor, setArrowColor] = useState(0);
    const [showFormations, setShowFormations] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Animation & Timeline State
    const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [playhead, setPlayhead] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [transitionMs, setTransitionMs] = useState(1200);
    const playheadRef = useRef(0);
    const isPlayingRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);
    const lastTickRef = useRef<number | null>(null);

    // Save/Load State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [saveTitle, setSaveTitle] = useState("");
    const [savedTactics, setSavedTactics] = useState<any[]>([]);
    const [isLoadingTactics, setIsLoadingTactics] = useState(false);

    const stopPlayback = useCallback(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        lastTickRef.current = null;
    }, []);

    const applyInterpolatedFrame = useCallback((rawProgress: number, frames: Keyframe[] = keyframes) => {
        if (frames.length === 0) return;

        const maxProgress = Math.max(0, frames.length - 1);
        const progress = clamp(rawProgress, 0, maxProgress);

        playheadRef.current = progress;
        setPlayhead(progress);

        const fromIdx = Math.floor(progress);
        const toIdx = Math.min(maxProgress, fromIdx + 1);
        const localProgress = progress - fromIdx;
        const eased = easeInOutSine(localProgress);

        const fromFrame = frames[fromIdx];
        const toFrame = frames[toIdx];
        if (!fromFrame || !toFrame) return;

        setPlayers(interpolatePlayers(fromFrame.players, toFrame.players, eased));
        setArrows(interpolateArrows(fromFrame.arrows, toFrame.arrows, eased));
        setCurrentFrameIndex(fromIdx);
    }, [keyframes]);

    // Initialize players from formation
    const initFormation = useCallback((key: string) => {
        const f = FORMATIONS[key];
        if (!f) return;
        stopPlayback();

        const colors = TEAM_COLORS[activeColor];
        const newPlayers = f.positions.map((p, i) => ({
            id: `p-${i}`,
            x: p.x,
            y: p.y,
            label: p.label,
            color: colors.home,
        }));

        setPlayers(newPlayers);
        setArrows([]);
        setFormation(key);

        // Reset timeline to a single starting frame
        const nextFrames = [{
            id: Date.now().toString(),
            players: JSON.parse(JSON.stringify(newPlayers)),
            arrows: []
        }];
        setKeyframes(nextFrames);
        setCurrentFrameIndex(0);
        playheadRef.current = 0;
        setPlayhead(0);
    }, [activeColor, stopPlayback]);

    useEffect(() => {
        initFormation("4-3-3");
    }, []); // eslint-disable-line

    // SVG coordinate helper
    const getSvgCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        const svg = svgRef.current;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
        const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100,
        };
    };

    // Drag handlers
    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, playerId?: string) => {
        if (drawMode) {
            const coords = getSvgCoords(e);
            if (coords) {
                stopPlayback();
                setDrawStart(coords);
                setDrawCurrent(coords);
            }
            return;
        }
        if (playerId) {
            stopPlayback();
            setDragging(playerId);
            e.preventDefault();
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (drawMode && drawStart) {
            const coords = getSvgCoords(e);
            if (coords) setDrawCurrent(coords);
        }

        if (dragging) {
            const coords = getSvgCoords(e);
            if (!coords) return;
            setPlayers(prev =>
                prev.map(p =>
                    p.id === dragging
                        ? { ...p, x: Math.max(2, Math.min(98, coords.x)), y: Math.max(2, Math.min(98, coords.y)) }
                        : p
                )
            );
            e.preventDefault();
        }
    };

    const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
        if (drawMode && drawStart) {
            const coords = getSvgCoords(e) || drawCurrent;
            if (coords) {
                const dx = coords.x - drawStart.x;
                const dy = coords.y - drawStart.y;
                if (Math.sqrt(dx * dx + dy * dy) > 3) {
                    setArrows(prev => [...prev, {
                        x1: drawStart.x, y1: drawStart.y,
                        x2: coords.x, y2: coords.y,
                        color: ARROW_COLORS[arrowColor],
                    }]);
                }
            }
            setDrawStart(null);
            setDrawCurrent(null);
        }
        setDragging(null);
    };

    // Download as PNG
    const handleDownload = () => {
        const svg = svgRef.current;
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1200;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            if (ctx) {
                ctx.drawImage(img, 0, 0, 1200, 1200);
                const link = document.createElement("a");
                link.download = `tactical-board-${formation}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            }
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    // Change team color
    const changeTeamColor = (idx: number) => {
        setActiveColor(idx);
        const colors = TEAM_COLORS[idx];
        setPlayers(prev => prev.map(p => ({ ...p, color: colors.home })));
        setShowColors(false);
    };

    // ─── Timeline / Animation Handlers ───
    const handleCaptureFrame = () => {
        stopPlayback();
        setKeyframes((prev) => {
            const nextFrames = [
                ...prev,
                {
                    id: Date.now().toString(),
                    players: JSON.parse(JSON.stringify(players)),
                    arrows: JSON.parse(JSON.stringify(arrows))
                }
            ];
            const nextIndex = nextFrames.length - 1;
            playheadRef.current = nextIndex;
            setPlayhead(nextIndex);
            setCurrentFrameIndex(nextIndex);
            return nextFrames;
        });
    };

    const handleJumpToFrame = (idx: number) => {
        if (idx < 0 || idx >= keyframes.length) return;
        stopPlayback();
        applyInterpolatedFrame(idx);
    };

    const handleScrub = (nextValue: number) => {
        stopPlayback();
        applyInterpolatedFrame(nextValue);
    };

    const handlePlay = () => {
        if (isPlaying) {
            stopPlayback();
            return;
        }

        if (keyframes.length <= 1) return;

        const maxProgress = keyframes.length - 1;
        const startProgress = playheadRef.current >= maxProgress ? 0 : playheadRef.current;
        applyInterpolatedFrame(startProgress);

        isPlayingRef.current = true;
        setIsPlaying(true);
        lastTickRef.current = null;

        const tick = (timestamp: number) => {
            if (!isPlayingRef.current) return;

            if (lastTickRef.current === null) {
                lastTickRef.current = timestamp;
                animationFrameRef.current = requestAnimationFrame(tick);
                return;
            }

            const delta = timestamp - lastTickRef.current;
            lastTickRef.current = timestamp;

            const nextProgress = playheadRef.current + (delta / transitionMs);
            if (nextProgress >= maxProgress) {
                applyInterpolatedFrame(maxProgress);
                stopPlayback();
                return;
            }

            applyInterpolatedFrame(nextProgress);
            animationFrameRef.current = requestAnimationFrame(tick);
        };

        animationFrameRef.current = requestAnimationFrame(tick);
    };

    // Keep refs/UI in sync if timeline length changes (e.g. load/reset)
    useEffect(() => {
        const maxProgress = Math.max(0, keyframes.length - 1);
        if (playheadRef.current > maxProgress) {
            applyInterpolatedFrame(maxProgress);
        }
    }, [keyframes.length, applyInterpolatedFrame]);

    // Cleanup animation loop on unmount
    useEffect(() => {
        return () => {
            stopPlayback();
        };
    }, [stopPlayback]);

    // ─── API Save/Load ───
    const handleSaveSequence = async () => {
        if (!saveTitle.trim()) return;
        try {
            const res = await fetch("/api/tactics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: saveTitle,
                    formation,
                    keyframes
                })
            });
            if (res.ok) {
                setShowSaveModal(false);
                setSaveTitle("");
                alert("Tactical sequence saved successfully!");
            } else {
                alert("Failed to save sequence.");
            }
        } catch (error) {
            console.error("Error saving tactics:", error);
            alert("Error saving sequence.");
        }
    };

    const handleLoadTacticsList = async () => {
        setIsLoadingTactics(true);
        setShowLoadModal(true);
        try {
            const res = await fetch("/api/tactics");
            if (res.ok) {
                const data = await res.json();
                setSavedTactics(data);
            }
        } catch (error) {
            console.error("Error loading tactics:", error);
        } finally {
            setIsLoadingTactics(false);
        }
    };

    const loadTactic = (tactic: any) => {
        if (!tactic.keyframes || tactic.keyframes.length === 0) return;
        stopPlayback();
        setKeyframes(tactic.keyframes);
        setFormation(tactic.formation || "Custom");
        applyInterpolatedFrame(0, tactic.keyframes);
        setShowLoadModal(false);
    };

    const deleteTactic = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Delete this saved sequence?")) return;
        try {
            const res = await fetch(`/api/tactics?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setSavedTactics(prev => prev.filter(t => t.id !== id));
            }
        } catch (error) {
            console.error("Error deleting tactics:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">
            <SEO title="Tactical Board" description="Create and share football tactics and formations with our interactive whiteboard." url="https://pitchside.vercel.app/tactics" />
            {/* Top nav */}
            <div className="sticky top-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <h1 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" /> Tactical Board
                    </h1>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition"
                    >
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-2">
                    {/* Formation selector */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowFormations(!showFormations); setShowColors(false); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition"
                        >
                            <Users className="w-4 h-4 text-emerald-400" />
                            {formation}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFormations ? "rotate-180" : ""}`} />
                        </button>
                        {showFormations && (
                            <div className="absolute top-12 left-0 z-50 bg-[#111827] border border-white/10 rounded-xl shadow-2xl p-2 min-w-[160px]">
                                {Object.keys(FORMATIONS).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => { initFormation(key); setShowFormations(false); }}
                                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${formation === key ? "bg-emerald-500/15 text-emerald-400" : "text-gray-300 hover:bg-white/5"
                                            }`}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Color selector */}
                    <div className="relative">
                        <button
                            onClick={() => { setShowColors(!showColors); setShowFormations(false); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition"
                        >
                            <Palette className="w-4 h-4" />
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TEAM_COLORS[activeColor].home }} />
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showColors ? "rotate-180" : ""}`} />
                        </button>
                        {showColors && (
                            <div className="absolute top-12 left-0 z-50 bg-[#111827] border border-white/10 rounded-xl shadow-2xl p-2 min-w-[140px]">
                                {TEAM_COLORS.map((c, i) => (
                                    <button
                                        key={i}
                                        onClick={() => changeTeamColor(i)}
                                        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition ${activeColor === i ? "bg-white/10" : "hover:bg-white/5"
                                            }`}
                                    >
                                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c.home }} />
                                        <span className="text-gray-300">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Load tactics button */}
                    <button
                        onClick={handleLoadTacticsList}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-sm font-semibold text-blue-400 hover:bg-blue-500/25 transition ml-auto"
                    >
                        <FolderOpen className="w-4 h-4" /> Load
                    </button>

                    {/* Draw mode toggle */}
                    <button
                        onClick={() => setDrawMode(!drawMode)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${drawMode
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                            }`}
                    >
                        <Pencil className="w-4 h-4" />
                        {drawMode ? "Drawing" : "Draw"}
                    </button>

                    {/* Arrow color (visible in draw mode) */}
                    {drawMode && (
                        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                            {ARROW_COLORS.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => setArrowColor(i)}
                                    className={`w-5 h-5 rounded-full border-2 transition ${arrowColor === i ? "border-white scale-125" : "border-transparent"}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Clear arrows */}
                    {arrows.length > 0 && (
                        <button
                            onClick={() => setArrows([])}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/10 transition"
                        >
                            <Eraser className="w-4 h-4" /> Clear Arrows
                        </button>
                    )}

                    {/* Reset */}
                    <button
                        onClick={() => initFormation(formation)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 transition"
                    >
                        <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                </div>

                {/* ─── Pitch ─── */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                    onClick={() => { setShowFormations(false); setShowColors(false); }}>
                    <svg
                        ref={svgRef}
                        viewBox="0 0 100 100"
                        className={`w-full aspect-square select-none ${drawMode ? "cursor-crosshair" : "cursor-default"}`}
                        style={{ touchAction: "none" }}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={handlePointerUp}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={handlePointerUp}
                    >
                        {/* Pitch background */}
                        <defs>
                            <linearGradient id="pitch-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#15803d" />
                                <stop offset="25%" stopColor="#166534" />
                                <stop offset="50%" stopColor="#15803d" />
                                <stop offset="75%" stopColor="#166534" />
                                <stop offset="100%" stopColor="#15803d" />
                            </linearGradient>
                            {/* Grass stripes */}
                            <pattern id="grass" width="100" height="10" patternUnits="userSpaceOnUse">
                                <rect width="100" height="5" fill="#16a34a" opacity="0.15" />
                                <rect y="5" width="100" height="5" fill="#15803d" opacity="0.15" />
                            </pattern>
                            {/* Arrow marker */}
                            <marker id="arrowhead-red" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#EF4444" /></marker>
                            <marker id="arrowhead-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#3B82F6" /></marker>
                            <marker id="arrowhead-green" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#22C55E" /></marker>
                            <marker id="arrowhead-yellow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#EAB308" /></marker>
                            <marker id="arrowhead-white" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#E2E8F0" /></marker>
                        </defs>

                        <rect width="100" height="100" fill="url(#pitch-gradient)" />
                        <rect width="100" height="100" fill="url(#grass)" />

                        {/* Pitch markings */}
                        <PitchMarkings />

                        {/* Arrows */}
                        {arrows.map((a, i) => {
                            const colorMap: Record<string, string> = {
                                "#EF4444": "arrowhead-red", "#3B82F6": "arrowhead-blue",
                                "#22C55E": "arrowhead-green", "#EAB308": "arrowhead-yellow", "#E2E8F0": "arrowhead-white",
                            };
                            return (
                                <g key={`arrow-${i}`}>
                                    <line
                                        x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                                        stroke={a.color} strokeWidth="0.8" strokeDasharray="2,1"
                                        markerEnd={`url(#${colorMap[a.color] || "arrowhead-white"})`}
                                        opacity="0.85"
                                    />
                                    {/* Delete button */}
                                    <circle
                                        cx={(a.x1 + a.x2) / 2} cy={(a.y1 + a.y2) / 2} r="1.5"
                                        fill="#EF4444" opacity="0" className="hover:opacity-80 cursor-pointer transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); setArrows(prev => prev.filter((_, j) => j !== i)); }}
                                    />
                                </g>
                            );
                        })}

                        {/* Live draw preview */}
                        {drawMode && drawStart && drawCurrent && (
                            <line
                                x1={drawStart.x} y1={drawStart.y}
                                x2={drawCurrent.x} y2={drawCurrent.y}
                                stroke={ARROW_COLORS[arrowColor]} strokeWidth="0.6" strokeDasharray="1.5,1"
                                opacity="0.5"
                            />
                        )}

                        {/* Players */}
                        {players.map(p => (
                            <g
                                key={p.id}
                                onMouseDown={(e) => handlePointerDown(e, p.id)}
                                onTouchStart={(e) => handlePointerDown(e, p.id)}
                                className={`${drawMode ? "" : "cursor-grab active:cursor-grabbing"}`}
                                style={{ transition: dragging === p.id || isPlaying ? "none" : "all 0.15s ease-out" }}
                            >
                                {/* Glow */}
                                <circle cx={p.x} cy={p.y} r="3.8" fill={p.color} opacity="0.2" />
                                {/* Player circle */}
                                <circle
                                    cx={p.x} cy={p.y} r="2.8"
                                    fill={p.color}
                                    stroke="#ffffff"
                                    strokeWidth="0.5"
                                    className="drop-shadow-lg"
                                />
                                {/* Label */}
                                <text
                                    x={p.x} y={p.y + 0.6}
                                    textAnchor="middle"
                                    fontSize="1.8"
                                    fontWeight="bold"
                                    fill="#ffffff"
                                    className="select-none pointer-events-none"
                                    style={{ textShadow: "0 0.5px 1px rgba(0,0,0,0.5)" }}
                                >
                                    {p.label}
                                </text>
                            </g>
                        ))}

                        {/* Transparent overlay for draw events */}
                        {drawMode && (
                            <rect
                                width="100" height="100"
                                fill="transparent"
                                onMouseDown={handlePointerDown}
                                onTouchStart={handlePointerDown}
                            />
                        )}
                    </svg>
                </div>

                {/* ─── Timeline Controls ─── */}
                <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePlay}
                                disabled={keyframes.length <= 1}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl transition ${keyframes.length <= 1 ? "bg-white/5 text-gray-500 cursor-not-allowed" :
                                    isPlaying ? "bg-amber-500 text-white shadow-lg" : "bg-emerald-500 text-white shadow-lg hover:bg-emerald-600"
                                    }`}
                            >
                                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                            </button>
                            <button
                                onClick={() => handleScrub(0)}
                                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition"
                                title="Jump to first frame"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold text-gray-300">
                                Frame {currentFrameIndex + 1} / {Math.max(1, keyframes.length)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCaptureFrame}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
                            >
                                <Plus className="w-4 h-4" /> Add Frame
                            </button>
                            <button
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-semibold transition ml-2"
                                onClick={() => setShowSaveModal(true)}
                            >
                                <Save className="w-4 h-4" /> Save
                            </button>
                        </div>
                    </div>

                    {/* Playback speed + scrubber */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sequence Progress</span>
                            <span className="text-xs text-gray-400">
                                {(transitionMs / 1000).toFixed(1)}s per frame
                            </span>
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={Math.max(0, keyframes.length - 1)}
                            step={0.01}
                            value={playhead}
                            onChange={(e) => handleScrub(Number(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                            disabled={keyframes.length <= 1}
                        />

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">Slow</span>
                            <input
                                type="range"
                                min={600}
                                max={2200}
                                step={100}
                                value={transitionMs}
                                onChange={(e) => setTransitionMs(Number(e.target.value))}
                                className="flex-1 accent-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">Fast</span>
                        </div>
                    </div>

                    {/* Timeline Track */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                        {keyframes.map((frame, idx) => (
                            <div key={frame.id} className="flex items-center">
                                <button
                                    onClick={() => handleJumpToFrame(idx)}
                                    className={`relative w-12 h-8 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-bold shrink-0 ${currentFrameIndex === idx
                                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                        : "border-white/10 bg-[#0a0e1a] text-gray-500 hover:border-white/30 hover:text-gray-300"
                                        }`}
                                >
                                    {idx + 1}
                                    {Math.floor(playhead) === idx && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                                    )}
                                </button>
                                {idx < keyframes.length - 1 && (
                                    <div className={`w-4 h-px mx-1 ${idx < currentFrameIndex ? "bg-emerald-500/50" : "bg-white/10"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-500 font-medium pb-20">
                    <span className="flex items-center gap-1.5">
                        <Play className="w-3 h-3" /> Hit play to animate your build-up
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> Drag players to reposition
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Pencil className="w-3 h-3" /> Toggle Draw mode to add arrows
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Download className="w-3 h-3" /> Export as PNG image
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Trash2 className="w-3 h-3" /> Click arrows to delete them
                    </span>
                </div>
            </div>

            {/* ─── Save Modal ─── */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Save className="w-5 h-5 text-blue-400" /> Save Sequence
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Save this {keyframes.length}-frame sequence to your database.
                        </p>
                        <input
                            type="text"
                            placeholder="e.g. Pep's Build-up vs Arsenal"
                            className="w-full bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition mb-6"
                            value={saveTitle}
                            onChange={(e) => setSaveTitle(e.target.value)}
                            autoFocus
                        />
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSequence}
                                disabled={!saveTitle.trim()}
                                className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition shadow-lg shadow-blue-500/25"
                            >
                                Save Frames
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Load Modal ─── */}
            {showLoadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in max-h-[80vh] flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-blue-400" /> Load Saved Sequence
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                            {isLoadingTactics ? (
                                <div className="text-center text-sm text-gray-400 py-8 animate-pulse">Loading sequences...</div>
                            ) : savedTactics.length === 0 ? (
                                <div className="text-center text-sm text-gray-500 py-8">No saved tactical sequences found.</div>
                            ) : (
                                savedTactics.map(t => (
                                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#1e293b] border border-white/5 hover:border-white/20 transition group cursor-pointer" onClick={() => loadTactic(t)}>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition">{t.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {t.formation} • {t.keyframes?.length || 1} Frames
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => deleteTactic(t.id, e)}
                                            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100 hidden sm:block"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowLoadModal(false)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
