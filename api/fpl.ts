import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    try {
        const response = await fetch("https://fantasy.premierleague.com/api/bootstrap-static/", {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; FootballBlog/1.0)" }
        });

        if (!response.ok) {
            throw new Error(`FPL API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Map element types (positions) to readable names
        const elementTypes = data.element_types.reduce((acc: any, type: any) => {
            acc[type.id] = type.singular_name_short;
            return acc;
        }, {});

        // Map teams to names
        const teams = data.teams.reduce((acc: any, team: any) => {
            acc[team.id] = { name: team.name, short_name: team.short_name };
            return acc;
        }, {});

        // Enrich and filter player data
        const players = data.elements.map((p: any) => ({
            id: p.id,
            name: `${p.first_name} ${p.second_name}`,
            web_name: p.web_name,
            team: teams[p.team]?.short_name || "Unknown",
            position: elementTypes[p.element_type] || "Unknown",
            cost: (p.now_cost / 10).toFixed(1), // FPL stores cost as integer (e.g., 75 = £7.5m)
            points: p.total_points,
            selected_by_percent: parseFloat(p.selected_by_percent),
            form: parseFloat(p.form),
            value: parseFloat(p.value_season), // Points per million
            minutes: p.minutes,
            goals: p.goals_scored,
            assists: p.assists,
            clean_sheets: p.clean_sheets
        }));

        // Filter out players with 0 minutes and calculate categories
        const activePlayers = players.filter((p: any) => p.minutes > 0);

        // 1. Top Performers (Highest total points)
        const topPerformers = [...activePlayers].sort((a, b) => b.points - a.points).slice(0, 10);

        // 2. Best Value (Highest points per million, min 500 minutes)
        const bestValue = [...activePlayers]
            .filter((p: any) => p.minutes > 500)
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // 3. Differentials (Ownership < 10%, sorted by form)
        const differentials = [...activePlayers]
            .filter((p: any) => p.selected_by_percent < 10 && p.minutes > 200)
            .sort((a, b) => b.form - a.form)
            .slice(0, 10);

        res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200"); // Cache for 1 hour
        return res.status(200).json({
            topPerformers,
            bestValue,
            differentials
        });

    } catch (error: any) {
        console.error("FPL API Error:", error);
        return res.status(500).json({ error: "Failed to fetch FPL data." });
    }
}
