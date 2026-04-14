#!/usr/bin/env node
/**
 * Normalize Instagram Reel/Post data from Apify raw output.
 * Filters to last N days, extracts standard fields, computes engagement rate.
 *
 * Usage:
 *   node --env-file=.env scripts/normalize_instagram.js \
 *     --input-dir output/raw \
 *     --output output/normalized/instagram.json \
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
        console.error('Usage: normalize_instagram.js --input-dir DIR --output FILE [--days 7]');
        process.exit(1);
    }

    return {
        inputDir: values['input-dir'],
        output: values.output,
        days: parseInt(values.days, 10),
    };
}

function extractHook(caption) {
    if (!caption) return '';
    // First line or first sentence as the hook
    const firstLine = caption.split('\n')[0].trim();
    if (firstLine.length <= 150) return firstLine;
    return firstLine.slice(0, 150) + '...';
}

function parseDate(raw) {
    // Handle ISO strings like "2026-04-12T09:00:51.000Z"
    const ts = raw.timestamp || raw.takenAtTimestamp || raw.date || raw.uploadDate;
    if (!ts) return '';
    // If it's a string (ISO format), parse directly
    if (typeof ts === 'string') {
        try {
            return new Date(ts).toISOString().split('T')[0];
        } catch { return ''; }
    }
    // If it's a number (Unix timestamp in seconds), convert
    if (typeof ts === 'number') {
        try {
            return new Date(ts * 1000).toISOString().split('T')[0];
        } catch { return ''; }
    }
    return '';
}

function normalizePost(raw, source) {
    // Skip error items
    if (raw.error || !raw.id) return null;

    const caption = raw.caption || raw.text || raw.description || '';
    const views = raw.videoViewCount || raw.viewCount || raw.videoPlayCount || raw.playCount || 0;
    const likes = raw.likesCount || raw.likeCount || raw.likes || 0;
    const comments = raw.commentsCount || raw.commentCount || raw.comments || 0;
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

    return {
        platform: 'Instagram',
        content_format: raw.type === 'Video' || raw.videoUrl ? 'Reel' : 'Post',
        account: raw.ownerUsername || raw.username || raw.owner?.username || source || '',
        hook_text: extractHook(caption),
        full_caption: caption,
        transcript: '', // Will be filled by transcribe_videos.js
        video_url: raw.videoUrl || raw.video_url || '',
        views,
        likes,
        comments,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        post_date: parseDate(raw),
        post_url: raw.url || (raw.shortCode
            ? `https://www.instagram.com/reel/${raw.shortCode}/`
            : ''),
        raw_id: raw.id || raw.shortCode || '',
    };
}

function main() {
    const args = parseCliArgs();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - args.days);

    const allPosts = [];

    // Read all instagram_*.json files from input directory
    const files = readdirSync(args.inputDir).filter(
        (f) => f.startsWith('instagram_') && f.endsWith('.json')
    );

    if (files.length === 0) {
        console.log('No Instagram data files found in', args.inputDir);
        writeFileSync(args.output, '[]');
        process.exit(0);
    }

    for (const file of files) {
        const source = file.replace('instagram_', '').replace('.json', '');
        const filePath = join(args.inputDir, file);

        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
                const normalized = normalizePost(item, source);
                if (!normalized) continue; // skip error items

                // Filter by date
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

    // Ensure output directory exists
    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, JSON.stringify(unique, null, 2));

    console.log(`Normalized ${unique.length} Instagram posts (from ${allPosts.length} total, ${files.length} files)`);
    console.log(`Filtered to last ${args.days} days (since ${cutoffDate.toISOString().split('T')[0]})`);
    console.log(`Saved to: ${args.output}`);
}

main();
