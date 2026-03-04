import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router";
import {
    ArrowLeft, RotateCcw, Download, Palette, Users, Pencil, Eraser,
    ChevronDown, Trash2,
} from "lucide-react";

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
    const [activeColor, setActiveColor] = useState(0);
    const [arrowColor, setArrowColor] = useState(0);
    const [showFormations, setShowFormations] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Initialize players from formation
    const initFormation = useCallback((key: string) => {
        const f = FORMATIONS[key];
        if (!f) return;
        const colors = TEAM_COLORS[activeColor];
        setPlayers(
            f.positions.map((p, i) => ({
                id: `p-${i}`,
                x: p.x,
                y: p.y,
                label: p.label,
                color: colors.home,
            }))
        );
        setArrows([]);
        setFormation(key);
    }, [activeColor]);

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
            if (coords) setDrawStart(coords);
            return;
        }
        if (playerId) {
            setDragging(playerId);
            e.preventDefault();
        }
    };

    const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
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
            const coords = getSvgCoords(e);
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

    return (
        <div className="min-h-screen bg-[#0a0e1a] text-white">
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
                        {drawMode && drawStart && (
                            <line
                                x1={drawStart.x} y1={drawStart.y}
                                x2={drawStart.x} y2={drawStart.y}
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
                                style={{ transition: dragging === p.id ? "none" : "all 0.15s ease-out" }}
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

                {/* Instructions */}
                <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-gray-500 font-medium">
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
        </div>
    );
}
