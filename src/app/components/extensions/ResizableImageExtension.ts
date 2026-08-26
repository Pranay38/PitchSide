/**
 * ResizableImage — drop-in replacement for @tiptap/extension-image
 * that renders a React NodeView with MS-Word-style drag-resize handles,
 * text wrapping layout, alignment, spacing, and keyboard nudging.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableStandardImageNodeView } from "./ResizableStandardImageNodeView";
import {
    getImageLayoutAttributes,
    getImageDataAttributes,
    computeLayoutStyleString,
    nudgeImageNode,
    adjustImageSpacing,
} from "./imageLayoutUtils";

export interface ResizableImageOptions {
    inline: boolean;
    allowBase64: boolean;
    HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        resizableImage: {
            setImage: (options: {
                src: string;
                alt?: string;
                title?: string;
                width?: number;
                layout?: string;
                alignment?: string;
                spacing?: number;
            }) => ReturnType;
        };
    }
}

export const ResizableImage = Node.create<ResizableImageOptions>({
    name: "image",
    group: "block",
    atom: true,
    draggable: true,

    addOptions() {
        return {
            inline: false,
            allowBase64: true,
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            src: { default: null },
            alt: { default: null },
            title: { default: null },
            width: {
                default: null,
                parseHTML: (element) => {
                    const style = element.getAttribute("style") || "";
                    const widthMatch = style.match(/width:\s*(\d+)px/);
                    if (widthMatch) return parseInt(widthMatch[1], 10);
                    const attrWidth = element.getAttribute("width");
                    if (attrWidth) return parseInt(attrWidth, 10);
                    return null;
                },
            },
            ...getImageLayoutAttributes(),
        };
    },

    parseHTML() {
        return [{ tag: "img[src]" }];
    },

    renderHTML({ HTMLAttributes }) {
        const {
            width,
            layout,
            alignment,
            spacing,
            offsetX,
            offsetY,
            ...rest
        } = HTMLAttributes;

        const widthStyle = width
            ? `width: ${width}px; max-width: 100%;`
            : "max-width: 100%;";

        const layoutStyle = computeLayoutStyleString({
            layout: layout as string,
            alignment: alignment as string,
            spacing: spacing as number,
            offsetX: offsetX as number,
            offsetY: offsetY as number,
        });

        return [
            "img",
            mergeAttributes(this.options.HTMLAttributes, rest, {
                style: `${widthStyle} height: auto; display: block; ${layoutStyle}`,
                ...getImageDataAttributes({
                    layout,
                    alignment,
                    spacing,
                    offsetX,
                    offsetY,
                }),
            }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableStandardImageNodeView);
    },

    addCommands() {
        return {
            setImage:
                (options) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: options,
                        });
                    },
        };
    },

    addKeyboardShortcuts() {
        const name = this.name;
        return {
            ArrowUp: ({ editor }) => nudgeImageNode(editor, name, "y", -4),
            ArrowDown: ({ editor }) => nudgeImageNode(editor, name, "y", 4),
            ArrowLeft: ({ editor }) => nudgeImageNode(editor, name, "x", -4),
            ArrowRight: ({ editor }) => nudgeImageNode(editor, name, "x", 4),
            "Shift-ArrowUp": ({ editor }) =>
                nudgeImageNode(editor, name, "y", -1),
            "Shift-ArrowDown": ({ editor }) =>
                nudgeImageNode(editor, name, "y", 1),
            "Shift-ArrowLeft": ({ editor }) =>
                nudgeImageNode(editor, name, "x", -1),
            "Shift-ArrowRight": ({ editor }) =>
                nudgeImageNode(editor, name, "x", 1),
            "Alt-ArrowUp": ({ editor }) =>
                nudgeImageNode(editor, name, "y", -16),
            "Alt-ArrowDown": ({ editor }) =>
                nudgeImageNode(editor, name, "y", 16),
            "Alt-ArrowLeft": ({ editor }) =>
                nudgeImageNode(editor, name, "x", -16),
            "Alt-ArrowRight": ({ editor }) =>
                nudgeImageNode(editor, name, "x", 16),
            " ": ({ editor }) => nudgeImageNode(editor, name, "x", 4),
            "Shift- ": ({ editor }) => nudgeImageNode(editor, name, "x", -4),
        };
    },
});
