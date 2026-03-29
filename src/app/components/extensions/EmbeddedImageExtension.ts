import { Node, mergeAttributes } from "@tiptap/core";

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
        const { src, creditText, creditUrl, ...rest } = HTMLAttributes;

        const figureAttrs = mergeAttributes(this.options.HTMLAttributes, rest, {
            "data-embedded-image": "true",
            style:
                "margin: 2rem 0; display: block; border: none; background: transparent;",
        });

        const imgAttrs: Record<string, string> = {
            src: src as string,
            style:
                "display: block; width: 100%; max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);",
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
