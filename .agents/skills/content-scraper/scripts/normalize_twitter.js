#!/usr/bin/env node
/**
 * Normalize Twitter/X post data from Apify raw output.
 * Filters to last N days, extracts standard fields, computes engagement rate.
 *
 * Usage:
 *   node --env-file=.env scripts/normalize_twitter.js \
 *     --input-dir output/raw \
 *     --output output/normalized/twitter.json \
 *     --days 7
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

function parseCliArgs() {
    const options = {
        'input-dir': { type: 'string' },
        output: { type: 'string', short: 'o' },
        days: { type: 'string', short: 'd', default: '7' },
    };
    const { values } = parseArgs({ options, allowPositionals: false });

    if (!values['input-dir'] || !values.output) {
        console.error('Usage: normalize_twitter.js --input-dir DIR --output FILE [--days 7]');
        process.exit(1);
    }

    return {
        inputDir: values['input-dir'],
        output: values.output,
        days: parseInt(values.days, 10),
    };
}

function extractHook(text) {
    if (!text) return '';
    const firstLine = text.split('\n')[0].trim();
    if (firstLine.length <= 150) return firstLine;
    return firstLine.slice(0, 150) + '...';
}

function isThread(raw) {
    // Detect if a tweet is part of a thread
    return (
        raw.isReply === false &&
        raw.conversationCount > 0 &&
        raw.text &&
        (raw.text.includes('🧵') || raw.text.includes('Thread') || raw.text.includes('thread') || raw.text.includes('1/'))
    );
}

function normalizePost(raw, source) {
    const text = raw.full_text || raw.text || raw.tweetText || '';
    const views = raw.viewCount || raw.views || raw.impressionCount || 0;
    const likes = raw.likeCount || raw.favoriteCount || raw.likes || 0;
    const comments = raw.replyCount || raw.replies || raw.commentCount || 0;
    const retweets = raw.retweetCount || raw.retweets || 0;
    // Twitter ER: (likes + replies + retweets) / impressions
    const totalEngagement = likes + comments + retweets;
    const engagementRate = views > 0 ? (totalEngagement / views) * 100 : 0;

    const createdAt = raw.createdAt || raw.created_at || raw.date || raw.tweetDate || '';
    let postDate = '';
    if (createdAt) {
        try {
            postDate = new Date(createdAt).toISOString().split('T')[0];
        } catch {
            postDate = createdAt;
        }
    }

    return {
        platform: 'Twitter',
        content_format: isThread(raw) ? 'Thread' : 'Tweet',
        account: raw.author?.userName || raw.user?.screen_name || raw.username || source || '',
        hook_text: extractHook(text),
        full_caption: text,
        transcript: text, // Twitter text IS the transcript
        video_url: '', // Twitter is text-first
        views,
        likes,
        comments,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        post_date: postDate,
        post_url: raw.url || raw.tweetUrl || '',
        raw_id: raw.id || raw.tweetId || raw.id_str || '',
    };
}

function main() {
    const args = parseCliArgs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - args.days);

    const allPosts = [];

    const files = readdirSync(args.inputDir).filter(
        (f) => f.startsWith('twitter_') && f.endsWith('.json')
    );

    if (files.length === 0) {
        console.log('No Twitter data files found in', args.inputDir);
        writeFileSync(args.output, '[]');
        process.exit(0);
    }

    for (const file of files) {
        const source = file.replace('twitter_', '').replace('.json', '');
        const filePath = join(args.inputDir, file);

        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
                const normalized = normalizePost(item, source);

                if (normalized.post_date) {
                    const postDate = new Date(normalized.post_date);
                    if (postDate >= cutoffDate) {
                        allPosts.push(normalized);
                    }
                }
            }
        } catch (err) {
            console.error(`Warning: Could not parse ${file}: ${err.message}`);
        }
    }

    // Deduplicate by raw_id
    const seen = new Set();
    const unique = allPosts.filter((p) => {
        if (p.raw_id && seen.has(p.raw_id)) return false;
        if (p.raw_id) seen.add(p.raw_id);
        return true;
    });

    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, JSON.stringify(unique, null, 2));

    console.log(`Normalized ${unique.length} Twitter/X posts (from ${allPosts.length} total, ${files.length} files)`);
    console.log(`Filtered to last ${args.days} days (since ${cutoffDate.toISOString().split('T')[0]})`);
    console.log(`Saved to: ${args.output}`);
}

main();
