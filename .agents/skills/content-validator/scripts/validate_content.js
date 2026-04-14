#!/usr/bin/env node
/**
 * Content Validator
 * Reads leaderboard.json, filters, scores, invokes OpenAI for topic clustering,
 * and generates a high-level strategic content report.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = join(__dirname, '..');
const SCRAPER_ROOT = join(SKILL_ROOT, '..', 'content-scraper');

function loadJSON(path, defaultVal = null) {
    try {
        if (existsSync(path)) {
            return JSON.parse(readFileSync(path, 'utf8'));
        }
    } catch (e) {
        console.error(`Error reading ${path}:`, e.message);
    }
    return defaultVal;
}

function normalize(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
}

async function getTopicClusters(posts, config) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is missing in environment variables. Cannot compute topic clusters.');
    }

    const payload = posts.map((p, i) => ({
        id: `post_${i}`,
        hook: p.hook_text,
        caption: p.full_caption,
    }));

    console.log(`Sending ${payload.length} posts to OpenAI for topic clustering...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: config.llm.model,
            messages: [
                { role: 'system', content: config.llm.system_prompt },
                { role: 'user', content: JSON.stringify(payload) }
            ],
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    try {
        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
        return {};
    }
}

// Fallback topic matcher using highly specific granular keywords
function fallbackTopicClustering(posts) {
    const specificTopics = [
        // Teams & Players specifically
        { topic: "FC Barcelona - UCL Comebacks & Yamal/Cubarsi", keywords: ["barcelona", "barca", "yamal", "cubarsi", "pedri"] },
        { topic: "Real Madrid - 2025 Squad & Mbappe/Vinicius", keywords: ["real madrid", "mbappe", "vinicius", "bellingham", "madrid dressing room"] },
        { topic: "Manchester United - Manager Drama & Player Redemption", keywords: ["onemufc", "manchester united", "man utd", "maguire", "carrick", "sir alex"] },
        { topic: "Arsenal - Premier League Title Pressure", keywords: ["arsenal", "bottling", "bottle", "arteta"] },
        { topic: "Liverpool - Arne Slot Era", keywords: ["liverpool", "arne slot", "slot"] },
        { topic: "Manchester City - Pep Tactics & Bernardo's Exit", keywords: ["manchester city", "mancity", "pep", "bernardo"] },
        
        // Competitions & General tactical
        { topic: "UCL Classic Moments & Quarter Final Predictions", keywords: ["ucl", "champions league", "remontada", "atletico madrid"] },
        { topic: "Italian Serie A - Underdogs & Surprises", keywords: ["serie a", "udinese", "como", "juventus"] },
        
        // Edits & Culture
        { topic: "Cristiano Ronaldo & Messi Nostalgia Edits", keywords: ["ronaldo", "messi", "coldest picture"] },
        { topic: "Goalkeeper Highlight Edits (Neuer etc.)", keywords: ["neuer", "save", "goalkeeper"] },
        { topic: "Funny Football Moments & Celebrations", keywords: ["funny", "laugh", "scuba", "dance", "celebration", "escalated quickly"] },
        
        // Coach & Tactics
        { topic: "Managerial Tactics & 'LinkedIn-speak'", keywords: ["linkedin-speak", "manager", "tactics", "false 9"] }
    ];

    const topicsLookup = {};
    for (const [index, p] of posts.entries()) {
        const textToSearch = ((p.hook_text || "") + " " + (p.full_caption || "") + " " + (p.account || "")).toLowerCase();
        let assignedTopic = "General Football Discussion & Edits";
        
        let bestScore = 0;
        let bestTopic = assignedTopic;
        
        for (const category of specificTopics) {
            let score = 0;
            for (const keyword of category.keywords) {
                if (textToSearch.includes(keyword)) {
                    score++;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestTopic = category.topic;
            }
        }
        
        topicsLookup[`post_${index}`] = bestTopic;
    }
    return topicsLookup;
}

async function main() {
    const configPath = join(SKILL_ROOT, 'config.json');
    const config = loadJSON(configPath);
    if (!config) {
        console.error('Missing config.json');
        process.exit(1);
    }

    const leaderboardPath = join(SCRAPER_ROOT, 'output', 'leaderboard.json');
    const rawPosts = loadJSON(leaderboardPath, []);

    if (rawPosts.length === 0) {
        console.error('No posts found in leaderboard.json. Run content-scraper first.');
        process.exit(1);
    }

    console.log(`Loaded ${rawPosts.length} posts from scraper.`);

    // 1. FILTERING
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.filters.max_days_old);

    let filtered = rawPosts.filter(p => {
        if (p.views < config.filters.min_views) return false;
        if (p.engagement_rate < config.filters.min_engagement_rate) return false;
        if (p.post_date) {
            const date = new Date(p.post_date);
            if (date < cutoffDate) return false;
        }
        return true;
    });

    console.log(`${filtered.length} posts remain after filtering (Views > ${config.filters.min_views}, ER > ${config.filters.min_engagement_rate}%, < 30 days old).`);
    
    if (filtered.length === 0) {
        console.log('No posts left to validate.');
        process.exit(0);
    }

    // Sort by views just to process top highly engaged content if list is huge (take top 100 for API limits)
    filtered.sort((a,b) => b.views - a.views);
    filtered = filtered.slice(0, 100);

    // 2. SCORING
    let minViews = Infinity, maxViews = -Infinity;
    let minEr = Infinity, maxEr = -Infinity;
    let minComm = Infinity, maxComm = -Infinity;

    for (const p of filtered) {
        if (p.views < minViews) minViews = p.views;
        if (p.views > maxViews) maxViews = p.views;
        if (p.engagement_rate < minEr) minEr = p.engagement_rate;
        if (p.engagement_rate > maxEr) maxEr = p.engagement_rate;
        if (p.comments < minComm) minComm = p.comments;
        if (p.comments > maxComm) maxComm = p.comments;
    }

    for (const p of filtered) {
        const normViews = normalize(p.views, minViews, maxViews);
        const normEr = normalize(p.engagement_rate, minEr, maxEr);
        const normComm = normalize(p.comments, minComm, maxComm);

        p.score = (
            (normViews * config.scoring.weights.views) +
            (normEr * config.scoring.weights.engagement_rate) +
            (normComm * config.scoring.weights.comments)
        ) * 100; // 0-100 scale

        p.is_high_signal = p.views > config.scoring.flags.high_signal_views;
        p.is_viral_er = p.engagement_rate > config.scoring.flags.viral_er;
    }

    // 3. TOPIC CLUSTERING (OpenAI)
    let topicsLookup = {};
    try {
        topicsLookup = await getTopicClusters(filtered, config);
    } catch (e) {
        console.error('Topic clustering failed:', e.message);
        console.log('Falling back to keyword-based semantic clustering...');
        topicsLookup = fallbackTopicClustering(filtered);
    }

    // Assign topics and group
    const topicGroups = {};
    const formatGroups = {};

    filtered.forEach((p, i) => {
        const id = `post_${i}`;
        const topic = topicsLookup[id] || 'General Football Coverage';
        p.topic = topic;

        if (!topicGroups[topic]) topicGroups[topic] = [];
        topicGroups[topic].push(p);

        const format = p.content_format || 'Post';
        if (!formatGroups[format]) formatGroups[format] = 0;
        formatGroups[format] += p.views; // Track shares/reach via views
    });

    // 4. RANKING
    const topicsArr = [];
    for (const [topic, posts] of Object.entries(topicGroups)) {
        const avgViews = Math.round(posts.reduce((sum, p) => sum + p.views, 0) / posts.length);
        const avgEr = (posts.reduce((sum, p) => sum + p.engagement_rate, 0) / posts.length).toFixed(2);
        topicsArr.push({
            topic,
            postCount: posts.length,
            avgViews,
            avgEr
        });
    }

    // Sort top 5 topics by average views
    topicsArr.sort((a,b) => b.avgViews - a.avgViews);
    const topTopics = topicsArr.slice(0, 5);

    // Sort top formats
    const topFormats = Object.entries(formatGroups)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3)
        .map(f => f[0]);

    // Track history for sustained trends
    const historyPath = join(SKILL_ROOT, 'output', 'history.json');
    const history = loadJSON(historyPath, { last_week_formats: [] });
    
    const sustainedFormats = topFormats.filter(f => history.last_week_formats.includes(f));
    
    // Save current top formats for next week
    mkdirSync(join(SKILL_ROOT, 'output'), { recursive: true });
    writeFileSync(historyPath, JSON.stringify({ last_week_formats: topFormats }, null, 2));

    // Recommend top item
    let recommendation = "";
    if (topTopics.length > 0) {
        const top = topTopics[0];
        recommendation = `Create a ${topFormats[0] || 'Reel'} focused on "${top.topic}" — it averaged ${top.avgViews.toLocaleString()} views across ${top.postCount} competitors this week and guarantees high reach for The Touchline Dribble.`;
    } else {
        recommendation = "Maintain current strategy; no breakout topics found with enough volume.";
    }

    // 5. OUTPUT RENDER
    let md = `# Touchline Dribble Content Strategy Report\n\n`;
    md += `**RECOMMENDATION**: ${recommendation}\n\n`;

    md += `## 🏆 Top 5 Trending Football Topics This Week\n\n`;
    md += `| Topic | Avg Views | Avg Engagement Rate | Flags |\n`;
    md += `|-------|-----------|---------------------|-------|\n`;
    
    for (const t of topTopics) {
        let flags = [];
        if (t.postCount >= 3) flags.push(`🔥 Repeat Viral Signal (${t.postCount} posts)`);
        if (parseFloat(t.avgEr) > config.scoring.flags.viral_er) flags.push(`💥 High Engagement`);
        md += `| **${t.topic}** | ${t.avgViews.toLocaleString()} | ${t.avgEr}% | ${flags.join('<br>')} |\n`;
    }

    md += `\n## 📱 Top Performing Formats (By Total Reach)\n`;
    topFormats.forEach((f, i) => {
        let flag = sustainedFormats.includes(f) ? "📈 Sustained trend (Top last week & this week)" : "";
        md += `${i+1}. **${f}** ${flag}\n`;
    });

    md += `\n## 📝 Data Source Overview\n`;
    md += `- **Analyzed Posts**: ${filtered.length} high-quality posts (Filtered strictly to >10k views, >2% ER)\n`;
    md += `- **Date Range**: Past 30 Days\n`;
    md += `- **Scoring Model**: Composite ranking weights applied (40% Views, 35% ER, 25% Comments)\n`;

    const outPath = join(SKILL_ROOT, 'output', 'validation_report.md');
    writeFileSync(outPath, md);

    console.log(`\n✅ Validation Report generated at: ${outPath}`);
}

main().catch(console.error);
