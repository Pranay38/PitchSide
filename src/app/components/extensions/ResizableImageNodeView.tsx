"use client";
import { useCallback, useRef, useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ImageLayoutToolbar } from "./ImageLayoutToolbar";
import { getLayoutWrapperStyles } from "./imageLayoutUtils";
import type { ImageLayout, ImageAlignment } from "./imageLayoutUtils";

type Handle = "nw" | "ne" | "sw" | "se" | "e" | "w";

const HANDLE_SIZE = 10;
const MIN_WIDTH = 80;
const MAX_WIDTH_RATIO = 1; // 100% of container

const HANDLE_CURSORS: Record<Handle, string> = {
  nw: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  se: "nwse-resize",
  e: "ew-resize",
  w: "ew-resize",
};

const HANDLE_POSITIONS: Record<Handle, React.CSSProperties> = {
  nw: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  ne: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  sw: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
  se: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2 },
  e: { top: "50%", right: -HANDLE_SIZE / 2, transform: "translateY(-50%)" },
  w: { top: "50%", left: -HANDLE_SIZE / 2, transform: "translateY(-50%)" },
};

/**
 * NodeView for embedded images (with credit/caption) — provides MS-Word-style
 * drag-to-resize handles, text wrapping layout, alignment, spacing controls,
 * and keyboard nudging.
 */
