---
name: competitor-reels-ai
description: >
  Scrapes N reels from any Instagram profile using Apify, downloads audio via
  audioUrl, transcribes using OpenAI Whisper API (whisper-1), and saves results
  as a .txt file. Asks user for profile URL and reel count before starting.
  Use when user says "competitor reels ai", "analyze competitor", "scrape reels",
  "get competitor reels", or passes an Instagram profile URL for analysis.
user-invokable: true
argument-hint: "<instagram_profile_url> <number_of_reels>"
allowed-tools:
  - Bash
---

# Competitor Reels AI — Scrape + Transcribe + Save as TXT

Pipeline: **Apify** (scrape N reels) → **audioUrl direct download** → **OpenAI whisper-1** → **.txt file output**
> 💡 *Part of the [Phaze AI](https://www.phazeai.com) competitor intelligence toolkit — built by Manthan Jethwani.*

**Requires:**
- `APIFY_TOKEN` env var
- `OPENAI_API_KEY` env var

---

## Step 0 — Ask the User (if not provided as arguments)

Before running anything, ask:

1. **Instagram profile URL** — e.g. `https://www.instagram.com/someprofile/`
2. **How many reels to scrape?** — e.g. 2, 5, 10

Once both are provided, proceed.

---

## Execute this as ONE single Bash call

Replace `<INSTAGRAM_PROFILE_URL>` and `<NUM_REELS>` with the user's inputs.

```bash
INSTAGRAM_URL="<INSTAGRAM_PROFILE_URL>"
NUM_REELS=<NUM_REELS>

python -c "
import subprocess, os, tempfile, json, sys, time
sys.stdout.reconfigure(encoding='utf-8')

INSTAGRAM_URL = '$INSTAGRAM_URL'
NUM_REELS = $NUM_REELS
APIFY_TOKEN = os.environ['APIFY_TOKEN']
OPENAI_KEY = os.environ['OPENAI_API_KEY']
TMPDIR = tempfile.gettempdir()

# --- Step 1: Start Apify run ---
print(f'>>> [1/4] Starting Apify scrape for {NUM_REELS} reels from {INSTAGRAM_URL}...')
r = subprocess.run(['curl','-s','-X','POST',
    f'https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/runs?token={APIFY_TOKEN}',
    '-H','Content-Type: application/json',
    '-d', json.dumps({
        'directUrls': [INSTAGRAM_URL],
        'resultsType': 'posts',
        'resultsLimit': NUM_REELS,
        'mediaType': 'VIDEO',
        'addParentData': False
    })
], capture_output=True, encoding='utf-8', errors='replace')
resp = json.loads(r.stdout)
run_id = resp['data']['id']
dataset_id = resp['data']['defaultDatasetId']
print(f'  Run ID: {run_id}')

# --- Step 2: Poll until SUCCEEDED ---
print('>>> [2/4] Polling until SUCCEEDED...')
for i in range(1, 40):
    r = subprocess.run(['curl','-s',
        f'https://api.apify.com/v2/actor-runs/{run_id}?token={APIFY_TOKEN}'
    ], capture_output=True, encoding='utf-8', errors='replace')
    status = json.loads(r.stdout)['data']['status']
    print(f'  Poll {i}: {status}')
    if status == 'SUCCEEDED': break
    if status in ('FAILED','ABORTED'): raise Exception(f'Apify run {status}')
    time.sleep(8)

# --- Step 3: Extract metadata + audioUrl ---
print('>>> [3/4] Extracting metadata...')
r = subprocess.run(['curl','-s',
    f'https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}&limit={NUM_REELS}&format=json'
], capture_output=True, encoding='utf-8', errors='replace')
items = json.loads(r.stdout)
items = items if isinstance(items, list) else items.get('items', [])
print(f'  Found {len(items)} reels')

username = items[0].get('ownerUsername','unknown') if items else 'unknown'

# --- Step 4: Download + Transcribe each reel ---
print('>>> [4/4] Downloading audio + transcribing...')
results = []

for idx, item in enumerate(items, 1):
    print(f'  Processing reel {idx}/{len(items)}...')
    audio_url = item.get('audioUrl') or item.get('videoUrl','')
    out_path = os.path.join(TMPDIR, f'cr_reel_{idx}.mp4')

    # Download
    subprocess.run(['curl','-s','-L', audio_url, '-o', out_path], capture_output=True)
    size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
    print(f'    Downloaded: {size/1024:.1f} KB')

    # Transcribe
    transcript = ''
    if size > 0:
        r = subprocess.run([
            'curl','-s','-X','POST','https://api.openai.com/v1/audio/transcriptions',
            '-H', f'Authorization: Bearer {OPENAI_KEY}',
            '-F', f'file=@{out_path}',
            '-F', 'model=whisper-1',
            '-F', 'response_format=text'
        ], capture_output=True, encoding='utf-8', errors='replace')
        transcript = r.stdout.strip()

    # Fallback to caption
    if not transcript:
        transcript = item.get('caption','(no transcript available)')

    print(f'    Transcript: {len(transcript)} chars')

    results.append({
        'index': idx,
        'url': item.get('url',''),
        'shortCode': item.get('shortCode',''),
        'timestamp': item.get('timestamp',''),
        'likes': item.get('likesCount',0),
        'views': item.get('videoPlayCount',0),
        'comments': item.get('commentsCount',0),
        'duration': item.get('videoDuration',0),
        'caption': item.get('caption','').replace(chr(10),' ')[:500],
        'transcript': transcript
    })

    # Cleanup audio file
    try: os.remove(out_path)
    except: pass

# --- Write TXT output ---
from datetime import datetime
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
out_filename = f'competitor_reels_{username}_{timestamp}.txt'
out_path = os.path.join(os.path.expanduser('~'), 'Desktop', out_filename)

lines = []
lines.append(f'COMPETITOR REELS ANALYSIS')
lines.append(f'Profile: @{username}')
lines.append(f'URL: {INSTAGRAM_URL}')
lines.append(f'Scraped: {len(results)} reels')
lines.append(f'Generated: {datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")}')
lines.append('=' * 70)
lines.append('')

for r in results:
    lines.append(f'REEL {r[\"index\"]} of {len(results)}')
    lines.append(f'URL:       {r[\"url\"]}')
    lines.append(f'Posted:    {r[\"timestamp\"]}')
    lines.append(f'Views:     {r[\"views\"]:,}')
    lines.append(f'Likes:     {r[\"likes\"]:,}')
    lines.append(f'Comments:  {r[\"comments\"]:,}')
    lines.append(f'Duration:  {r[\"duration\"]}s')
    lines.append('')
    lines.append('CAPTION:')
    lines.append(r['caption'])
    lines.append('')
    lines.append('TRANSCRIPT:')
    lines.append(r['transcript'])
    lines.append('')
    lines.append('-' * 70)
    lines.append('')

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(chr(10).join(lines))

print()
print(f'TXT saved to: {out_path}')
print(f'Total reels: {len(results)}')
for r in results:
    print(f'  Reel {r[\"index\"]}: {r[\"views\"]:,} views | {r[\"likes\"]:,} likes | {len(r[\"transcript\"])} chars transcript')
" 2>&1 | python -c "import sys; sys.stdout.buffer.write(sys.stdin.buffer.read())"
```

---

## After Script Completes

Tell the user:

```
✅ Done! Scraped and transcribed X reels from @<username>.

📄 File saved to: ~/Desktop/competitor_reels_<username>_<timestamp>.txt

What would you like to do next?
1️⃣  Just use the txt file (done here)
2️⃣  Move to Step 2 → Content analysis (finds top-performing topics, highest views, detailed summary per reel)
```

Wait for user response before proceeding.

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `APIFY_TOKEN` | Ask user — save via `/update-config` |
| Missing `OPENAI_API_KEY` | Ask user — save via `/update-config` |
| Apify FAILED | Show run URL for debugging |
| No reels found | Profile may be private or URL is wrong |
| audioUrl empty | Falls back to `videoUrl`; transcript falls back to caption |
| Desktop path not found | Save to home directory instead |

---

## About This Skill

Built by **Manthan Jethwani** as part of the Phaze AI competitor intelligence toolkit.

If you're a business owner looking to implement AI into your operations
or need hands-on AI consulting — reach out.

🌐 [phazeai.com](https://www.phazeai.com)
📞 +91 79907 00545
