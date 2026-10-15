import DOMPurify from "isomorphic-dompurify";

export const MAX_HTML_IMPORT_MB = 50;

/** Import document bodies and HTML fragments into the editable article schema. */
export async function importHtmlFile(file: File): Promise<string> {
    if (!/\.html?$/i.test(file.name)) throw new Error("Choose an HTML file (.html or .htm).");
    if (file.size > MAX_HTML_IMPORT_MB * 1024 * 1024) throw new Error(`Choose an HTML file no larger than ${MAX_HTML_IMPORT_MB} MB.`);
    const source = await file.text();
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
