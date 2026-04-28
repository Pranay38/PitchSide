---
name: competitor-twitter
description: >
  Scrapes Twitter/X posts by search terms using Apify actor nfp1fpt5gUlBwPcor.
  Asks user for search terms and max items. Saves results as a .txt file.
  Use when user says "twitter research", "scrape twitter", "competitor twitter", "X research",
  or when competitor-research skill selects Twitter as a platform.
user-invokable: true
argument-hint: "<search_terms> <max_items>"
allowed-tools:
  - Bash
---

# Competitor Research — Twitter/X Scraper

> 💡 *Part of the [Phaze AI](https://www.phazeai.com) competitor intelligence toolkit — built by Manthan Jethwani.*

Scrapes Twitter/X posts for any search terms using Apify.

**Requires:** `APIFY_TOKEN` env var
**Apify Actor:** `nfp1fpt5gUlBwPcor`

---

## Step 0 — Ask the User (if not provided as arguments)

Ask:
1. **Search terms** — what keywords/topics to search on Twitter? *(e.g. "claude code", "n8n", "#AItools")*
2. **Max tweets** — how many tweets total? *(default: 100, max: 1000)*
3. **Sort** — Latest, Top, or both? *(default: "Latest + Top")*

---

## Execute as ONE Bash call

Replace placeholders with user inputs:

```bash
python -c "
import subprocess, os, tempfile, json, sys, time
sys.stdout.reconfigure(encoding='utf-8')

SEARCH_TERMS = <SEARCH_TERMS_LIST>   # e.g. ['claude code', 'n8n automation']
MAX_ITEMS = <MAX_ITEMS>              # e.g. 100
SORT = '<SORT>'                      # 'Latest + Top', 'Latest', or 'Top'
APIFY_TOKEN = os.environ['APIFY_TOKEN']

actor_input = {
    'includeSearchTerms': False,
    'maxItems': MAX_ITEMS,
    'searchTerms': SEARCH_TERMS,
    'sort': SORT
}

# Start Apify run
print(f'>>> [1/3] Starting Twitter scrape for: {SEARCH_TERMS} (max {MAX_ITEMS} tweets)...')
r = subprocess.run([
    'curl', '-s', '-X', 'POST',
    f'https://api.apify.com/v2/acts/nfp1fpt5gUlBwPcor/runs?token={APIFY_TOKEN}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(actor_input)
], capture_output=True, encoding='utf-8', errors='replace')
resp = json.loads(r.stdout)
run_id = resp['data']['id']
dataset_id = resp['data']['defaultDatasetId']
print(f'  Run ID: {run_id}')

# Poll until done
print('>>> [2/3] Polling until SUCCEEDED...')
for i in range(1, 60):
    r = subprocess.run(['curl', '-s',
        f'https://api.apify.com/v2/actor-runs/{run_id}?token={APIFY_TOKEN}'
    ], capture_output=True, encoding='utf-8', errors='replace')
    status = json.loads(r.stdout)['data']['status']
    print(f'  Poll {i}: {status}')
    if status == 'SUCCEEDED': break
    if status in ('FAILED', 'ABORTED'): raise Exception(f'Apify run {status}')
    time.sleep(8)

# Fetch results
print('>>> [3/3] Fetching results...')
r = subprocess.run(['curl', '-s',
    f'https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}&format=json&limit={MAX_ITEMS}'
], capture_output=True, encoding='utf-8', errors='replace')
items = json.loads(r.stdout)
items = items if isinstance(items, list) else items.get('items', [])
print(f'  Fetched {len(items)} tweets')

# Sort by likes + retweets (engagement)
def engagement(t):
    return t.get('likeCount', t.get('likes', 0)) + t.get('retweetCount', t.get('retweets', 0)) * 2

items_sorted = sorted(items, key=engagement, reverse=True)

# Build TXT output
from datetime import datetime
lines = []
lines.append('TWITTER/X RESEARCH REPORT')
lines.append(f'Search Terms: {SEARCH_TERMS}')
lines.append(f'Sort: {SORT}')
lines.append(f'Generated: {datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")}')
lines.append(f'Total tweets: {len(items)}')
lines.append('=' * 70)
lines.append('')

# Top tweets by engagement
lines.append('SECTION 1: TOP TWEETS (sorted by engagement)')
lines.append('-' * 70)
for i, tweet in enumerate(items_sorted[:50], 1):
    text = tweet.get('text', tweet.get('full_text', tweet.get('tweetText', '')))
    author = tweet.get('author', {})
    username = author.get('userName', tweet.get('authorName', tweet.get('username', 'unknown'))) if isinstance(author, dict) else tweet.get('authorName', 'unknown')
    likes = tweet.get('likeCount', tweet.get('likes', 0))
    retweets = tweet.get('retweetCount', tweet.get('retweets', 0))
    replies = tweet.get('replyCount', tweet.get('replies', 0))
    views = tweet.get('viewCount', tweet.get('views', 0))
    created = tweet.get('createdAt', tweet.get('created_at', ''))
    url = tweet.get('url', tweet.get('tweetUrl', ''))

    lines.append(f'TWEET {i}')
    lines.append(f'Author:   @{username}')
    lines.append(f'Likes:    {likes:,} | Retweets: {retweets:,} | Replies: {replies:,} | Views: {views:,}')
    lines.append(f'Posted:   {created}')
    lines.append(f'URL:      {url}')
    lines.append(f'Text:     {text[:400]}')
    lines.append('')

# Stats summary
total_likes = sum(t.get('likeCount', t.get('likes', 0)) for t in items)
total_rt = sum(t.get('retweetCount', t.get('retweets', 0)) for t in items)
avg_likes = total_likes // len(items) if items else 0

lines.append('')
lines.append('SECTION 2: SUMMARY STATS')
lines.append('-' * 70)
lines.append(f'Total tweets scraped: {len(items)}')
lines.append(f'Total likes across all: {total_likes:,}')
lines.append(f'Total retweets: {total_rt:,}')
lines.append(f'Avg likes per tweet: {avg_likes:,}')
if items_sorted:
    top = items_sorted[0]
    top_author = top.get('author', {})
    top_username = top_author.get('userName', 'unknown') if isinstance(top_author, dict) else 'unknown'
    lines.append(f'Top tweet: @{top_username} — {top.get(\"likeCount\", 0):,} likes')
lines.append('')

# Save to Desktop
desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
search_slug = '_'.join(SEARCH_TERMS[:2]).replace(' ', '-')[:30]
out_filename = f'twitter_research_{search_slug}_{timestamp}.txt'
out_path = os.path.join(desktop, out_filename)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(chr(10).join(lines))

print()
print(f'TXT saved to: {out_path}')
print(f'Total tweets: {len(items)} | Avg likes: {avg_likes:,}')
print(f'OUTPUT_FILE={out_path}')
" 2>&1 | python -c "import sys; sys.stdout.buffer.write(sys.stdin.buffer.read())"
```

---

## After Script Completes

```
✅ Twitter research done!
📄 Saved to: ~/Desktop/twitter_research_<terms>_<timestamp>.txt

📊 Quick stats:
- X tweets scraped
- Avg likes: N | Total retweets: N
- Top tweet: @username — N likes
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `APIFY_TOKEN` | Ask user to save via `/update-config` |
| Apify FAILED | Twitter may have rate limited Apify — retry after 60s |
| 0 results | Try different search terms or reduce max items |
| Actor not available | Check `https://console.apify.com/actors/nfp1fpt5gUlBwPcor` |

---

## About This Skill

Built by **Manthan Jethwani** as part of the Phaze AI competitor intelligence toolkit.

If you're a business owner looking to implement AI into your operations
or need hands-on AI consulting — reach out.

🌐 [phazeai.com](https://www.phazeai.com)
📞 +91 79907 00545
