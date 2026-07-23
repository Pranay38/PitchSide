import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageNodeView } from "./ResizableImageNodeView";

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
        const { src, creditText, creditUrl, width, alt, ...rest } = HTMLAttributes;

        const figureAttrs = mergeAttributes(this.options.HTMLAttributes, rest, {
            "data-embedded-image": "true",
            style:
                "margin: 2rem 0; display: block; border: none; background: transparent;",
        });

        const widthStyle = width ? `width: ${width}px; max-width: 100%;` : "width: 100%; max-width: 100%;";
        const imgAttrs: Record<string, string> = {
            src: src as string,
            alt: (alt as string) || "",
            style:
                `display: block; ${widthStyle} height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);`,
        };

        const captionStyle =
            "display: flex; align-items: center; justify-content: flex-end; gap: 6px; padding: 8px 4px 0 0; font-size: 12px; color: #94A3B8; font-style: italic;";

        if (creditUrl) {
            const linkAttrs: Record<string, string> = {
                href: creditUrl as string,
                target: "_blank",
                rel: "noopener noreferrer",
                style:
                    "color: #16a34a; text-decoration: none; font-weight: 600; transition: opacity 0.2s;",
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
});
