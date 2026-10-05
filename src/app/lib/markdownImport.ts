import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

/** Convert untrusted Markdown before it reaches the editor or preview. */
export function renderMarkdown(source: string): string {
    if (!source.trim()) throw new Error("This Markdown file is empty.");
    return DOMPurify.sanitize(marked.parse(source.replace(/^\uFEFF/, ""), { gfm: true, async: false }), {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["iframe", "form", "style", "script"],
    });
}

export async function importMarkdownFiles(files: File[]): Promise<{ html: string; missingImages: string[] }> {
    const markdown = files.filter(file => /\.(md|markdown)$/i.test(file.name));
    if (markdown.length !== 1) throw new Error("Select one .md file, plus any images it uses.");
    if (markdown[0].size > 5 * 1024 * 1024) throw new Error("Choose a Markdown file smaller than 5 MB.");
    const doc = new DOMParser().parseFromString(renderMarkdown(await markdown[0].text()), "text/html");
    const missingImages: string[] = [];
    for (const image of Array.from(doc.querySelectorAll("img"))) {
        const src = image.getAttribute("src") || "";
        if (/^(https?:|data:image\/|\/\/|\/)/i.test(src)) continue;
        let filename = src.split(/[?#]/)[0].split(/[\\/]/).pop() || "";
        try { filename = decodeURIComponent(filename); } catch { /* Keep literal filenames. */ }
        const matches = files.filter(file => file.name === filename && file.type.startsWith("image/"));
        if (matches.length !== 1) { missingImages.push(src); continue; }
        if (matches[0].size > 10 * 1024 * 1024) throw new Error(`Image ${filename} exceeds 10 MB.`);
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error(`Could not read ${filename}.`));
            reader.readAsDataURL(matches[0]);
        });
        image.setAttribute("src", dataUrl);
    }
    // Tiptap task lists use explicit data attributes rather than disabled inputs.
    for (const input of Array.from(doc.querySelectorAll('li > input[type="checkbox"]'))) {
        const item = input.parentElement!;
        item.setAttribute("data-type", "taskItem");
        item.setAttribute("data-checked", String(input.hasAttribute("checked")));
        item.parentElement?.setAttribute("data-type", "taskList");
        input.remove();
    }
    return { html: doc.body.innerHTML, missingImages };
}
