/**
 * Shared utilities for image layout, alignment, spacing, and keyboard nudging.
 * Used by both ResizableImage and EmbeddedImage extensions + their NodeViews.
 */
import { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/core";
import type { CSSProperties } from "react";

/* ── Types ──────────────────────────────────────────────────────────── */

export type ImageLayout = "inline" | "wrap-left" | "wrap-right" | "break-text";
export type ImageAlignment = "left" | "center" | "right";

export interface ImageLayoutAttrs {
    layout?: string;
    alignment?: string;
    spacing?: number;
    offsetX?: number;
    offsetY?: number;
}

/* ── Attribute definitions (for addAttributes) ─────────────────────── */

export function getImageLayoutAttributes() {
    return {
        layout: {
            default: "inline" as string,
            parseHTML: (element: HTMLElement) =>
                element.getAttribute("data-layout") || "inline",
        },
        alignment: {
            default: "center" as string,
            parseHTML: (element: HTMLElement) =>
                element.getAttribute("data-alignment") || "center",
        },
        spacing: {
            default: 16 as number,
            parseHTML: (element: HTMLElement) => {
                const val = element.getAttribute("data-spacing");
                return val ? parseInt(val, 10) : 16;
            },
        },
        offsetX: {
            default: 0 as number,
            parseHTML: (element: HTMLElement) => {
                const val = element.getAttribute("data-offset-x");
                return val ? parseInt(val, 10) : 0;
            },
        },
        offsetY: {
            default: 0 as number,
            parseHTML: (element: HTMLElement) => {
                const val = element.getAttribute("data-offset-y");
                return val ? parseInt(val, 10) : 0;
            },
        },
    };
}

/* ── Data attributes (for renderHTML) ──────────────────────────────── */

export function getImageDataAttributes(
    attrs: Record<string, unknown>,
): Record<string, string> {
    return {
        "data-layout": (attrs.layout as string) || "inline",
        "data-alignment": (attrs.alignment as string) || "center",
        "data-spacing": String(attrs.spacing ?? 16),
        "data-offset-x": String(attrs.offsetX ?? 0),
        "data-offset-y": String(attrs.offsetY ?? 0),
    };
}

/* ── CSS string for renderHTML ─────────────────────────────────────── */

export function computeLayoutStyleString(attrs: ImageLayoutAttrs): string {
    const layout = attrs.layout || "inline";
    const alignment = attrs.alignment || "center";
    const sp = attrs.spacing ?? 16;
    const ox = attrs.offsetX ?? 0;
    const oy = attrs.offsetY ?? 0;

    const parts: string[] = [];

    switch (layout) {
        case "wrap-left":
            parts.push(
                `float: left; margin: ${sp}px ${sp}px ${sp}px 0;`,
            );
            break;
        case "wrap-right":
            parts.push(
                `float: right; margin: ${sp}px 0 ${sp}px ${sp}px;`,
            );
            break;
        case "break-text":
            parts.push(`clear: both; margin: ${sp}px auto;`);
            break;
        default:
            if (alignment === "left") {
                parts.push(`margin: ${sp}px auto ${sp}px 0;`);
            } else if (alignment === "right") {
                parts.push(`margin: ${sp}px 0 ${sp}px auto;`);
            } else {
                parts.push(`margin: ${sp}px auto;`);
            }
    }

    if (ox || oy) {
        parts.push(`position: relative; top: ${oy}px; left: ${ox}px;`);
    }

    return parts.join(" ");
}

/* ── React CSSProperties for NodeView wrapper ──────────────────────── */

export function getLayoutWrapperStyles(attrs: ImageLayoutAttrs): CSSProperties {
    const layout = attrs.layout || "inline";
    const alignment = attrs.alignment || "center";
    const sp = attrs.spacing ?? 16;
    const ox = attrs.offsetX ?? 0;
    const oy = attrs.offsetY ?? 0;

    const base: CSSProperties = {
        position: "relative",
        ...(ox ? { left: ox } : {}),
        ...(oy ? { top: oy } : {}),
    };

    switch (layout) {
        case "wrap-left":
            return {
                ...base,
                float: "left",
                margin: `${sp}px ${sp}px ${sp}px 0`,
                display: "block",
            };
        case "wrap-right":
            return {
                ...base,
                float: "right",
                margin: `${sp}px 0 ${sp}px ${sp}px`,
                display: "block",
            };
        case "break-text":
            return {
                ...base,
                display: "block",
                clear: "both",
                margin: `${sp}px auto`,
                textAlign: "center",
            };
        default:
            return {
                ...base,
                display: "block",
                clear: "both",
                textAlign: alignment as CSSProperties["textAlign"],
                margin: `${sp}px 0`,
            };
    }
}

/* ── Keyboard helpers ──────────────────────────────────────────────── */

export function nudgeImageNode(
    editor: Editor,
    nodeName: string,
    axis: "x" | "y",
    delta: number,
): boolean {
    const { selection } = editor.state;
    if (
        !(selection instanceof NodeSelection) ||
        selection.node.type.name !== nodeName
    ) {
        return false;
    }
    const pos = selection.from;
    const node = selection.node;
    const attr = axis === "x" ? "offsetX" : "offsetY";
    const current = (node.attrs[attr] as number) || 0;
    const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        [attr]: current + delta,
    });
    tr.setSelection(NodeSelection.create(tr.doc, pos));
    editor.view.dispatch(tr);
    return true;
}

export function adjustImageSpacing(
    editor: Editor,
    nodeName: string,
    delta: number,
): boolean {
    const { selection } = editor.state;
    if (
        !(selection instanceof NodeSelection) ||
        selection.node.type.name !== nodeName
    ) {
        return false;
    }
    const pos = selection.from;
    const node = selection.node;
    const current = (node.attrs.spacing as number) ?? 16;
    const newVal = Math.max(0, Math.min(48, current + delta));
    if (newVal === current) return true;
    const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        spacing: newVal,
    });
    tr.setSelection(NodeSelection.create(tr.doc, pos));
    editor.view.dispatch(tr);
    return true;
}
