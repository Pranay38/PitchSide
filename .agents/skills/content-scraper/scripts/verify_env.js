#!/usr/bin/env node
/**
 * Verify environment prerequisites for the content-scraper skill.
 * Checks for required API tokens, ffmpeg, and Node.js version.
 */

import { execSync } from 'node:child_process';

const checks = [];

// Check APIFY_TOKEN
if (process.env.APIFY_TOKEN) {
    checks.push({ name: 'APIFY_TOKEN', status: '✅', detail: 'Found in environment' });
} else {
    checks.push({
        name: 'APIFY_TOKEN',
        status: '❌',
        detail: 'Missing! Add APIFY_TOKEN=your_token to .env\n     Get one at: https://console.apify.com/account/integrations',
    });
}

// Check OPENAI_API_KEY
if (process.env.OPENAI_API_KEY) {
    checks.push({ name: 'OPENAI_API_KEY', status: '✅', detail: 'Found in environment' });
} else {
    checks.push({
        name: 'OPENAI_API_KEY',
        status: '⚠️',
        detail: 'Missing! Whisper transcription will be skipped.\n     Add OPENAI_API_KEY=your_key to .env\n     Get one at: https://platform.openai.com/api-keys',
    });
}

// Check ffmpeg
try {
    const ffmpegVersion = execSync('ffmpeg -version 2>&1', { encoding: 'utf-8' }).split('\n')[0];
    checks.push({ name: 'ffmpeg', status: '✅', detail: ffmpegVersion.trim() });
} catch {
    checks.push({
        name: 'ffmpeg',
        status: '⚠️',
        detail: 'Not found! Video transcription requires ffmpeg.\n     Install with: brew install ffmpeg',
    });
}

// Check Node.js version
const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (major >= 20) {
    checks.push({ name: 'Node.js', status: '✅', detail: `${nodeVersion} (>= 20 required)` });
} else {
    checks.push({
        name: 'Node.js',
        status: '❌',
        detail: `${nodeVersion} — Node.js 20.6+ is required for --env-file support`,
    });
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('CONTENT SCRAPER — Environment Check');
console.log('='.repeat(60));

let hasErrors = false;
for (const check of checks) {
    console.log(`\n  ${check.status}  ${check.name}`);
    console.log(`     ${check.detail}`);
    if (check.status === '❌') hasErrors = true;
}

console.log('\n' + '='.repeat(60));

if (hasErrors) {
    console.log('❌ Some required checks failed. Fix them before proceeding.');
    process.exit(1);
} else {
    console.log('✅ All checks passed. Ready to scrape!');
    process.exit(0);
}
