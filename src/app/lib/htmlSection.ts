/** URI encoding keeps section markup opaque to article parsing and sanitizers. */
export function encodeHtmlSection(source: string) { return encodeURIComponent(source); }
export function decodeHtmlSection(value: string) {
    try { return decodeURIComponent(value); } catch { return ""; }
}
export function splitHtmlSections(content: string): Array<{ type: "html" | "html-section"; content: string }> {
    const result: Array<{ type: "html" | "html-section"; content: string }> = [];
    const pattern = /<div data-html-section="([^"]*)"><\/div>/g;
    let end = 0;
    for (const match of content.matchAll(pattern)) {
        if (match.index! > end) result.push({ type: "html", content: content.slice(end, match.index) });
        const source = decodeHtmlSection(match[1]);
        if (source) result.push({ type: "html-section", content: source });
        end = match.index! + match[0].length;
    }
    if (end < content.length) result.push({ type: "html", content: content.slice(end) });
    return result;
}
