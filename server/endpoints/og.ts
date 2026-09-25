import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const { title = "The Touchline Dribble", club = "", date = "" } = req.query as Record<string, string>;

    const displayTitle = decodeURIComponent(title);
    const displayClub = decodeURIComponent(club);
    const displayDate = decodeURIComponent(date);

    // Dynamic font size based on title length
    const fontSize = displayTitle.length > 60 ? 38 : displayTitle.length > 40 ? 44 : 52;

    const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&amp;display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&amp;display=swap');
      .title { font-family: 'Space Grotesk', system-ui, sans-serif; font-weight: 700; fill: #FFFFFF; }
      .brand { font-family: 'Inter', system-ui, sans-serif; font-weight: 700; fill: #94A3B8; letter-spacing: 2px; }
      .badge { font-family: 'Inter', system-ui, sans-serif; font-weight: 700; fill: #16A34A; }
      .meta { font-family: 'Inter', system-ui, sans-serif; font-weight: 500; fill: #64748B; }
      .url { font-family: 'Inter', system-ui, sans-serif; font-weight: 600; fill: #16A34A; }
    </style>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A"/>
      <stop offset="50%" style="stop-color:#121212"/>
      <stop offset="100%" style="stop-color:#0A0A0A"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#16A34A"/>
      <stop offset="50%" style="stop-color:#22c55e"/>
      <stop offset="100%" style="stop-color:#4ade80"/>
    </linearGradient>
    <radialGradient id="glow1" cx="85%" cy="15%" r="35%">
      <stop offset="0%" style="stop-color:rgba(22,163,74,0.3)"/>
      <stop offset="100%" style="stop-color:rgba(22,163,74,0)"/>
    </radialGradient>
    <radialGradient id="glow2" cx="10%" cy="90%" r="30%">
      <stop offset="0%" style="stop-color:rgba(22,163,74,0.15)"/>
      <stop offset="100%" style="stop-color:rgba(22,163,74,0)"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <!-- Top branding bar -->
  <rect x="60" y="40" width="6" height="28" rx="3" fill="url(#accent)"/>
  <text x="78" y="62" class="brand">
    THE TOUCHLINE DRIBBLE
  </text>

  <!-- Club badge (if provided) -->
  ${displayClub ? `
  <rect x="960" y="35" width="${Math.min(displayClub.length * 10 + 32, 200)}" height="34" rx="17" fill="rgba(22,163,74,0.1)" stroke="rgba(22,163,74,0.3)" stroke-width="1"/>
  <text x="${960 + Math.min(displayClub.length * 10 + 32, 200) / 2}" y="57" class="badge" text-anchor="middle">
    ${escapeXml(displayClub)}
  </text>
  ` : ""}

  <!-- Title -->
  <text x="60" y="420" class="title" font-size="${fontSize}">
    ${wrapText(escapeXml(displayTitle), fontSize, 900).map((line: string, i: number) =>
        `<tspan x="60" dy="${i === 0 ? 0 : fontSize * 1.2}">${line}</tspan>`
    ).join("")}
  </text>

  <!-- Meta line -->
  ${displayDate ? `
  <text x="60" y="560" class="meta" font-size="16">
    ${escapeXml(displayDate)}
  </text>
  ` : ""}
  <text x="${displayDate ? 260 : 60}" y="560" class="url" font-size="16">
    pitchside-orcin.vercel.app
  </text>

  <!-- Bottom accent bar -->
  <rect x="0" y="626" width="1200" height="4" fill="url(#accent)"/>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).send(svg);
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
    const charWidth = fontSize * 0.55;
    const maxChars = Math.floor(maxWidth / charWidth);
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        if ((currentLine + " " + word).trim().length > maxChars) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + " " + word : word;
        }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines.slice(0, 3); // Max 3 lines
}
