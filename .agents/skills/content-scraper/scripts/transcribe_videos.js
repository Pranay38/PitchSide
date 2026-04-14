#!/usr/bin/env node
/**
 * Transcribe video content from Instagram Reels and YouTube Shorts using OpenAI Whisper.
 * Downloads video, extracts audio with ffmpeg, sends to Whisper API.
 *
 * Usage:
 *   node --env-file=.env scripts/transcribe_videos.js \
 *     --input output/normalized/instagram.json \
 *     --input output/normalized/youtube.json \
 *     --output output/transcripts.json \
 *     --max-concurrent 3
 */

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

function parseCliArgs() {
    const options = {
        input: { type: 'string', multiple: true, short: 'i' },
        output: { type: 'string', short: 'o' },
        'max-concurrent': { type: 'string', default: '3' },
    };
    const { values } = parseArgs({ options, allowPositionals: false });

    if (!values.input || values.input.length === 0 || !values.output) {
        console.error('Usage: transcribe_videos.js --input FILE [--input FILE2] --output FILE [--max-concurrent 3]');
        process.exit(1);
    }

    return {
        inputs: values.input,
        output: values.output,
        maxConcurrent: parseInt(values['max-concurrent'], 10),
    };
}

async function downloadVideo(url, outputPath) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        redirect: 'follow',
    });

    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const fileStream = createWriteStream(outputPath);
    await pipeline(Readable.fromWeb(response.body), fileStream);
}

function extractAudio(videoPath, audioPath) {
    try {
        execSync(
            `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -q:a 4 "${audioPath}" -y 2>/dev/null`,
            { timeout: 30000 }
        );
        return true;
    } catch (err) {
        console.error(`  ffmpeg error: ${err.message}`);
        return false;
    }
}

async function transcribeWithWhisper(audioPath, apiKey) {
    const audioData = readFileSync(audioPath);
    const formData = new FormData();
    formData.append('file', new Blob([audioData], { type: 'audio/mp3' }), 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Whisper API error (${response.status}): ${errText}`);
    }

    return (await response.text()).trim();
}

function cleanupFiles(...paths) {
    for (const p of paths) {
        try {
            unlinkSync(p);
        } catch {
            // File may not exist, ignore
        }
    }
}

async function processVideo(post, apiKey, index, total) {
    const videoUrl = post.video_url;
    if (!videoUrl) {
        return { ...post, transcript: post.transcript || '' };
    }

    const id = randomUUID().slice(0, 8);
    const tmpDir = tmpdir();
    const videoPath = join(tmpDir, `cs_video_${id}.mp4`);
    const audioPath = join(tmpDir, `cs_audio_${id}.mp3`);

    console.log(`  [${index + 1}/${total}] Transcribing: ${post.account} — ${post.hook_text.slice(0, 50)}...`);

    try {
        // Step 1: Download video
        await downloadVideo(videoUrl, videoPath);

        // Step 2: Extract audio
        const audioOk = extractAudio(videoPath, audioPath);
        if (!audioOk) {
            console.log(`    ⚠️ Audio extraction failed, skipping`);
            cleanupFiles(videoPath, audioPath);
            return { ...post, transcript: '[audio extraction failed]' };
        }

        // Step 3: Transcribe
        const transcript = await transcribeWithWhisper(audioPath, apiKey);
        console.log(`    ✅ Transcribed (${transcript.length} chars)`);

        cleanupFiles(videoPath, audioPath);
        return { ...post, transcript };
    } catch (err) {
        console.error(`    ❌ Error: ${err.message}`);
        cleanupFiles(videoPath, audioPath);
        return { ...post, transcript: `[transcription error: ${err.message}]` };
    }
}

async function processInBatches(posts, apiKey, batchSize) {
    const results = [];
    for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map((post, j) => processVideo(post, apiKey, i + j, posts.length))
        );
        results.push(...batchResults);

        // Small delay between batches to avoid rate limits
        if (i + batchSize < posts.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    return results;
}

async function main() {
    const args = parseCliArgs();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('⚠️  OPENAI_API_KEY not found. Skipping transcription.');
        console.error('   Add OPENAI_API_KEY=your_key to .env for Whisper support.');

        // Just merge inputs without transcription
        const allPosts = [];
        for (const inputFile of args.inputs) {
            try {
                const data = JSON.parse(readFileSync(inputFile, 'utf-8'));
                allPosts.push(...data);
            } catch (err) {
                console.error(`Warning: Could not read ${inputFile}: ${err.message}`);
            }
        }

        mkdirSync(dirname(args.output), { recursive: true });
        writeFileSync(args.output, JSON.stringify(allPosts, null, 2));
        console.log(`Saved ${allPosts.length} posts without transcripts to ${args.output}`);
        return;
    }

    // Load all posts from input files
    const allPosts = [];
    for (const inputFile of args.inputs) {
        try {
            const data = JSON.parse(readFileSync(inputFile, 'utf-8'));
            allPosts.push(...data);
        } catch (err) {
            console.error(`Warning: Could not read ${inputFile}: ${err.message}`);
        }
    }

    // Filter to only posts with video URLs that need transcription
    const needsTranscription = allPosts.filter((p) => p.video_url && !p.transcript);
    const alreadyDone = allPosts.filter((p) => !p.video_url || p.transcript);

    console.log('\n' + '='.repeat(60));
    console.log('WHISPER TRANSCRIPTION PIPELINE');
    console.log('='.repeat(60));
    console.log(`Total posts: ${allPosts.length}`);
    console.log(`Need transcription: ${needsTranscription.length}`);
    console.log(`Already transcribed/text-only: ${alreadyDone.length}`);
    console.log(`Max concurrent: ${args.maxConcurrent}`);

    const estimatedCost = (needsTranscription.length * 0.5 * 0.006).toFixed(2);
    console.log(`Estimated Whisper cost: ~$${estimatedCost} (assuming ~30s avg per video)`);
    console.log('='.repeat(60) + '\n');

    // Process videos
    const transcribed = await processInBatches(needsTranscription, apiKey, args.maxConcurrent);

    // Merge with already-done posts
    const results = [...transcribed, ...alreadyDone];

    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, JSON.stringify(results, null, 2));

    const successCount = transcribed.filter((p) => p.transcript && !p.transcript.startsWith('[')).length;
    console.log(`\n✅ Transcription complete: ${successCount}/${needsTranscription.length} successful`);
    console.log(`Saved to: ${args.output}`);
}

main().catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});
