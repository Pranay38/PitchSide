import { convert } from "html-to-text";
import { createUnsubscribeUrl } from "./unsubscribe";

export interface EmailTemplateProps {
  title: string;
  previewText?: string;
  content: string;
  unsubscribeUrl: string;
}
export const escapeEmailHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
export function emailToText(html: string): string {
  return convert(html, { wordwrap: false, selectors: [
    { selector: "[data-email-preview]", format: "skip" },
    { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
    { selector: "h1", options: { uppercase: false } },
    { selector: "h2", options: { uppercase: false } },
    { selector: "h3", options: { uppercase: false } },
  ] });
}
export function buildEditorialEmail({ title, previewText, content, unsubscribeUrl }: EmailTemplateProps): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeEmailHtml(title)}</title>
<style>body{margin:0;background:#fff;color:#1e293b;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7}p{margin:0 0 20px}h1,h2,h3{line-height:1.3}h2{font-size:23px}a{color:#15803d;text-decoration:underline;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}@media(max-width:600px){.letter{padding:24px 20px!important}}</style></head>
<body>${previewText ? `<div data-email-preview="true" style="display:none;max-height:0;overflow:hidden">${escapeEmailHtml(previewText)}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:600px" cellspacing="0" cellpadding="0"><tr><td class="letter" style="padding:36px 28px">
<p style="font-size:14px;color:#64748b">The Weekly Whistle · The Touchline Dribble</p>
${content}
<hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0">
<p style="font-size:12px;color:#64748b">You’re receiving this because you subscribed to The Touchline Dribble.<br><a href="${escapeEmailHtml(unsubscribeUrl)}">Unsubscribe</a></p>
</td></tr></table></td></tr></table></body></html>`;
}
export function buildSubscriberEmail({ email, ...props }: Omit<EmailTemplateProps, "unsubscribeUrl"> & { email: string }) {
  const unsubscribeUrl = createUnsubscribeUrl(email);
  const html = buildEditorialEmail({ ...props, unsubscribeUrl });
  return { html, text: emailToText(html), unsubscribeUrl };
}
