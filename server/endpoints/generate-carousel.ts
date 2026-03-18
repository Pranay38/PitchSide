import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function generateCarouselHandler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    try {
        const { article } = req.body;
        if (!article) {
            return res.status(400).json({ error: "Missing 'article' in the request body." });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured in the server environment." });
        }

        const prompt = `You are a social media creator for a hype football blog called "The Touchline Dribble".
Extract content from the article for a visual Instagram carousel. Return ONLY raw JSON, no markdown, no explanation:
{
  "cover":   { "tag": "1-2 word category e.g. TRANSFER / OPINION / MATCH", "headline": "MAX 5 WORDS ALL CAPS", "subtext": "one sentence max 10 words" },
  "stats":   [ { "stat": "short number/value", "label": "2-4 WORDS ALL CAPS", "context": "one punchy sentence max 12 words" } ],
  "facts":   [ { "fact": "shocking statement MAX 10 WORDS ALL CAPS", "commentary": "one sentence max 12 words" } ],
  "hottake": { "take": "boldest opinion MAX 8 WORDS ALL CAPS", "support": "one sentence max 12 words" }
}
Rules: 1-2 stats, 1-2 facts max. Keep ALL text extremely short. Hype energy. Less is more.`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1000,
                system: prompt,
                messages: [{ role: "user", content: `Article:\n\n${article}` }]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Anthropic API error:", err);
            return res.status(response.status).json({ error: "Failed to generate carousel content from AI provider." });
        }

        const data = await response.json();
        
        // Extract raw JSON string from the response
        let rawContent = data.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
        
        // Clean markdown backticks if present
        rawContent = rawContent.replace(/```json|```/g, "").trim();

        // Attempt to parse the JSON returned to ensure it is valid
        const parsedContext = JSON.parse(rawContent);

        return res.status(200).json({ data: parsedContext });
    } catch (error: any) {
        console.error("Error in generate-carousel:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
