#!/usr/bin/env node
/**
 * Run the full content-scraper pipeline: scrape all platforms, transcribe, generate leaderboard.
 * This script orchestrates the entire workflow in a single command.
 *
 * Usage:
 *   node --env-file=.env scripts/run_full_pipeline.js [--skip-transcription] [--days 7]
 */

import { parseArgs } from 'node:util';
import { execSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = join(__dirname, '..');
const APIFY_RUNNER = join(SKILL_ROOT, '..', 'apify-ultimate-scraper', 'reference', 'scripts', 'run_actor.js');

function parseCliArgs() {
    const options = {
        'skip-transcription': { type: 'boolean', default: false },
        days: { type: 'string', default: '7' },
        help: { type: 'boolean', short: 'h' },
    };
    const { values } = parseArgs({ options, allowPositionals: false });

    if (values.help) {
        console.log(`
Football Content Scraper — Full Pipeline

Usage:
  node --env-file=.env scripts/run_full_pipeline.js [options]

Options:
  --skip-transcription  Skip Whisper transcription step
  --days N              Number of days to look back (default: 7)
  --help, -h            Show this help
`);
        process.exit(0);
    }

    return {
        skipTranscription: values['skip-transcription'] || false,
        days: values.days,
    };
}

function run(cmd, label) {
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`⚡ ${label}`);
    console.log('━'.repeat(60));
    try {
        execSync(cmd, { stdio: 'inherit', timeout: 600_000 });
        return true;
    } catch (err) {
        console.error(`⚠️ ${label} failed: ${err.message}`);
        return false;
    }
}

function loadConfig() {
    const configPath = join(SKILL_ROOT, 'config.json');
    return JSON.parse(readFileSync(configPath, 'utf-8'));
}

