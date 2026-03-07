import { Node, mergeAttributes } from "@tiptap/core";

export type SocialPlatform = "twitter" | "instagram" | "youtube" | "image" | "sofascore";

/** Detect platform from a URL string */
export function detectPlatform(url: string): SocialPlatform {
    const u = url.toLowerCase();
    if (u.includes("twitter.com/") || u.includes("x.com/")) return "twitter";
    if (u.includes("instagram.com/")) return "instagram";
    if (
        u.includes("youtube.com/watch") ||
        u.includes("youtu.be/") ||
        u.includes("youtube.com/embed") ||
        u.includes("youtube.com/shorts")
    )
        return "youtube";
    if (u.includes("sofascore.com/")) return "sofascore";
    return "image";
}

/** Extract YouTube video ID from various URL formats */
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

/** Extract tweet URL in a clean format */
function cleanTweetUrl(url: string): string {
    // Normalise x.com to twitter.com for the embed blockquote
    return url.replace("x.com/", "twitter.com/");
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        socialEmbed: {
            setSocialEmbed: (options: {
                url: string;
                platform?: SocialPlatform;
                creditText?: string;
                creditUrl?: string;
                embedHeight?: string;
            }) => ReturnType;
        };
    }
}

export const SocialEmbed = Node.create({
    name: "socialEmbed",
    group: "block",
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            url: { default: "" },
            platform: { default: "image" },
            creditText: { default: "" },
            creditUrl: { default: "" },
            embedHeight: { default: "" },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-social-embed]' }];
    },

    renderHTML({ HTMLAttributes }) {
        const { url, platform, creditText, creditUrl } = HTMLAttributes;
        const p = (platform || detectPlatform(url || "")) as SocialPlatform;

        const isThirdPartyEmbed = p === "twitter" || p === "instagram";
        const wrapperAttrs = mergeAttributes({
            "data-social-embed": p,
            "data-url": url,
            style: isThirdPartyEmbed 
                ? "margin: 1.5rem 0; display: flex; justify-content: center; width: 100%;" 
                : "margin: 1.5rem 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(100,116,139,0.2); background: #f8fafc;",
        });

        // --- Twitter ---
        if (p === "twitter") {
            return [
                "div",
                wrapperAttrs,
                [
                    "blockquote",
                    { class: "twitter-tweet", "data-dnt": "true" },
                    [
                        "a",
                        { href: cleanTweetUrl(url) },
                        "Loading tweet…",
                    ],
                ],
            ];
        }

        // --- Instagram ---
        if (p === "instagram") {
            // Clean the URL to just the post permalink
            const igUrl = url.split("?")[0];
            return [
                "div",
                wrapperAttrs,
                [
                    "blockquote",
                    {
                        class: "instagram-media",
                        "data-instgrm-permalink": igUrl,
                        "data-instgrm-version": "14",
                        style: "max-width: 540px; width: 100%; margin: 0 auto;",
                    },
                    [
                        "a",
                        { href: igUrl, target: "_blank", rel: "noopener noreferrer" },
                        "View on Instagram",
                    ],
                ],
            ];
        }

        // --- YouTube ---
        if (p === "youtube") {
            const videoId = extractYouTubeId(url);
            const embedUrl = videoId
                ? `https://www.youtube.com/embed/${videoId}`
                : url;
            return [
                "div",
                wrapperAttrs,
                [
                    "iframe",
                    {
                        src: embedUrl,
                        width: "100%",
                        height: "400",
                        frameborder: "0",
                        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                        allowfullscreen: "true",
                        style: "border: none; border-radius: 12px;",
                    },
                ],
            ];
        }

        // --- Sofascore ---
        if (p === "sofascore") {
            const height = HTMLAttributes.embedHeight || "800";
            return [
                "div",
                wrapperAttrs,
                [
                    "iframe",
                    {
                        src: url,
                        width: "100%",
                        height: height,
                        frameborder: "0",
                        scrolling: "no",
                        sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
                        style: "border: none; border-radius: 12px; background: white; min-height: 400px;",
                    },
                ],
            ];
        }

        // --- Fallback: Regular image with credit ---
        const captionStyle =
            "display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 12px; color: #64748b; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); border-top: 1px solid rgba(100,116,139,0.15);";
        const linkStyle =
            "color: #16a34a; text-decoration: none; font-weight: 600;";

        if (creditUrl) {
            return [
                "div",
                wrapperAttrs,
                [
                    "img",
                    {
                        src: url,
                        style: "display: block; width: 100%; height: auto;",
                        loading: "lazy",
                    },
                ],
                [
                    "div",
                    { style: captionStyle },
                    ["span", { style: "opacity: 0.7; font-size: 11px;" }, "📷 "],
                    [
                        "a",
                        {
                            href: creditUrl,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            style: linkStyle,
                        },
                        creditText || "Source",
                    ],
                ],
            ];
        }

        return [
            "div",
            wrapperAttrs,
            [
                "img",
                {
                    src: url,
                    style: "display: block; width: 100%; height: auto;",
                    loading: "lazy",
                },
            ],
            [
                "div",
                { style: captionStyle },
                ["span", { style: "opacity: 0.7; font-size: 11px;" }, "📷 "],
                creditText || "",
            ],
        ];
    },

    addCommands() {
        return {
            setSocialEmbed:
                (options) =>
                    ({ commands }) => {
                        const platform = options.platform || detectPlatform(options.url);
                        return commands.insertContent({
                            type: this.name,
                            attrs: { ...options, platform },
                        });
                    },
        };
    },
});
