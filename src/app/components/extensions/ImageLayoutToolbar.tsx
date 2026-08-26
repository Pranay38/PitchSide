"use client";
import React from "react";
import { AlignLeft, AlignCenter, AlignRight, RotateCcw } from "lucide-react";
import type { ImageLayout, ImageAlignment } from "./imageLayoutUtils";

/* ── Props ──────────────────────────────────────────────────────────── */

interface ImageLayoutToolbarProps {
    layout: ImageLayout;
    alignment: ImageAlignment;
    spacing: number;
    offsetX: number;
    offsetY: number;
    onLayoutChange: (layout: ImageLayout) => void;
    onAlignmentChange: (alignment: ImageAlignment) => void;
    onSpacingChange: (spacing: number) => void;
    onResetOffset: () => void;
}

/* ── Layout mode SVG icons ─────────────────────────────────────────── */

function LayoutInlineIcon({ active }: { active?: boolean }) {
    const c = active ? "#fff" : "#94A3B8";
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="0.5" width="14" height="2.5" rx="1" fill={c} opacity={0.35} />
            <rect x="3.5" y="5" width="9" height="6" rx="1.5" fill={c} />
            <rect x="1" y="13" width="14" height="2.5" rx="1" fill={c} opacity={0.35} />
        </svg>
    );
}

function LayoutWrapLeftIcon({ active }: { active?: boolean }) {
    const c = active ? "#fff" : "#94A3B8";
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="0.5" y="0.5" width="7" height="9" rx="1.5" fill={c} />
            <rect x="9" y="0.5" width="6.5" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="9" y="4" width="6.5" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="9" y="7.5" width="6.5" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="0.5" y="11" width="15" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="0.5" y="14" width="11" height="2" rx="1" fill={c} opacity={0.35} />
        </svg>
    );
}

function LayoutWrapRightIcon({ active }: { active?: boolean }) {
    const c = active ? "#fff" : "#94A3B8";
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="8.5" y="0.5" width="7" height="9" rx="1.5" fill={c} />
            <rect x="0.5" y="0.5" width="6.5" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="0.5" y="4" width="6.5" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="0.5" y="7.5" width="6.5" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="0.5" y="11" width="15" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="4.5" y="14" width="11" height="2" rx="1" fill={c} opacity={0.35} />
        </svg>
    );
}

function LayoutBreakIcon({ active }: { active?: boolean }) {
    const c = active ? "#fff" : "#94A3B8";
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="0.5" y="0.5" width="15" height="2" rx="1" fill={c} opacity={0.35} />
            <rect x="0.5" y="4" width="15" height="8" rx="1.5" fill={c} />
            <rect x="0.5" y="13.5" width="15" height="2" rx="1" fill={c} opacity={0.35} />
        </svg>
    );
}

/* ── Constants ──────────────────────────────────────────────────────── */

const LAYOUT_OPTIONS: {
    value: ImageLayout;
    Icon: React.FC<{ active?: boolean }>;
    label: string;
}[] = [
    { value: "inline", Icon: LayoutInlineIcon, label: "Inline" },
    { value: "wrap-left", Icon: LayoutWrapLeftIcon, label: "Wrap Left" },
    { value: "wrap-right", Icon: LayoutWrapRightIcon, label: "Wrap Right" },
    { value: "break-text", Icon: LayoutBreakIcon, label: "Break Text" },
];

const ALIGN_OPTIONS: {
    value: ImageAlignment;
    Icon: typeof AlignLeft;
    label: string;
}[] = [
    { value: "left", Icon: AlignLeft, label: "Left" },
    { value: "center", Icon: AlignCenter, label: "Center" },
    { value: "right", Icon: AlignRight, label: "Right" },
];

/* ── Shared button style helper ────────────────────────────────────── */

const btnBase: React.CSSProperties = {
    padding: "5px 6px",
    borderRadius: 7,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
};

/* ── Component ─────────────────────────────────────────────────────── */