async function main() {
    const args = parseCliArgs();
    const config = loadConfig();

    console.log('='.repeat(60));
    console.log('⚽ FOOTBALL CONTENT SCRAPER — FULL PIPELINE');
    console.log('='.repeat(60));
    console.log(`Lookback: ${args.days} days`);
    console.log(`Competitors: ${Object.keys(config.competitors).length}`);
    console.log(`Keywords: ${config.keywords.length}`);
    console.log(`Transcription: ${args.skipTranscription ? 'SKIPPED' : 'ENABLED'}`);

    // Ensure output directories
    mkdirSync(join(SKILL_ROOT, 'output', 'raw'), { recursive: true });
    mkdirSync(join(SKILL_ROOT, 'output', 'normalized'), { recursive: true });

    // ─── STEP 1: INSTAGRAM REELS ───
    const igHandles = Object.entries(config.competitors)
        .filter(([_, v]) => v.instagram)
        .map(([_, v]) => v.instagram);

    if (igHandles.length > 0) {
        // Scrape by handles (batch)
        const igInput = JSON.stringify({
            username: igHandles,
            resultsLimit: config.scraping_limits.instagram_per_handle,
        });
        run(
            `node --env-file=.env "${APIFY_RUNNER}" --actor "apify/instagram-reel-scraper" --input '${igInput}' --output "${join(SKILL_ROOT, 'output', 'raw', 'instagram_handles.json')}" --format json`,
            `Instagram Reels: ${igHandles.length} accounts`
        );

        // Scrape by hashtags
        const hashtagInput = JSON.stringify({
            hashtags: config.hashtags.instagram.slice(0, 8),
            resultsLimit: config.scraping_limits.instagram_hashtags,
        });
        run(
            `node --env-file=.env "${APIFY_RUNNER}" --actor "apify/instagram-hashtag-scraper" --input '${hashtagInput}' --output "${join(SKILL_ROOT, 'output', 'raw', 'instagram_hashtags.json')}" --format json`,
            `Instagram Hashtags: ${config.hashtags.instagram.length} tags`
        );

        // Normalize
        run(
            `node --env-file=.env "${join(SKILL_ROOT, 'scripts', 'normalize_instagram.js')}" --input-dir "${join(SKILL_ROOT, 'output', 'raw')}" --output "${join(SKILL_ROOT, 'output', 'normalized', 'instagram.json')}" --days ${args.days}`,
            'Normalizing Instagram data'
        );
    }

    // ─── STEP 2: YOUTUBE SHORTS ───
    const ytHandles = Object.entries(config.competitors)
        .filter(([_, v]) => v.youtube)
        .map(([_, v]) => `https://youtube.com/@${v.youtube}`);

    if (ytHandles.length > 0) {
        const ytInput = JSON.stringify({
            channels: ytHandles,
            maxResultsShorts: config.scraping_limits.youtube_per_channel,
        });
        run(
            `node --env-file=.env "${APIFY_RUNNER}" --actor "streamers/youtube-shorts-scraper" --input '${ytInput}' --output "${join(SKILL_ROOT, 'output', 'raw', 'youtube_channels.json')}" --format json`,
            `YouTube Shorts: ${ytHandles.length} channels`
        );

        // Keyword search
        const ytKeywords = config.keywords.slice(0, 5);
        const ytKeywordInput = JSON.stringify({
            channels: ytKeywords.map((k) => `https://www.youtube.com/results?search_query=${encodeURIComponent(k)}+shorts`),
            maxResultsShorts: config.scraping_limits.youtube_keywords,
        });
        run(
            `node --env-file=.env "${APIFY_RUNNER}" --actor "streamers/youtube-shorts-scraper" --input '${ytKeywordInput}' --output "${join(SKILL_ROOT, 'output', 'raw', 'youtube_keywords.json')}" --format json`,
            `YouTube keyword search: ${ytKeywords.length} keywords`
        );

        // Normalize
        run(
            `node --env-file=.env "${join(SKILL_ROOT, 'scripts', 'normalize_youtube.js')}" --input-dir "${join(SKILL_ROOT, 'output', 'raw')}" --output "${join(SKILL_ROOT, 'output', 'normalized', 'youtube.json')}" --days ${args.days}`,
            'Normalizing YouTube data'
        );
    }

    // ─── STEP 3: TWITTER/X ───
    const twHandles = Object.entries(config.competitors)
        .filter(([_, v]) => v.twitter)
        .map(([_, v]) => v.twitter);

    if (twHandles.length > 0) {
        // Compute start date for 7-day lookback
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(args.days, 10));
        const startDateStr = startDate.toISOString().split('T')[0];

        const twInput = JSON.stringify({
            twitterHandles: twHandles,
            maxItems: config.scraping_limits.twitter_per_handle,
            sort: 'Latest',
            start: startDateStr,
        });
        run(
            `node --env-file=.env "${APIFY_RUNNER}" --actor "apidojo/tweet-scraper" --input '${twInput}' --output "${join(SKILL_ROOT, 'output', 'raw', 'twitter_handles.json')}" --format json`,
            `Twitter/X: ${twHandles.length} accounts`
        );

        // Keyword search
        const twKeywords = config.keywords
            .filter((k) => ['Premier League', 'Champions League UCL', 'football tactics', 'transfer news thread', 'tactical analysis'].includes(k))
            .slice(0, 5);
        const effectiveKeywords = twKeywords.length > 0
            ? twKeywords
            : ['Premier League', 'Champions League', 'football tactics', 'transfer news', 'tactical analysis'];

        const twKeywordInput = JSON.stringify({
            searchTerms: effectiveKeywords,
            maxItems: config.scraping_limits.twitter_keywords,
            sort: 'Top',
        });
        run(
            `node --env-file=.env "${APIFY_RUNNER}" --actor "apidojo/tweet-scraper" --input '${twKeywordInput}' --output "${join(SKILL_ROOT, 'output', 'raw', 'twitter_keywords.json')}" --format json`,
            `Twitter keyword search: ${effectiveKeywords.length} terms`
        );

        // Normalize
        run(
            `node --env-file=.env "${join(SKILL_ROOT, 'scripts', 'normalize_twitter.js')}" --input-dir "${join(SKILL_ROOT, 'output', 'raw')}" --output "${join(SKILL_ROOT, 'output', 'normalized', 'twitter.json')}" --days ${args.days}`,
            'Normalizing Twitter data'
        );
    }

    // ─── STEP 4: TRANSCRIPTION ───
    if (!args.skipTranscription) {
        const inputFiles = [];
        const igFile = join(SKILL_ROOT, 'output', 'normalized', 'instagram.json');
        const ytFile = join(SKILL_ROOT, 'output', 'normalized', 'youtube.json');
        if (existsSync(igFile)) inputFiles.push(`--input "${igFile}"`);
        if (existsSync(ytFile)) inputFiles.push(`--input "${ytFile}"`);

        if (inputFiles.length > 0) {
            run(
                `node --env-file=.env "${join(SKILL_ROOT, 'scripts', 'transcribe_videos.js')}" ${inputFiles.join(' ')} --output "${join(SKILL_ROOT, 'output', 'transcripts.json')}" --max-concurrent ${config.whisper.max_concurrent}`,
                'Whisper video transcription'
            );
        }
    }

    // ─── STEP 5: GENERATE LEADERBOARD ───
    const leaderboardArgs = [
        `--output "${join(SKILL_ROOT, 'output', 'leaderboard.csv')}"`,
        `--viral-er ${config.viral_thresholds.engagement_rate_percent}`,
        `--viral-views ${config.viral_thresholds.views_count}`,
    ];

    const igNorm = join(SKILL_ROOT, 'output', 'normalized', 'instagram.json');
    const ytNorm = join(SKILL_ROOT, 'output', 'normalized', 'youtube.json');
    const twNorm = join(SKILL_ROOT, 'output', 'normalized', 'twitter.json');
    const transcriptsFile = join(SKILL_ROOT, 'output', 'transcripts.json');

    if (existsSync(igNorm)) leaderboardArgs.push(`--instagram "${igNorm}"`);
    if (existsSync(ytNorm)) leaderboardArgs.push(`--youtube "${ytNorm}"`);
    if (existsSync(twNorm)) leaderboardArgs.push(`--twitter "${twNorm}"`);
    if (existsSync(transcriptsFile)) leaderboardArgs.push(`--transcripts "${transcriptsFile}"`);

    run(
        `node --env-file=.env "${join(SKILL_ROOT, 'scripts', 'generate_leaderboard.js')}" ${leaderboardArgs.join(' ')}`,
        'Generating leaderboard'
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ PIPELINE COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nOutput files:`);
    console.log(`  📄 ${join(SKILL_ROOT, 'output', 'leaderboard.csv')}`);
    console.log(`  📄 ${join(SKILL_ROOT, 'output', 'leaderboard.json')}`);
    console.log(`\nRun again with --skip-transcription to save on Whisper costs.`);
}

main().catch((err) => {
    console.error(`Pipeline error: ${err.message}`);
    process.exit(1);
});
