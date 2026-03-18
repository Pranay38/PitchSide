import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── Prompt templates ──────────────────────────────────────────────────────

const CAROUSEL_SYSTEM = `You are a social media creator for a hype football blog called "The Touchline Dribble".
Extract content from the article for a visual Instagram carousel. Return ONLY raw JSON, no markdown, no explanation:
{
  "cover":   { "tag": "1-2 word category e.g. TRANSFER / OPINION / MATCH", "headline": "MAX 5 WORDS ALL CAPS", "subtext": "one sentence max 10 words" },
  "stats":   [ { "stat": "short number/value", "label": "2-4 WORDS ALL CAPS", "context": "one punchy sentence max 12 words" } ],
  "facts":   [ { "fact": "shocking statement MAX 10 WORDS ALL CAPS", "commentary": "one sentence max 12 words" } ],
  "hottake": { "take": "boldest opinion MAX 8 WORDS ALL CAPS", "support": "one sentence max 12 words" }
}
Rules: 1-2 stats, 1-2 facts max. Keep ALL text extremely short. Hype energy. Less is more.`;

const TWEET_THREAD_SYSTEM = `You are a social media manager for "The Touchline Dribble", a football blog. 
Create an engaging Twitter/X thread from the provided article. Return ONLY raw JSON array, no markdown:
[
  "tweet 1 text (hook, make people stop scrolling)",
  "tweet 2 text",
  "tweet 3 text",
  ...
  "final tweet (CTA, follow @thetouchlinedribble)"
]
Rules:
- Generate 5-8 tweets
- Each tweet MUST be under 280 characters
- First tweet is the hook — bold, punchy, curiosity-driven
- Use emojis sparingly but effectively
- Include stats and hot takes from the article
- Last tweet should be a CTA with the blog handle
- No hashtag spam — max 1-2 hashtags total across the whole thread
- Write with energy and personality, not corporate tone`;

const DRAFT_PROMPTS: Record<string, string> = {
    outline: `You are a senior football writer. Generate a detailed article outline from the provided text.
Return a clean, structured outline with:
- A suggested title
- 4-6 main sections with brief descriptions
- Key talking points under each section
Format as clean markdown. Be specific to the football content.`,

    headlines: `You are a headline specialist for a football blog. Generate 6 headline options for the provided article.
Return ONLY a JSON array of 6 strings. Each headline should be:
- Punchy and clickworthy (but not clickbait)
- Under 80 characters
- Varying styles: news, opinion, analytical, provocative
Return ONLY the raw JSON array, no markdown.`,

    intro: `You are a top football journalist. Write a compelling opening paragraph for the provided article content.
- 2-3 sentences max
- Hook the reader immediately
- Set up the stakes
- Use vivid, confident language
Return ONLY the paragraph text, no markdown formatting.`,

    expand: `You are a football writer expanding an article draft. Take the provided text and flesh it out:
- Add context, stats references, tactical analysis
- Maintain the original voice and angle
- Double the length while keeping it engaging
- Use short paragraphs for readability
Return the expanded text in clean markdown.`,

    hottake: `You are a bold football commentator known for spicy takes. Generate ONE hot take based on the provided article.
Return JSON: { "take": "the hot take in 1-2 sentences", "reasoning": "3-4 sentences defending the take with evidence from the article", "counterpoint": "1 sentence acknowledging the strongest opposing view" }
Be genuinely provocative but not stupid. Back it up. Return ONLY raw JSON.`,

    summary: `You are an editor condensing football articles. Summarize the provided text into a crisp TL;DR.
- 3-4 bullet points capturing the key takeaways
- One concluding sentence with the overall narrative
Format as clean markdown with bullet points.`,
};

// ── Gemini API call ───────────────────────────────────────────────────────

async function callGemini(systemPrompt: string, userContent: string, apiKey: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [{
                parts: [{ text: userContent }]
            }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Gemini API error:", err);
        throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");
    return text;
}

// ── Route handler ─────────────────────────────────────────────────────────

export default async function aiGenerateHandler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    try {
        const { type, article, text, action } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
        }

        let systemPrompt: string;
        let userContent: string;

        switch (type) {
            case "carousel": {
                if (!article) return res.status(400).json({ error: "Missing 'article' field." });
                systemPrompt = CAROUSEL_SYSTEM;
                userContent = `Article:\n\n${article}`;
                break;
            }
            case "tweet-thread": {
                if (!article) return res.status(400).json({ error: "Missing 'article' field." });
                systemPrompt = TWEET_THREAD_SYSTEM;
                userContent = `Article:\n\n${article}`;
                break;
            }
            case "draft-assist": {
                if (!text || !action) return res.status(400).json({ error: "Missing 'text' or 'action' field." });
                systemPrompt = DRAFT_PROMPTS[action];
                if (!systemPrompt) return res.status(400).json({ error: `Unknown draft action: ${action}` });
                userContent = text;
                break;
            }
            default:
                return res.status(400).json({ error: `Unknown type: ${type}` });
        }

        const raw = await callGemini(systemPrompt, userContent, apiKey);

        // For JSON-returning types, clean and parse
        if (type === "carousel" || type === "tweet-thread" || (type === "draft-assist" && (action === "headlines" || action === "hottake"))) {
            const cleaned = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleaned);
            return res.status(200).json({ data: parsed });
        }

        // For text-returning types, return raw
        return res.status(200).json({ data: raw });

    } catch (error: any) {
        console.error("Error in ai-generate:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
