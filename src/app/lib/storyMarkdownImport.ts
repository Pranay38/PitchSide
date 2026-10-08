import { createEmptyStoryChapter } from "../data/stories";

/** Split sanitized imported HTML at top-level H2s, keeping all other content. */
export function storyFromImportedHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const heading = doc.body.querySelector(":scope > h1");
  const title = heading?.textContent?.trim() || "";
  heading?.remove();
  const chapters: ReturnType<typeof createEmptyStoryChapter>[] = [];
  let chapterTitle = "Introduction";
  let body = "";
  const flush = () => {
    if (!body.trim() && chapterTitle === "Introduction" && !chapters.length) return;
    const chapter = createEmptyStoryChapter();
    chapters.push({ ...chapter, title: chapterTitle, body: [body] });
    body = "";
  };
  for (const node of Array.from(doc.body.childNodes)) {
    if (node.nodeType === 1 && (node as Element).tagName === "H2") {
      flush();
      chapterTitle = node.textContent?.trim() || `Chapter ${chapters.length + 1}`;
    } else {
      body += node.nodeType === 1 ? (node as Element).outerHTML : node.textContent?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") || "";
    }
  }
  flush();
  if (!chapters.length) throw new Error("Add some story content to the Markdown file before importing.");
  return { title, chapters };
}
