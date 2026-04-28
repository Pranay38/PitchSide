---
name: competitor-reddit
description: >
  Scrapes Reddit posts and comments by search terms using Apify actor oAuCIx3ItNrs2okjQ.
  Asks user for search terms and max items. Saves results as a .txt file.
  Use when user says "reddit research", "scrape reddit", "competitor reddit",
  or when competitor-research skill selects Reddit as a platform.
user-invokable: true
argument-hint: "<search_terms> <max_items>"
allowed-tools:
  - Bash
---

# Competitor Research — Reddit Scraper

> 💡 *Part of the [Phaze AI](https://www.phazeai.com) competitor intelligence toolkit — built by Manthan Jethwani.*

Scrapes Reddit posts + comments for any search terms using Apify.

**Requires:** `APIFY_TOKEN` env var
**Apify Actor:** `oAuCIx3ItNrs2okjQ`

---

## Step 0 — Ask the User (if not provided as arguments)

Ask:
1. **Search terms** — what keywords/topics to search on Reddit? *(e.g. "claude code", "n8n automation", "AI tools")*
2. **Max posts per search term** — how many posts? *(default: 15, max recommended: 50)*
3. **Max comments per post** — how many comments? *(default: 10)*

---

## Execute as ONE Bash call

Replace placeholders with user inputs:

```bash
python -c "
import subprocess, os, tempfile, json, sys, time
sys.stdout.reconfigure(encoding='utf-8')

SEARCH_TERMS = <SEARCH_TERMS_LIST>   # e.g. ['claude code', 'n8n automation']
MAX_POSTS = <MAX_POSTS>              # e.g. 15
MAX_COMMENTS = <MAX_COMMENTS>        # e.g. 10
APIFY_TOKEN = os.environ['APIFY_TOKEN']
TMPDIR = tempfile.gettempdir()

actor_input = {
    'debugMode': False,
    'ignoreStartUrls': False,
    'includeNSFW': False,
    'maxComments': MAX_COMMENTS,
    'maxCommunitiesCount': 2,
    'maxItems': MAX_POSTS * len(SEARCH_TERMS),
    'maxPostCount': MAX_POSTS,
    'maxUserCount': 2,
    'proxy': {
        'useApifyProxy': True,
        'apifyProxyGroups': ['RESIDENTIAL']
    },
    'scrollTimeout': 40,
    'searchComments': True,
    'searchCommunities': False,
    'searchPosts': True,
    'searchUsers': False,
    'searches': SEARCH_TERMS,
    'skipComments': False,
    'skipCommunity': False,
    'skipUserPosts': False,
    'sort': 'top',
    'time': 'month'
}

# Start Apify run
print(f'>>> [1/3] Starting Reddit scrape for: {SEARCH_TERMS}...')
r = subprocess.run([
    'curl', '-s', '-X', 'POST',
    f'https://api.apify.com/v2/acts/oAuCIx3ItNrs2okjQ/runs?token={APIFY_TOKEN}',
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
    f'https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}&format=json&limit=500'
], capture_output=True, encoding='utf-8', errors='replace')
items = json.loads(r.stdout)
items = items if isinstance(items, list) else items.get('items', [])
print(f'  Fetched {len(items)} items')

# Separate posts and comments
posts = [x for x in items if x.get('dataType') == 'post' or x.get('id','').startswith('t3_')]
comments = [x for x in items if x.get('dataType') == 'comment' or x.get('id','').startswith('t1_')]
# fallback if dataType not present
if not posts and not comments:
    posts = [x for x in items if x.get('title')]
    comments = [x for x in items if not x.get('title') and x.get('body')]

print(f'  Posts: {len(posts)} | Comments: {len(comments)}')

# Sort posts by score/upvotes
posts_sorted = sorted(posts, key=lambda x: x.get('score', x.get('upVotes', 0)), reverse=True)

# Build TXT output
from datetime import datetime
lines = []
lines.append('REDDIT RESEARCH REPORT')
lines.append(f'Search Terms: {SEARCH_TERMS}')
lines.append(f'Generated: {datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")}')
lines.append(f'Total posts: {len(posts)} | Total comments: {len(comments)}')
lines.append('=' * 70)
lines.append('')

# Top posts
lines.append('SECTION 1: TOP POSTS (sorted by upvotes)')
lines.append('-' * 70)
for i, post in enumerate(posts_sorted[:MAX_POSTS], 1):
    title = post.get('title', '(no title)')
    url = post.get('url', post.get('link', ''))
    subreddit = post.get('communityName', post.get('subreddit', ''))
    score = post.get('score', post.get('upVotes', 0))
    num_comments = post.get('numberOfComments', post.get('commentsCount', 0))
    created = post.get('createdAt', post.get('created', ''))
    body = post.get('selftext', post.get('body', post.get('text', '')))
    if body:
        body = body[:500].replace(chr(10), ' ')

    lines.append(f'POST {i}')
    lines.append(f'Title:     {title}')
    lines.append(f'Subreddit: r/{subreddit}')
    lines.append(f'Upvotes:   {score:,} | Comments: {num_comments}')
    lines.append(f'Posted:    {created}')
    lines.append(f'URL:       {url}')
    if body:
        lines.append(f'Body:      {body}')
    lines.append('')

# Top comments
lines.append('')
lines.append('SECTION 2: TOP COMMENTS')
lines.append('-' * 70)
comments_sorted = sorted(comments, key=lambda x: x.get('score', x.get('upVotes', 0)), reverse=True)
for i, comment in enumerate(comments_sorted[:30], 1):
    body = comment.get('body', comment.get('text', ''))
    author = comment.get('author', comment.get('username', 'unknown'))
    score = comment.get('score', comment.get('upVotes', 0))
    post_title = comment.get('postTitle', '')

    lines.append(f'COMMENT {i} (score: {score}) by u/{author}')
    if post_title:
        lines.append(f'On post: \"{post_title[:80]}\"')
    lines.append(f'{body[:400]}')
    lines.append('')

# Save to Desktop
desktop = os.path.join(os.path.expanduser('~'), 'Desktop')
timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
search_slug = '_'.join(SEARCH_TERMS[:2]).replace(' ', '-')[:30]
out_filename = f'reddit_research_{search_slug}_{timestamp}.txt'
out_path = os.path.join(desktop, out_filename)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(chr(10).join(lines))

print()
print(f'TXT saved to: {out_path}')
print(f'Top post: \"{posts_sorted[0][\"title\"] if posts_sorted else \"N/A\"}\" — {posts_sorted[0].get(\"score\",0) if posts_sorted else 0} upvotes')

# Return path for orchestrator
print(f'OUTPUT_FILE={out_path}')
" 2>&1 | python -c "import sys; sys.stdout.buffer.write(sys.stdin.buffer.read())"
```

---

## After Script Completes

```
✅ Reddit research done!
📄 Saved to: ~/Desktop/reddit_research_<terms>_<timestamp>.txt

📊 Quick stats:
- X posts found across Y subreddits
- Top post: "[title]" — N upvotes
```

---

## Error Handling

| Error | Action |
|-------|--------|
| Missing `APIFY_TOKEN` | Ask user to save via `/update-config` |
| Apify FAILED | Proxy may have failed — retry once |
| 0 results | Search terms too specific or no Reddit activity — try broader terms |
| Rate limited | Wait 30s and retry |

---

## About This Skill

Built by **Manthan Jethwani** as part of the Phaze AI competitor intelligence toolkit.

If you're a business owner looking to implement AI into your operations
or need hands-on AI consulting — reach out.

🌐 [phazeai.com](https://www.phazeai.com)
📞 +91 79907 00545
