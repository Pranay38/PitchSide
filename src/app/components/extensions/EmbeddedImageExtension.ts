/**
 * EmbeddedImage — block node that wraps an image inside a <figure> with
 * credit/caption support, MS-Word-style drag-resize handles, text wrapping
 * layout, alignment, spacing, and keyboard nudging.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageNodeView } from "./ResizableImageNodeView";
import {
    getImageLayoutAttributes,
    getImageDataAttributes,
    computeLayoutStyleString,
    nudgeImageNode,
    adjustImageSpacing,
} from "./imageLayoutUtils";

export interface EmbeddedImageOptions {
    HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        embeddedImage: {
            /**
             * Insert an embedded image with credit attribution.
             */
            setEmbeddedImage: (options: {
                src: string;
                creditText?: string;
                creditUrl?: string;
                width?: number;
                alt?: string;
                layout?: string;
                alignment?: string;
                spacing?: number;
            }) => ReturnType;
        };
    }
}

export const EmbeddedImage = Node.create<EmbeddedImageOptions>({
    name: "embeddedImage",
    group: "block",
    atom: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: (element) => {
                    const img = element.querySelector("img");
                    return img?.getAttribute("src") || null;
                },
            },
            alt: {
                default: "",
                parseHTML: (element) => {
                    const img = element.querySelector("img");
                    return img?.getAttribute("alt") || "";
                },
            },
            creditText: {
                default: "",
                parseHTML: (element) => {
                    const caption = element.querySelector("figcaption");
                    return caption?.textContent?.trim() || "";
                },
            },
            creditUrl: {
                default: "",
                parseHTML: (element) => {
                    const link = element.querySelector("figcaption a");
                    return link?.getAttribute("href") || "";
                },
            },
            width: {
                default: null,
                parseHTML: (element) => {
                    const img = element.querySelector("img");
                    const style = img?.getAttribute("style") || "";
                    const widthMatch = style.match(/width:\s*(\d+)px/);
                    if (widthMatch) return parseInt(widthMatch[1], 10);
                    const attrWidth = img?.getAttribute("width");
                    if (attrWidth) return parseInt(attrWidth, 10);
                    return null;
                },
            },
            /* Layout attributes parse from the figure element */
            layout: {
                default: "inline" as string,
                parseHTML: (element) =>
                    element.getAttribute("data-layout") || "inline",
            },
            alignment: {
                default: "center" as string,
                parseHTML: (element) =>
                    element.getAttribute("data-alignment") || "center",
            },
            spacing: {
                default: 16 as number,
                parseHTML: (element) => {
                    const val = element.getAttribute("data-spacing");
                    return val ? parseInt(val, 10) : 16;
                },
            },
            offsetX: {
                default: 0 as number,
                parseHTML: (element) => {
                    const val = element.getAttribute("data-offset-x");
                    return val ? parseInt(val, 10) : 0;
                },
            },
            offsetY: {
                default: 0 as number,
                parseHTML: (element) => {
                    const val = element.getAttribute("data-offset-y");
                    return val ? parseInt(val, 10) : 0;
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'figure[data-embedded-image="true"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const {
            src,
            creditText,
            creditUrl,
            width,
            alt,
            layout,
            alignment,
            spacing,
            offsetX,
            offsetY,
            ...rest
        } = HTMLAttributes;

        const layoutStyle = computeLayoutStyleString({
            layout: layout as string,
            alignment: alignment as string,
            spacing: spacing as number,
            offsetX: offsetX as number,
            offsetY: offsetY as number,
        });

        const figureAttrs = mergeAttributes(this.options.HTMLAttributes, rest, {
            "data-embedded-image": "true",
            style: `display: block; border: none; background: transparent; ${layoutStyle}`,
            ...getImageDataAttributes({
                layout,
                alignment,
                spacing,
                offsetX,
                offsetY,
            }),
        });

        const widthStyle = width
            ? `width: ${width}px; max-width: 100%;`
            : "width: 100%; max-width: 100%;";
        const imgAttrs: Record<string, string> = {
            src: src as string,
            alt: (alt as string) || "",
            style: `display: block; ${widthStyle} height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);`,
        };

        const captionStyle =
            "display: flex; align-items: center; justify-content: flex-end; gap: 6px; padding: 8px 4px 0 0; font-size: 12px; color: #94A3B8; font-style: italic;";

        if (creditUrl) {
            const linkAttrs: Record<string, string> = {
                href: creditUrl as string,
                target: "_blank",
                rel: "noopener noreferrer",
                style: "color: #16a34a; text-decoration: none; font-weight: 600; transition: opacity 0.2s;",
            };

            return [
                "figure",
                figureAttrs,
                ["img", imgAttrs],
                [
                    "figcaption",
                    { style: captionStyle },
                    [
                        "span",
                        { style: "opacity: 0.7; font-size: 11px;" },
                        "📷 ",
                    ],
                    ["a", linkAttrs, creditText || "Source"],
                ],
            ];
        }

        return [
            "figure",
            figureAttrs,
            ["img", imgAttrs],
            [
                "figcaption",
                { style: captionStyle },
                [
                    "span",
                    { style: "opacity: 0.7; font-size: 11px;" },
                    "📷 ",
                ],
                creditText || "",
            ],
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageNodeView);
    },

    addCommands() {
        return {
            setEmbeddedImage:
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