export function ResizableImageNodeView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const {
    src,
    creditText,
    creditUrl,
    width: savedWidth,
    alt,
    layout: rawLayout,
    alignment: rawAlignment,
    spacing: rawSpacing,
    offsetX: rawOffsetX,
    offsetY: rawOffsetY,
  } = node.attrs;

  const layout = (rawLayout || "inline") as ImageLayout;
  const alignment = (rawAlignment || "center") as ImageAlignment;
  const spacing = (rawSpacing ?? 16) as number;
  const currentOffsetX = (rawOffsetX ?? 0) as number;
  const currentOffsetY = (rawOffsetY ?? 0) as number;

  const containerRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<number | null>(
    null,
  );

  // Parse initial width from saved attrs
  const parsedSavedWidth = savedWidth ? parseInt(String(savedWidth), 10) : null;

  // Track the natural aspect ratio so we can maintain it during resize
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (img && img.naturalWidth && img.naturalHeight) {
      setNaturalAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  }, []);

  // Compute effective display width
  const effectiveWidth = currentWidth ?? parsedSavedWidth ?? null;

  const startResize = useCallback(
    (handle: Handle, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const container = containerRef.current;
      if (!container) return;

      const figureEl = container.closest(
        "[data-embedded-image]",
      ) as HTMLElement | null;
      const parentWidth =
        figureEl?.parentElement?.clientWidth || container.clientWidth || 600;
      const startWidth =
        effectiveWidth ??
        (imgRef.current?.getBoundingClientRect().width || parentWidth);

      setIsResizing(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        let deltaX = moveEvent.clientX - startX;

        // For left-side handles, invert the delta
        if (handle === "nw" || handle === "w" || handle === "sw") {
          deltaX = -deltaX;
        }

        let newWidth = Math.round(startWidth + deltaX);
        newWidth = Math.max(
          MIN_WIDTH,
          Math.min(newWidth, parentWidth * MAX_WIDTH_RATIO),
        );

        setCurrentWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Persist the final width
        setCurrentWidth((finalWidth) => {
          if (finalWidth !== null) {
            updateAttributes({ width: finalWidth });
          }
          return finalWidth;
        });
      };

      document.body.style.cursor = HANDLE_CURSORS[handle];
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [effectiveWidth, updateAttributes],
  );

  const showHandles = selected || isHovered || isResizing;
  const hasOffset = currentOffsetX !== 0 || currentOffsetY !== 0;

  /* ── Wrapper styles (layout-aware) ────────────────────────────────── */

  const wrapperStyles: React.CSSProperties = {
    ...getLayoutWrapperStyles({
      layout,
      alignment,
      spacing,
      offsetX: currentOffsetX,
      offsetY: currentOffsetY,
    }),
    background: "transparent",
    border: "none",
  };

  /* ── Image styles ─────────────────────────────────────────────────── */

  const imageStyle: React.CSSProperties = {
    display: "block",
    width: effectiveWidth ? `${effectiveWidth}px` : "100%",
    maxWidth: "100%",
    height: "auto",
    borderRadius: 12,
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    transition: isResizing ? "none" : "box-shadow 0.2s",
    ...(showHandles && !isResizing
      ? { boxShadow: "0 0 0 2px #16A34A, 0 4px 15px rgba(0,0,0,0.08)" }
      : {}),
    ...(isResizing
      ? { boxShadow: "0 0 0 2px #16A34A, 0 8px 25px rgba(22,163,74,0.15)" }
      : {}),
  };

  return (
    <NodeViewWrapper
      as="figure"
      data-embedded-image="true"
      ref={containerRef}
      style={wrapperStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isResizing && setIsHovered(false)}
    >
      {/* ── Layout toolbar (shown when selected) ────────────────────── */}
      {selected && (
        <ImageLayoutToolbar
          layout={layout}
          alignment={alignment}
          spacing={spacing}
          offsetX={currentOffsetX}
          offsetY={currentOffsetY}
          onLayoutChange={(l) => updateAttributes({ layout: l })}
          onAlignmentChange={(a) => updateAttributes({ alignment: a })}
          onSpacingChange={(s) => updateAttributes({ spacing: s })}
          onResetOffset={() => updateAttributes({ offsetX: 0, offsetY: 0 })}
        />
      )}

      {/* Image wrapper for positioning handles */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          maxWidth: "100%",
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          draggable={false}
          onLoad={handleImageLoad}
          style={imageStyle}
        />

        {/* ── Resize handles ────────────────────────────────────────── */}
        {showHandles &&
          (Object.keys(HANDLE_POSITIONS) as Handle[]).map((handle) => (
            <div
              key={handle}
              onMouseDown={(e) => startResize(handle, e)}
              style={{
                position: "absolute",
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                background: "#16A34A",
                border: "2px solid white",
                borderRadius: handle === "e" || handle === "w" ? 2 : 3,
                cursor: HANDLE_CURSORS[handle],
                zIndex: 10,
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                transition: "opacity 0.15s, transform 0.15s",
                opacity: isResizing ? 1 : 0.85,
                ...HANDLE_POSITIONS[handle],
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  `${HANDLE_POSITIONS[handle].transform || ""} scale(1.3)`.trim();
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  (HANDLE_POSITIONS[handle].transform as string) || "";
                (e.currentTarget as HTMLElement).style.opacity = "0.85";
              }}
            />
          ))}

        {/* ── Width badge during resize ─────────────────────────────── */}
        {isResizing && currentWidth && (
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.85)",
              color: "white",
              padding: "3px 10px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              zIndex: 20,
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {currentWidth}px
          </div>
        )}

        {/* ── Offset badge (when nudged) ────────────────────────────── */}
        {hasOffset && selected && !isResizing && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.8)",
              color: "#94A3B8",
              padding: "2px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              whiteSpace: "nowrap",
              zIndex: 20,
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ↕ {currentOffsetY > 0 ? "+" : ""}
            {currentOffsetY} &nbsp; ↔ {currentOffsetX > 0 ? "+" : ""}
            {currentOffsetX}
          </div>
        )}
      </div>

      {/* ── Credit / Caption ────────────────────────────────────────── */}
      {(creditText || creditUrl) && (
        <figcaption
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            padding: "8px 4px 0 0",
            fontSize: 12,
            color: "#94A3B8",
            fontStyle: "italic",
          }}
        >
          <span style={{ opacity: 0.7, fontSize: 11 }}>📷 </span>
          {creditUrl ? (
            <a
              href={creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#16a34a",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {creditText || "Source"}
            </a>
          ) : (
            creditText || ""
          )}
        </figcaption>
      )}
    </NodeViewWrapper>
  );
}
