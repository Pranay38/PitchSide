#!/usr/bin/env node
/**
 * Normalize YouTube Shorts data from Apify raw output.
 * Filters to last N days, extracts standard fields, computes engagement rate.
 *
 * Usage:
 *   node --env-file=.env scripts/normalize_youtube.js \
 *     --input-dir output/raw \
 *     --output output/normalized/youtube.json \
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
        console.error('Usage: normalize_youtube.js --input-dir DIR --output FILE [--days 7]');
        process.exit(1);
    }

    return {
        inputDir: values['input-dir'],
        output: values.output,
        days: parseInt(values.days, 10),
    };
}

function extractHook(title, description) {
    // YouTube Shorts hook is typically the title
    if (title && title.length <= 150) return title;
    if (title) return title.slice(0, 150) + '...';
    if (description) return description.split('\n')[0].slice(0, 150);
    return '';
}

function normalizePost(raw, source) {
    const title = raw.title || '';
    const description = raw.description || raw.text || '';
    const views = raw.viewCount || raw.views || raw.videoViewCount || 0;
    const likes = raw.likes || raw.likeCount || raw.likesCount || 0;
    const comments = raw.commentsCount || raw.commentCount || raw.comments || raw.numberOfComments || 0;
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

    return {
        platform: 'YouTube',
        content_format: 'Short',
        account: raw.channelName || raw.channelTitle || raw.author || source || '',
        hook_text: extractHook(title, description),
        full_caption: description || title,
        transcript: '', // Will be filled by transcribe_videos.js
        video_url: raw.url || raw.videoUrl || (raw.id ? `https://www.youtube.com/shorts/${raw.id}` : ''),
        views,
        likes,
        comments,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        post_date: raw.date
            ? new Date(raw.date).toISOString().split('T')[0]
            : raw.uploadDate
              ? new Date(raw.uploadDate).toISOString().split('T')[0]
              : raw.publishedAt
                ? new Date(raw.publishedAt).toISOString().split('T')[0]
                : '',
        post_url: raw.url || raw.videoUrl || (raw.id ? `https://www.youtube.com/shorts/${raw.id}` : ''),
        raw_id: raw.id || raw.videoId || '',
    };
}

function main() {
    const args = parseCliArgs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - args.days);

    const allPosts = [];

    const files = readdirSync(args.inputDir).filter(
        (f) => f.startsWith('youtube_') && f.endsWith('.json')
    );

    if (files.length === 0) {
        console.log('No YouTube data files found in', args.inputDir);
        writeFileSync(args.output, '[]');
        process.exit(0);
    }

    for (const file of files) {
        const source = file.replace('youtube_', '').replace('.json', '');
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

    console.log(`Normalized ${unique.length} YouTube Shorts (from ${allPosts.length} total, ${files.length} files)`);
    console.log(`Filtered to last ${args.days} days (since ${cutoffDate.toISOString().split('T')[0]})`);
    console.log(`Saved to: ${args.output}`);
}

main();
