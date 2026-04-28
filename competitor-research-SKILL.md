---
name: competitor-research
description: >
  Master competitor research orchestrator. Asks which platforms to research
  (Instagram Reels, Reddit, Twitter/X — any combo or all), collects platform-specific
  inputs, then runs all selected platforms in parallel and combines results into
  a single master report. Use when user says "competitor research", "research competitor",
  "multi-platform research", "research on all platforms", or just "research".
user-invokable: true
argument-hint: ""
allowed-tools:
  - Bash
---

# Competitor Research — Master Orchestrator

Runs Instagram, Reddit, and/or Twitter research in parallel and combines into one report.
> 💡 *Part of the [Phaze AI](https://www.phazeai.com) competitor intelligence toolkit — built by Manthan Jethwani.*

**Requires:** `APIFY_TOKEN` env var | `OPENAI_API_KEY` env var (for Instagram transcription)

---

## Step 0 — Ask Which Platforms

Ask the user:

```
Which platforms do you want to research? (choose one or multiple)

1️⃣  Instagram Reels — scrape + transcribe competitor reels
2️⃣  Reddit — scrape posts & comments by keyword
3️⃣  Twitter/X — scrape tweets by keyword
4️⃣  All platforms

Type the numbers: e.g. "1 2" or "all"
```

---

## Step 1 — Collect Platform-Specific Inputs

Based on selection, ask the relevant questions:

### If Instagram selected:
- Instagram profile URL? *(e.g. https://www.instagram.com/someprofile/)*
- How many reels to scrape? *(e.g. 5)*

### If Reddit selected:
- Search terms? *(comma separated, e.g. "claude code, n8n, AI automation")*
- Max posts per search term? *(default: 15)*
- Max comments per post? *(default: 10)*

### If Twitter selected:
- Search terms? *(comma separated, e.g. "claude code, #AItools")*
- Max tweets total? *(default: 100)*
- Sort: Latest, Top, or both? *(default: "Latest + Top")*

Ask all selected platforms' questions in ONE message before proceeding.

---

## Step 2 — Run ALL Selected Platforms in Parallel

Launch all selected scrapers simultaneously using background Python subprocesses, then wait for all to finish.

```bash
python -c "
import subprocess, os, tempfile, json, sys, time, threading
sys.stdout.reconfigure(encoding='utf-8')

APIFY_TOKEN = os.environ['APIFY_TOKEN']
OPENAI_KEY = os.environ.get('OPENAI_API_KEY', '')
TMPDIR = tempfile.gettempdir()

# ============================================================
# CONFIGURE BASED ON USER SELECTIONS
# ============================================================
RUN_INSTAGRAM = <TRUE_OR_FALSE>
RUN_REDDIT    = <TRUE_OR_FALSE>
RUN_TWITTER   = <TRUE_OR_FALSE>

# Instagram config
INSTAGRAM_URL = '<INSTAGRAM_PROFILE_URL>'
INSTAGRAM_NUM_REELS = <NUM_REELS>

# Reddit config
REDDIT_SEARCH_TERMS = <REDDIT_SEARCH_TERMS_LIST>    # e.g. ['claude code', 'n8n']
REDDIT_MAX_POSTS = <REDDIT_MAX_POSTS>
REDDIT_MAX_COMMENTS = <REDDIT_MAX_COMMENTS>

# Twitter config
TWITTER_SEARCH_TERMS = <TWITTER_SEARCH_TERMS_LIST>   # e.g. ['claude code', '#AItools']
TWITTER_MAX_ITEMS = <TWITTER_MAX_ITEMS>
TWITTER_SORT = '<TWITTER_SORT>'   # 'Latest + Top'
# ============================================================

results = {}
errors = {}
lock = threading.Lock()

# ─── INSTAGRAM WORKER ───────────────────────────────────────
def run_instagram():
    try:
        print('[Instagram] Starting Apify scrape...')
        r = subprocess.run([
            'curl','-s','-X','POST',
            f'https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/runs?token={APIFY_TOKEN}',
            '-H','Content-Type: application/json',
            '-d', json.dumps({
                'directUrls': [INSTAGRAM_URL],
                'resultsType': 'posts',
                'resultsLimit': INSTAGRAM_NUM_REELS,
                'mediaType': 'VIDEO',
                'addParentData': False
            })
        ], capture_output=True, encoding='utf-8', errors='replace')
        resp = json.loads(r.stdout)
        run_id = resp['data']['id']
        dataset_id = resp['data']['defaultDatasetId']

        for i in range(40):
            r = subprocess.run(['curl','-s',f'https://api.apify.com/v2/actor-runs/{run_id}?token={APIFY_TOKEN}'],
                capture_output=True, encoding='utf-8', errors='replace')
            status = json.loads(r.stdout)['data']['status']
            if status == 'SUCCEEDED': break
            if status in ('FAILED','ABORTED'): raise Exception(f'Apify {status}')
            time.sleep(8)

        r = subprocess.run(['curl','-s',
            f'https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}&limit={INSTAGRAM_NUM_REELS}&format=json'],
            capture_output=True, encoding='utf-8', errors='replace')
        items = json.loads(r.stdout)
        items = items if isinstance(items, list) else items.get('items', [])

        username = items[0].get('ownerUsername','unknown') if items else 'unknown'
        reel_results = []

        for idx, item in enumerate(items, 1):
            audio_url = item.get('audioUrl') or item.get('videoUrl','')
            out_path = os.path.join(TMPDIR, f'ig_reel_{idx}.mp4')
            subprocess.run(['curl','-s','-L', audio_url, '-o', out_path], capture_output=True)
            size = os.path.getsize(out_path) if os.path.exists(out_path) else 0

            transcript = ''
            if size > 0 and OPENAI_KEY:
                r2 = subprocess.run([
                    'curl','-s','-X','POST','https://api.openai.com/v1/audio/transcriptions',
                    '-H', f'Authorization: Bearer {OPENAI_KEY}',
                    '-F', f'file=@{out_path}', '-F','model=whisper-1','-F','response_format=text'
                ], capture_output=True, encoding='utf-8', errors='replace')
                transcript = r2.stdout.strip()
            if not transcript:
                transcript = item.get('caption','')[:300]

            try: os.remove(out_path)
            except: pass

            reel_results.append({
                'index': idx,
                'url': item.get('url',''),
                'views': item.get('videoPlayCount',0),
                'likes': item.get('likesCount',0),
                'comments': item.get('commentsCount',0),
                'timestamp': item.get('timestamp',''),
                'duration': item.get('videoDuration',0),
                'caption': item.get('caption','').replace(chr(10),' ')[:400],
                'transcript': transcript
            })
            print(f'[Instagram] Reel {idx} done — {item.get(\"videoPlayCount\",0):,} views')

        with lock:
            results['instagram'] = {'username': username, 'reels': reel_results}
        print(f'[Instagram] Done! {len(reel_results)} reels scraped.')

    except Exception as e:
        with lock:
            errors['instagram'] = str(e)
        print(f'[Instagram] ERROR: {e}')

# ─── REDDIT WORKER ──────────────────────────────────────────
def run_reddit():
    try:
        print('[Reddit] Starting scrape...')
        actor_input = {
            'debugMode': False,
            'ignoreStartUrls': False,
            'includeNSFW': False,
            'maxComments': REDDIT_MAX_COMMENTS,
            'maxCommunitiesCount': 2,
            'maxItems': REDDIT_MAX_POSTS * len(REDDIT_SEARCH_TERMS),
            'maxPostCount': REDDIT_MAX_POSTS,
            'maxUserCount': 2,
            'proxy': {'useApifyProxy': True, 'apifyProxyGroups': ['RESIDENTIAL']},
            'scrollTimeout': 40,
            'searchComments': True,
            'searchCommunities': False,
            'searchPosts': True,
            'searchUsers': False,
            'searches': REDDIT_SEARCH_TERMS,
            'skipComments': False,
            'skipCommunity': False,
            'skipUserPosts': False,
            'sort': 'top',
            'time': 'month'
        }
        r = subprocess.run([
            'curl','-s','-X','POST',
            f'https://api.apify.com/v2/acts/oAuCIx3ItNrs2okjQ/runs?token={APIFY_TOKEN}',
            '-H','Content-Type: application/json',
            '-d', json.dumps(actor_input)
        ], capture_output=True, encoding='utf-8', errors='replace')
        resp = json.loads(r.stdout)
        run_id = resp['data']['id']
        dataset_id = resp['data']['defaultDatasetId']

        for i in range(60):
            r = subprocess.run(['curl','-s',f'https://api.apify.com/v2/actor-runs/{run_id}?token={APIFY_TOKEN}'],
                capture_output=True, encoding='utf-8', errors='replace')
            status = json.loads(r.stdout)['data']['status']
            if status == 'SUCCEEDED': break
            if status in ('FAILED','ABORTED'): raise Exception(f'Apify {status}')
            time.sleep(8)

        r = subprocess.run(['curl','-s',
            f'https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}&format=json&limit=500'],
            capture_output=True, encoding='utf-8', errors='replace')
        items = json.loads(r.stdout)
        items = items if isinstance(items, list) else items.get('items', [])

        posts = [x for x in items if x.get('title')]
        comments = [x for x in items if not x.get('title') and x.get('body')]
        posts_sorted = sorted(posts, key=lambda x: x.get('score', x.get('upVotes', 0)), reverse=True)
        comments_sorted = sorted(comments, key=lambda x: x.get('score', x.get('upVotes', 0)), reverse=True)

        with lock:
            results['reddit'] = {
                'search_terms': REDDIT_SEARCH_TERMS,
                'posts': posts_sorted,
                'comments': comments_sorted
            }
        print(f'[Reddit] Done! {len(posts)} posts, {len(comments)} comments.')

    except Exception as e:
        with lock:
            errors['reddit'] = str(e)
        print(f'[Reddit] ERROR: {e}')

# ─── TWITTER WORKER ─────────────────────────────────────────
def run_twitter():
    try:
        print('[Twitter] Starting scrape...')
        r = subprocess.run([
            'curl','-s','-X','POST',
            f'https://api.apify.com/v2/acts/nfp1fpt5gUlBwPcor/runs?token={APIFY_TOKEN}',
            '-H','Content-Type: application/json',
            '-d', json.dumps({
                'includeSearchTerms': False,
                'maxItems': TWITTER_MAX_ITEMS,
                'searchTerms': TWITTER_SEARCH_TERMS,
                'sort': TWITTER_SORT
            })
        ], capture_output=True, encoding='utf-8', errors='replace')
        resp = json.loads(r.stdout)
        run_id = resp['data']['id']
        dataset_id = resp['data']['defaultDatasetId']

        for i in range(60):
            r = subprocess.run(['curl','-s',f'https://api.apify.com/v2/actor-runs/{run_id}?token={APIFY_TOKEN}'],
                capture_output=True, encoding='utf-8', errors='replace')
            status = json.loads(r.stdout)['data']['status']
            if status == 'SUCCEEDED': break
            if status in ('FAILED','ABORTED'): raise Exception(f'Apify {status}')
            time.sleep(8)

        r = subprocess.run(['curl','-s',
            f'https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}&format=json&limit={TWITTER_MAX_ITEMS}'],
            capture_output=True, encoding='utf-8', errors='replace')
        items = json.loads(r.stdout)
        items = items if isinstance(items, list) else items.get('items', [])

        def eng(t): return t.get('likeCount', t.get('likes',0)) + t.get('retweetCount', t.get('retweets',0))*2
        items_sorted = sorted(items, key=eng, reverse=True)

        with lock:
            results['twitter'] = {
                'search_terms': TWITTER_SEARCH_TERMS,
                'tweets': items_sorted
            }
        print(f'[Twitter] Done! {len(items)} tweets scraped.')

    except Exception as e:
        with lock:
            errors['twitter'] = str(e)
        print(f'[Twitter] ERROR: {e}')

# ─── RUN IN PARALLEL ─────────────────────────────────────────
threads = []
if RUN_INSTAGRAM: threads.append(threading.Thread(target=run_instagram))
if RUN_REDDIT:    threads.append(threading.Thread(target=run_reddit))
if RUN_TWITTER:   threads.append(threading.Thread(target=run_twitter))

print(f'>>> Launching {len(threads)} platform(s) in parallel...')
for t in threads: t.start()
for t in threads: t.join()

print(f'>>> All platforms done! Building combined report...')

# ─── BUILD COMBINED REPORT ───────────────────────────────────
from datetime import datetime
lines = []
lines.append('COMPETITOR RESEARCH — MASTER REPORT')
lines.append(f'Platforms: {\" | \".join([p.upper() for p in results.keys()])}')
lines.append(f'Generated: {datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")}')
lines.append('=' * 70)
lines.append('')

# INSTAGRAM SECTION
if 'instagram' in results:
    ig = results['instagram']
    lines.append('━' * 70)
    lines.append(f'PLATFORM: INSTAGRAM — @{ig[\"username\"]}')
    lines.append('━' * 70)
    reels_sorted = sorted(ig['reels'], key=lambda x: x['views'], reverse=True)
    for r in reels_sorted:
        lines.append(f'REEL {r[\"index\"]} | Views: {r[\"views\"]:,} | Likes: {r[\"likes\"]:,} | Comments: {r[\"comments\"]:,}')
        lines.append(f'URL: {r[\"url\"]} | Posted: {r[\"timestamp\"]} | Duration: {r[\"duration\"]}s')
        lines.append(f'Caption: {r[\"caption\"]}')
        lines.append(f'Transcript: {r[\"transcript\"]}')
        lines.append('')
    lines.append('')

# REDDIT SECTION
if 'reddit' in results:
    rd = results['reddit']
    lines.append('━' * 70)
    lines.append(f'PLATFORM: REDDIT — Search: {rd[\"search_terms\"]}')
    lines.append('━' * 70)
    for i, post in enumerate(rd['posts'][:20], 1):
        score = post.get('score', post.get('upVotes', 0))
        title = post.get('title','')
        subreddit = post.get('communityName', post.get('subreddit',''))
        body = post.get('selftext', post.get('body', post.get('text','')))
        if body: body = body[:400].replace(chr(10),' ')
        lines.append(f'POST {i} | Upvotes: {score:,} | r/{subreddit}')
        lines.append(f'Title: {title}')
        if body: lines.append(f'Body: {body}')
        lines.append('')
    lines.append('TOP COMMENTS:')
    for i, c in enumerate(rd['comments'][:15], 1):
        score = c.get('score', c.get('upVotes',0))
        body = c.get('body', c.get('text',''))[:300]
        author = c.get('author', c.get('username',''))
        lines.append(f'COMMENT {i} (score: {score}) u/{author}: {body}')
        lines.append('')
    lines.append('')

# TWITTER SECTION
if 'twitter' in results:
    tw = results['twitter']
    lines.append('━' * 70)
    lines.append(f'PLATFORM: TWITTER/X — Search: {tw[\"search_terms\"]}')
    lines.append('━' * 70)
    for i, tweet in enumerate(tw['tweets'][:30], 1):
        text = tweet.get('text', tweet.get('tweetText',''))[:350]
        author = tweet.get('author',{})
        username = author.get('userName','unknown') if isinstance(author,dict) else 'unknown'
        likes = tweet.get('likeCount', tweet.get('likes',0))
        rts = tweet.get('retweetCount', tweet.get('retweets',0))
        views = tweet.get('viewCount', tweet.get('views',0))
        lines.append(f'TWEET {i} | @{username} | Likes: {likes:,} | RT: {rts:,} | Views: {views:,}')
        lines.append(f'{text}')
        lines.append('')
    lines.append('')

# ERRORS
if errors:
    lines.append('ERRORS:')
    for platform, err in errors.items():
        lines.append(f'  {platform}: {err}')
    lines.append('')

# Save combined report
desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
platforms_slug = '_'.join(results.keys())
out_filename = f'competitor_research_{platforms_slug}_{timestamp}.txt'
out_path = os.path.join(desktop, out_filename)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(chr(10).join(lines))

print()
print(f'Master report saved to: {out_path}')
for platform, data in results.items():
    if platform == 'instagram': print(f'  Instagram: {len(data[\"reels\"])} reels')
    elif platform == 'reddit': print(f'  Reddit: {len(data[\"posts\"])} posts, {len(data[\"comments\"])} comments')
    elif platform == 'twitter': print(f'  Twitter: {len(data[\"tweets\"])} tweets')
print(f'OUTPUT_FILE={out_path}')
" 2>&1 | python -c "import sys; sys.stdout.buffer.write(sys.stdin.buffer.read())"
```

---

## After Script Completes

Tell the user:

```
✅ Research complete across [N] platforms!
📄 Master report saved to: ~/Desktop/competitor_research_<platforms>_<timestamp>.txt

📊 Summary:
- Instagram: X reels transcribed from @username
- Reddit: X posts + X comments for [terms]
- Twitter: X tweets for [terms]

What's next?
→ Move to Step 2 (content analysis) to find top topics & patterns across all platforms?
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `APIFY_TOKEN` | Ask user to save via `/update-config` |
| Missing `OPENAI_API_KEY` | Instagram transcription skipped, captions used instead |
| One platform fails | Other platforms still complete — partial report saved |
| All platforms fail | Check APIFY_TOKEN is valid |

---

## About This Skill

Built by **Manthan Jethwani** as part of the Phaze AI competitor intelligence toolkit.

If you're a business owner looking to implement AI into your operations
or need hands-on AI consulting — reach out.

🌐 [phazeai.com](https://www.phazeai.com)
📞 +91 79907 00545
