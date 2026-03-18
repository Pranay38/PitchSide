import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const { 
        username = "Fan", 
        saved = "0", 
        clubs = "0", 
        debates = "0",
        year = new Date().getFullYear().toString()
    } = req.query as Record<string, string>;

    const displayUser = decodeURIComponent(username);
    
    // Fallbacks just in case
    const numSaved = parseInt(saved) || 0;
    const numClubs = parseInt(clubs) || 0;
    const numDebates = parseInt(debates) || 0;

    const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0B1120"/>
      <stop offset="50%" style="stop-color:#111827"/>
      <stop offset="100%" style="stop-color:#0F172A"/>
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
      <stop offset="0%" style="stop-color:rgba(34,197,94,0.15)"/>
      <stop offset="100%" style="stop-color:rgba(34,197,94,0)"/>
    </radialGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(30,41,59,0.8)"/>
      <stop offset="100%" style="stop-color:rgba(15,23,42,0.9)"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <!-- Top branding bar -->
  <rect x="60" y="40" width="6" height="28" rx="3" fill="url(#accent)"/>
  <text x="78" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#94A3B8" letter-spacing="3">
    THE TOUCHLINE DRIBBLE
  </text>
  
  <rect x="980" y="38" width="160" height="32" rx="16" fill="rgba(22,163,74,0.1)" stroke="rgba(22,163,74,0.3)" stroke-width="1"/>
  <text x="1060" y="59" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#16A34A" text-anchor="middle" letter-spacing="1">
    WRAPPED ${escapeXml(year)}
  </text>

  <!-- Header -->
  <text x="60" y="160" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#16A34A" letter-spacing="1">
    AN EPIC SEASON FOR
  </text>
  <text x="60" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
    ${escapeXml(displayUser.toUpperCase())}
  </text>
  
  <text x="60" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500" fill="#94A3B8">
    Here is a look back at your year on the platform.
  </text>

  <!-- Stats Grid -->
  <g transform="translate(60, 360)">
    <!-- Stat 1: Saved Articles -->
    <rect x="0" y="0" width="340" height="150" rx="24" fill="url(#cardBg)" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
    <text x="30" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#94A3B8" letter-spacing="2">ARTICLES SAVED</text>
    <text x="30" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="#FFFFFF">${numSaved}</text>

    <!-- Stat 2: Clubs Followed -->
    <rect x="370" y="0" width="340" height="150" rx="24" fill="url(#cardBg)" stroke="rgba(22,163,74,0.2)" stroke-width="2"/>
    <text x="400" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#16A34A" letter-spacing="2">CLUBS FOLLOWED</text>
    <text x="400" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="#FFFFFF">${numClubs}</text>

    <!-- Stat 3: Hot Takes (Debates) -->
    <rect x="740" y="0" width="340" height="150" rx="24" fill="url(#cardBg)" stroke="rgba(255,255,255,0.05)" stroke-width="2"/>
    <text x="770" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#94A3B8" letter-spacing="2">DEBATES VOTED</text>
    <text x="770" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="#FFFFFF">${numDebates}</text>
  </g>

  <!-- Bottom branding -->
  <text x="60" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#16A34A">
    pitchside-orcin.vercel.app
  </text>
  
  <!-- Bottom accent bar -->
  <rect x="0" y="626" width="1200" height="4" fill="url(#accent)"/>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800"); // Cache aggressively for the year
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
