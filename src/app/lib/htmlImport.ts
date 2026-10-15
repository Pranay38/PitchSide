import { wrapHtmlDocument } from "./htmlDocument";

export type HtmlImportMode = "editable" | "preserve";

export const MAX_HTML_IMPORT_MB = 50;

/** Import document bodies and HTML fragments into the editable article schema. */
export async function importHtmlFile(file: File, mode: HtmlImportMode = "editable"): Promise<string> {
    if (!/\.html?$/i.test(file.name)) throw new Error("Choose an HTML file (.html or .htm).");
    if (file.size > MAX_HTML_IMPORT_MB * 1024 * 1024) throw new Error(`Choose an HTML file no larger than ${MAX_HTML_IMPORT_MB} MB.`);
    const source = await file.text();
    if (mode === "preserve") {
        if (!source.trim()) throw new Error("This HTML file is empty.");
        // Scan image attributes without constructing and sanitizing a second DOM.
        for (const match of source.matchAll(/<img\b[^>]*>/gi)) {
            const src = match[0].match(/\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
            const value = src?.[1] ?? src?.[2] ?? src?.[3] ?? "";
            if (!/^(https?:\/\/|\/\/|data:image\/)/i.test(value)) {
                throw new Error("This HTML uses local image paths. Use full web image URLs or embed the images in the HTML before importing.");
            }
        }
        return wrapHtmlDocument(source.replace(/^\uFEFF/, ""));
    }
    const { default: DOMPurify } = await import("isomorphic-dompurify");
    const clean = DOMPurify.sanitize(source.replace(/^\uFEFF/, ""), {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["script", "style", "iframe", "form", "input", "button", "textarea", "select", "object", "embed", "template"],
        FORBID_ATTR: ["style", "srcset"],
    });
    const doc = new DOMParser().parseFromString(clean, "text/html");
    if (!doc.body.textContent?.trim() && !doc.body.querySelector("img")) {
        throw new Error("This HTML file is empty or has no editable article content.");
    }
    // Local paths cannot be served from a reader's computer after publication.
    for (const image of Array.from(doc.body.querySelectorAll("img"))) {
        const src = image.getAttribute("src") || "";
        if (!/^(https?:\/\/|\/\/|data:image\/)/i.test(src)) {
            throw new Error("This HTML uses local image paths. Use full web image URLs or embed the images in the HTML before importing.");
        }
    }
    return doc.body.innerHTML;
}
