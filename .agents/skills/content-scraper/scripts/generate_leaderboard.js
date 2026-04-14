#!/usr/bin/env node
/**
 * Generate the final content leaderboard from normalized data.
 * Merges all platforms, computes engagement rates, applies viral flags,
 * sorts by views (highest first), and exports as CSV + JSON.
 *
 * Usage:
 *   node --env-file=.env scripts/generate_leaderboard.js \
 *     --instagram output/normalized/instagram.json \
 *     --youtube output/normalized/youtube.json \
 *     --twitter output/normalized/twitter.json \
 *     --transcripts output/transcripts.json \
 *     --output output/leaderboard.csv \
 *     --viral-er 5 \
 *     --viral-views 100000
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function parseCliArgs() {
    const options = {
        instagram: { type: 'string' },
        youtube: { type: 'string' },
        twitter: { type: 'string' },
        transcripts: { type: 'string' },
        output: { type: 'string', short: 'o' },
        'viral-er': { type: 'string', default: '5' },
        'viral-views': { type: 'string', default: '100000' },
    };
    const { values } = parseArgs({ options, allowPositionals: false });

    if (!values.output) {
        console.error('Usage: generate_leaderboard.js --output FILE [options]');
        process.exit(1);
    }

    return {
        instagram: values.instagram,
        youtube: values.youtube,
        twitter: values.twitter,
        transcripts: values.transcripts,
        output: values.output,
        viralER: parseFloat(values['viral-er']),
        viralViews: parseInt(values['viral-views'], 10),
    };
}

function loadJSON(filePath) {
    if (!filePath) return [];
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (err) {
        console.error(`Warning: Could not load ${filePath}: ${err.message}`);
        return [];
    }
}

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Truncate very long fields for CSV readability
    const truncated = str.length > 500 ? str.slice(0, 500) + '...' : str;
    if (truncated.includes(',') || truncated.includes('"') || truncated.includes('\n') || truncated.includes('\r')) {
        return `"${truncated.replace(/"/g, '""')}"`;
    }
    return truncated;
}

function formatNumber(num) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return String(num);
}

function main() {
    const args = parseCliArgs();

    // Load all data sources
    let instagram = loadJSON(args.instagram);
    let youtube = loadJSON(args.youtube);
    let twitter = loadJSON(args.twitter);
    const transcripts = loadJSON(args.transcripts);

    // Merge transcripts into platform data
    if (transcripts.length > 0) {
        const transcriptMap = new Map();
        for (const t of transcripts) {
            if (t.raw_id) transcriptMap.set(t.raw_id, t.transcript);
        }

        const applyTranscripts = (posts) =>
            posts.map((p) => ({
                ...p,
                transcript: transcriptMap.get(p.raw_id) || p.transcript || '',
            }));

        instagram = applyTranscripts(instagram);
        youtube = applyTranscripts(youtube);
        twitter = applyTranscripts(twitter);
    }

    // Merge all platforms
    const allPosts = [...instagram, ...youtube, ...twitter];

    if (allPosts.length === 0) {
        console.log('No posts found across any platform.');
        writeFileSync(args.output, '');
        return;
    }

    // Sort by views (descending)
    allPosts.sort((a, b) => (b.views || 0) - (a.views || 0));

    // Apply viral tags and ranking
    const leaderboard = allPosts.map((post, index) => {
        const isViral = post.engagement_rate > args.viralER || post.views > args.viralViews;
        return {
            rank: index + 1,
            viral_tag: isViral ? '🔥 VIRAL' : '',
            platform: post.platform,
            content_format: post.content_format,
            account: post.account ? `@${post.account.replace('@', '')}` : '',
            hook_text: post.hook_text,
            full_caption: post.full_caption,
            transcript: post.transcript,
            views: post.views,
            likes: post.likes,
            comments: post.comments,
            engagement_rate: post.engagement_rate,
            post_date: post.post_date,
            post_url: post.post_url,
        };
    });

    // Generate CSV
    const csvColumns = [
        'rank', 'viral_tag', 'platform', 'content_format', 'account',
        'hook_text', 'full_caption', 'transcript', 'views', 'likes',
        'comments', 'engagement_rate', 'post_date', 'post_url',
    ];

    const csvHeader = csvColumns.join(',');
    const csvRows = leaderboard.map((row) =>
        csvColumns.map((col) => csvEscape(row[col])).join(',')
    );

    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, [csvHeader, ...csvRows].join('\n'));

    // Also save as JSON
    const jsonOutput = args.output.replace(/\.csv$/, '.json');
    writeFileSync(jsonOutput, JSON.stringify(leaderboard, null, 2));

    // Print summary
    const viralCount = leaderboard.filter((p) => p.viral_tag).length;
    const platformBreakdown = {};
    for (const p of leaderboard) {
        platformBreakdown[p.platform] = (platformBreakdown[p.platform] || 0) + 1;
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 FOOTBALL CONTENT LEADERBOARD — GENERATED');
    console.log('='.repeat(70));
    console.log(`\n  Total posts:     ${leaderboard.length}`);
    console.log(`  🔥 Viral posts:  ${viralCount}`);
    console.log(`  Platform breakdown:`);
    for (const [platform, count] of Object.entries(platformBreakdown)) {
        console.log(`    • ${platform}: ${count}`);
    }

    console.log(`\n  Viral thresholds: ER > ${args.viralER}% OR Views > ${formatNumber(args.viralViews)}`);
    console.log(`  Sorted by: Views (highest first)`);
    console.log(`\n  CSV saved to:  ${args.output}`);
    console.log(`  JSON saved to: ${jsonOutput}`);

    // Print top 10
    console.log('\n' + '─'.repeat(70));
    console.log('TOP 10 POSTS');
    console.log('─'.repeat(70));

    const top10 = leaderboard.slice(0, 10);
    for (const post of top10) {
        const tag = post.viral_tag ? ` ${post.viral_tag}` : '';
        console.log(`\n  #${post.rank}${tag}`);
        console.log(`  ${post.platform} ${post.content_format} by ${post.account}`);
        console.log(`  Hook: "${post.hook_text.slice(0, 80)}${post.hook_text.length > 80 ? '...' : ''}"`);
        console.log(`  👀 ${formatNumber(post.views)} views | ❤️ ${formatNumber(post.likes)} likes | 💬 ${formatNumber(post.comments)} comments | ER: ${post.engagement_rate}%`);
        console.log(`  📅 ${post.post_date} | 🔗 ${post.post_url}`);
    }

    // Print viral posts separately if there are any beyond top 10
    const viralBeyondTop10 = leaderboard.filter((p, i) => p.viral_tag && i >= 10);
    if (viralBeyondTop10.length > 0) {
        console.log('\n' + '─'.repeat(70));
        console.log(`🔥 ADDITIONAL VIRAL POSTS (beyond top 10)`);
        console.log('─'.repeat(70));
        for (const post of viralBeyondTop10) {
            console.log(`\n  #${post.rank} 🔥 VIRAL`);
            console.log(`  ${post.platform} ${post.content_format} by ${post.account}`);
            console.log(`  Hook: "${post.hook_text.slice(0, 80)}"`);
            console.log(`  👀 ${formatNumber(post.views)} | ER: ${post.engagement_rate}%`);
        }
    }

    console.log('\n' + '='.repeat(70));
}

main();
