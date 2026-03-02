import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, " ").trim();
}

function extractFromXML(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?\\s*</${tag}>`, "s"));
    return match ? match[1].trim() : "";
}

async function fetchGossipRss(): Promise<any[]> {
    try {
        const res = await fetch("https://feeds.bbci.co.uk/sport/football/gossip/rss.xml", {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) return [];
        const xml = await res.text();

        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 6) {
            const itemXml = match[1];
            const title = stripHtml(extractFromXML(itemXml, "title"));
            const link = extractFromXML(itemXml, "link");
            if (title && !title.toLowerCase().includes("video")) {
                items.push({
                    type: "rumor",
                    text: title.replace(/^Gossip: /, ""),
                    link
                });
                count++;
            }
        }
        return items;
    } catch {
        return [];
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        // 1. Load static transfers
        const filePath = path.join(process.cwd(), "public", "data", "transfers.json");
        const transfersJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // 2. Fetch live FPL data in parallel with Gossip RSS
        const [fplRes, rumors] = await Promise.all([
            fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
                headers: { "User-Agent": "Mozilla/5.0" },
                signal: AbortSignal.timeout(5000)
            }).catch(() => null),
            fetchGossipRss()
        ]);

        let fplElements: any[] = [];
        if (fplRes && fplRes.ok) {
            const fplData = await fplRes.json();
            fplElements = fplData.elements || [];
        }

        // 3. Map transfers and enrich with FPL performance if available
        const verifiedTransfers = transfersJson.map((t: any) => {
            let perf = t.performance || "Ready to make an impact.";

            if (t.fpl_id) {
                const player = fplElements.find(p => p.id === t.fpl_id);
                if (player) {
                    if (player.minutes === 0) {
                        perf = "Yet to make an appearance.";
                    } else {
                        // Dynamically generate performance string
                        const stats = [];
                        if (player.goals_scored > 0) stats.push(`${player.goals_scored} goals`);
                        if (player.assists > 0) stats.push(`${player.assists} assists`);
                        if (player.clean_sheets > 0 && player.element_type <= 2) stats.push(`${player.clean_sheets} clean sheets`);

                        perf = stats.length > 0
                            ? `Live Stats: ${stats.join(", ")} in ${player.minutes} mins.`
                            : `Played ${player.minutes} mins so far.`;
                    }
                }
            }

            return {
                type: "transfer",
                player: t.player,
                move: `${t.from} → ${t.to}`,
                fee: t.fee,
                performance: perf,
                window: t.window
            };
        });

        // 4. Combine and shuffle slightly to interleave rumors and transfers
        const tickerItems = [];
        let tIdx = 0;
        let rIdx = 0;

        while (tIdx < verifiedTransfers.length || rIdx < rumors.length) {
            if (tIdx < verifiedTransfers.length) {
                tickerItems.push(verifiedTransfers[tIdx++]);
                if (tIdx < verifiedTransfers.length) tickerItems.push(verifiedTransfers[tIdx++]);
            }
            if (rIdx < rumors.length) {
                tickerItems.push(rumors[rIdx++]);
            }
        }

        res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1200"); // 10 mins cache
        return res.status(200).json(tickerItems);

    } catch (error: any) {
        console.error("Transfers API Error:", error);
        return res.status(500).json({ error: "Failed to fetch ticker data" });
    }
}
