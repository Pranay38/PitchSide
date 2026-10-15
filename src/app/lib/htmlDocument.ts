/** Stored as opaque content: only HtmlDocumentFrame may execute this document. */
export const HTML_DOCUMENT_PREFIX = '<!--touchline-html-document:v1-->\n';
export const isHtmlDocument = (content: string) => content.startsWith(HTML_DOCUMENT_PREFIX);
export const wrapHtmlDocument = (source: string) => HTML_DOCUMENT_PREFIX + source;
export const readHtmlDocument = (content: string) => isHtmlDocument(content) ? content.slice(HTML_DOCUMENT_PREFIX.length) : null;
