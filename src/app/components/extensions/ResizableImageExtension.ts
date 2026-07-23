/**
 * ResizableImage — drop-in replacement for @tiptap/extension-image
 * that renders a React NodeView with MS-Word-style drag-resize handles.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableStandardImageNodeView } from "./ResizableStandardImageNodeView";

export interface ResizableImageOptions {
    inline: boolean;
    allowBase64: boolean;
    HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        resizableImage: {
            setImage: (options: { src: string; alt?: string; title?: string; width?: number }) => ReturnType;
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
        };
    },

    parseHTML() {
        return [{ tag: "img[src]" }];
    },

    renderHTML({ HTMLAttributes }) {
        const { width, ...rest } = HTMLAttributes;
        const widthStyle = width ? `width: ${width}px; max-width: 100%;` : "max-width: 100%;";
        return [
            "img",
            mergeAttributes(this.options.HTMLAttributes, rest, {
                style: `${widthStyle} height: auto;`,
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
});