export function ImageLayoutToolbar({
    layout,
    alignment,
    spacing,
    offsetX,
    offsetY,
    onLayoutChange,
    onAlignmentChange,
    onSpacingChange,
    onResetOffset,
}: ImageLayoutToolbarProps) {
    const hasOffset = offsetX !== 0 || offsetY !== 0;
    const showAlignment = layout === "inline" || layout === "break-text";

    return (
        <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 50,
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: "rgba(15, 23, 42, 0.94)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "4px 6px",
                boxShadow:
                    "0 8px 32px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
                userSelect: "none",
            }}
        >
            {/* Slider thumb styles */}
            <style>{`
                .img-layout-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 4px;
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                }
                .img-layout-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #16A34A;
                    cursor: pointer;
                    border: 2px solid #fff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
                    transition: transform 0.1s;
                }
                .img-layout-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                .img-layout-slider::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #16A34A;
                    cursor: pointer;
                    border: 2px solid #fff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
                }
            `}</style>

            {/* Layout mode buttons */}
            {LAYOUT_OPTIONS.map(({ value, Icon, label }) => {
                const isActive = layout === value;
                return (
                    <button
                        key={value}
                        type="button"
                        title={label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => onLayoutChange(value)}
                        style={{
                            ...btnBase,
                            background: isActive ? "#16A34A" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive)
                                (e.currentTarget.style.background =
                                    "rgba(255,255,255,0.1)");
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive)
                                (e.currentTarget.style.background =
                                    "transparent");
                        }}
                    >
                        <Icon active={isActive} />
                    </button>
                );
            })}

            {/* Divider */}
            <Divider />

            {/* Alignment buttons — only for inline / break-text */}
            {showAlignment && (
                <>
                    {ALIGN_OPTIONS.map(({ value, Icon, label }) => {
                        const isActive = alignment === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                title={`Align ${label}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => onAlignmentChange(value)}
                                style={{
                                    ...btnBase,
                                    background: isActive
                                        ? "#16A34A"
                                        : "transparent",
                                    color: isActive ? "#fff" : "#94A3B8",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive)
                                        (e.currentTarget.style.background =
                                            "rgba(255,255,255,0.1)");
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive)
                                        (e.currentTarget.style.background =
                                            "transparent");
                                }}
                            >
                                <Icon
                                    style={{ width: 14, height: 14 }}
                                />
                            </button>
                        );
                    })}
                    <Divider />
                </>
            )}

            {/* Spacing slider */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "0 4px",
                }}
            >
                <span
                    style={{
                        fontSize: 9,
                        color: "#64748B",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                    }}
                >
                    Gap
                </span>
                <input
                    type="range"
                    className="img-layout-slider"
                    min={0}
                    max={48}
                    step={4}
                    value={spacing}
                    onChange={(e) =>
                        onSpacingChange(parseInt(e.target.value, 10))
                    }
                    style={{
                        width: 52,
                        background: `linear-gradient(to right, #16A34A ${(spacing / 48) * 100}%, #334155 ${(spacing / 48) * 100}%)`,
                    }}
                    title={`Spacing: ${spacing}px — Press Space to increase, Shift+Space to decrease`}
                />
                <span
                    style={{
                        fontSize: 10,
                        color: "#94A3B8",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        minWidth: 28,
                        textAlign: "right",
                    }}
                >
                    {spacing}px
                </span>
            </div>

            {/* Reset offset button (conditional) */}
            {hasOffset && (
                <>
                    <Divider />
                    <button
                        type="button"
                        title={`Reset position offset (${offsetX}, ${offsetY})`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={onResetOffset}
                        style={{
                            ...btnBase,
                            padding: "4px 8px",
                            gap: 4,
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#f87171",
                            fontSize: 10,
                            fontWeight: 700,
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.22)")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.12)")
                        }
                    >
                        <RotateCcw style={{ width: 11, height: 11 }} />
                        Reset
                    </button>
                </>
            )}
        </div>
    );
}

/* ── Tiny divider ──────────────────────────────────────────────────── */

function Divider() {
    return (
        <div
            style={{
                width: 1,
                height: 18,
                background: "rgba(255,255,255,0.1)",
                margin: "0 3px",
                flexShrink: 0,
            }}
        />
    );
}
