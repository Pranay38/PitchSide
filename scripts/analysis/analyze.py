import sys, os, re
from collections import Counter
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8')

txt_path = r'/Users/pranayagrawal/Desktop/competitor_research_twitter_reddit_instagram_20260419_212506.txt'

with open(txt_path, encoding='utf-8') as f:
    raw = f.read()

print(f'File loaded: {len(raw):,} chars')

# ─── TOPIC KEYWORDS ─────────────────────────────────────────────────
topic_keywords = {
    'AI Tools':          ['ai', 'artificial intelligence', 'claude', 'chatgpt', 'openai', 'gpt', 'llm', 'gemini'],
    'Automation':        ['automate', 'automation', 'n8n', 'zapier', 'make.com', 'workflow', 'no-code'],
    'Content Creation':  ['content', 'reel', 'video', 'editing', 'creator', 'caption', 'post'],
    'Business/Money':    ['business', 'money', 'income', 'revenue', 'profit', 'earn', 'sales', 'client', 'freelance'],
    'Coding/Tech':       ['code', 'coding', 'developer', 'software', 'app', 'build', 'deploy', 'api', 'tech'],
    'Productivity':      ['productivity', 'save time', 'faster', 'efficient', 'replace', 'hours'],
    'Education':         ['how to', 'guide', 'tutorial', 'learn', 'tips', 'tricks', 'step by step'],
    'Social Media':      ['instagram', 'linkedin', 'twitter', 'followers', 'engagement', 'viral', 'growth'],
    'Personal Brand':    ['personal brand', 'audience', 'community', 'brand', 'influencer'],
    'Agency/Clients':    ['agency', 'client', 'freelancer', 'retainer', 'proposal', 'leads'],
}

def detect_topics(text):
    text_lower = text.lower()
    counts = {}
    for topic, keywords in topic_keywords.items():
        count = sum(text_lower.count(kw) for kw in keywords)
        if count > 0:
            counts[topic] = count
    return sorted(counts.items(), key=lambda x: x[1], reverse=True)

# ─── SPLIT INTO PLATFORM SECTIONS ───────────────────────────────────
ig_section  = ''
rd_section  = ''
tw_section  = ''

# Split on the thick separator lines
platform_blocks = re.split(r'[━]{50,}', raw)

for block in platform_blocks:
    header_line = block.strip().split('\n')[0] if block.strip() else ''
    if 'PLATFORM: INSTAGRAM' in header_line:
        ig_section += block # += in case of multiple Instagram accounts
    elif 'PLATFORM: REDDIT' in block[:200]:
        rd_section += block
    elif 'PLATFORM: TWITTER' in block[:200]:
        tw_section += block

print(f'Instagram section: {len(ig_section):,} chars')
print(f'Reddit section:    {len(rd_section):,} chars')
print(f'Twitter section:   {len(tw_section):,} chars')

# ─── PARSE INSTAGRAM ────────────────────────────────────────────────
reels = []
if ig_section:
    # Pattern: REEL N | Views: X,XXX | Likes: X | Comments: X
    reel_blocks = re.split(r'(?=REEL \d+ \|)', ig_section)
    reel_pat = re.compile(
        r'REEL (\d+) \| Views: ([\d,]+) \| Likes: ([\d,]+) \| Comments: ([\d,]+)\n'
        r'URL: (.*?) \| Posted: (.*?) \| Duration: (.*?)s?\n'
        r'Caption: (.*?)\n'
        r'Transcript: (.*?)(?=\nREEL |\Z)',
        re.DOTALL
    )
    for m in reel_pat.finditer(ig_section):
        views   = int(m.group(2).replace(',',''))
        likes   = int(m.group(3).replace(',',''))
        comments= int(m.group(4).replace(',',''))
        engage  = likes + comments
        eng_rate= round(engage / views * 100, 2) if views > 0 else 0
        reels.append({
            'index':    int(m.group(1)),
            'views':    views,
            'likes':    likes,
            'comments': comments,
            'url':      m.group(5).strip(),
            'posted':   m.group(6).strip(),
            'duration': m.group(7).strip(),
            'caption':  m.group(8).strip(),
            'transcript': m.group(9).strip(),
            'engagement_rate': eng_rate
        })
    reels_sorted = sorted(reels, key=lambda x: x['views'], reverse=True)
    print(f'Parsed {len(reels)} Instagram reels')

# ─── PARSE REDDIT ───────────────────────────────────────────────────
rd_posts    = []
rd_comments = []
if rd_section:
    post_pat = re.compile(
        r'POST \d+ \| Upvotes: ([\d,]+) \| r/(\S+)\nTitle: (.*?)\n(?:Body: (.*?)\n)?(?=POST |\nTOP COMMENTS|\Z)',
        re.DOTALL
    )
    for m in post_pat.finditer(rd_section):
        rd_posts.append({
            'upvotes':   int(m.group(1).replace(',','')),
            'subreddit': m.group(2).strip(),
            'title':     m.group(3).strip(),
            'body':      (m.group(4) or '').strip()[:400]
        })

    comment_pat = re.compile(
        r'COMMENT \d+ \(score: ([\d,]+)\) u/(\S+): (.*?)(?=\nCOMMENT |\Z)',
        re.DOTALL
    )
    for m in comment_pat.finditer(rd_section):
        rd_comments.append({
            'score':  int(m.group(1).replace(',','')),
            'author': m.group(2).strip(),
            'text':   m.group(3).strip()[:400]
        })

    rd_posts    = sorted(rd_posts,    key=lambda x: x['upvotes'], reverse=True)
    rd_comments = sorted(rd_comments, key=lambda x: x['score'],   reverse=True)
    print(f'Parsed {len(rd_posts)} Reddit posts, {len(rd_comments)} comments')

# ─── PARSE TWITTER ──────────────────────────────────────────────────
tw_tweets = []
if tw_section:
    tweet_pat = re.compile(
        r'TWEET \d+ \| @(\S+) \| Likes: ([\d,]+) \| RT: ([\d,]+) \| Views: ([\d,]+)\n(.*?)(?=\nTWEET |\Z)',
        re.DOTALL
    )
    for m in tweet_pat.finditer(tw_section):
        likes = int(m.group(2).replace(',',''))
        rts   = int(m.group(3).replace(',',''))
        views = int(m.group(4).replace(',',''))
        tw_tweets.append({
            'username':  m.group(1).strip(),
            'likes':     likes,
            'retweets':  rts,
            'views':     views,
            'text':      m.group(5).strip(),
            'engagement': likes + rts * 2
        })
    tw_tweets = sorted(tw_tweets, key=lambda x: x['engagement'], reverse=True)
    print(f'Parsed {len(tw_tweets)} tweets')

# ─── CROSS-PLATFORM TOPIC DETECTION ────────────────────────────────
all_text = ' '.join([
    ' '.join(r['transcript'] + ' ' + r['caption'] for r in reels),
    ' '.join(p['title'] + ' ' + p['body'] for p in rd_posts),
    ' '.join(t['text'] for t in tw_tweets)
])
cross_topics = detect_topics(all_text)

# ─── BUILD ANALYSIS REPORT ──────────────────────────────────────────
lines = []
lines.append('COMPETITOR RESEARCH — CONTENT ANALYSIS REPORT')
lines.append(f'Source: {os.path.basename(txt_path)}')
lines.append(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
platforms_found = []
if reels:    platforms_found.append(f'Instagram ({len(reels)} reels)')
if rd_posts: platforms_found.append(f'Reddit ({len(rd_posts)} posts)')
if tw_tweets:platforms_found.append(f'Twitter ({len(tw_tweets)} tweets)')
lines.append(f'Platforms: {" | ".join(platforms_found)}')
lines.append('=' * 70)
lines.append('')

# ── SECTION 1: CROSS-PLATFORM TOP TOPICS ────────────────────────────
lines.append('SECTION 1: CROSS-PLATFORM TOP TOPICS')
lines.append('-' * 70)
if cross_topics:
    for topic, count in cross_topics[:10]:
        bar = 'X' * min(count // 2 + 1, 35)
        lines.append(f'{topic:<22} {bar} ({count} signals)')
else:
    lines.append('(Topics not detected — content may be in another language)')
lines.append('')

# ── SECTION 2: INSTAGRAM REEL PERFORMANCE ───────────────────────────
lines.append('')
lines.append('SECTION 2: INSTAGRAM REEL PERFORMANCE')
lines.append('-' * 70)
if reels:
    for i, r in enumerate(reels_sorted, 1):
        lines.append(f'#{i}  Reel {r["index"]} — {r["views"]:,} views | {r["likes"]:,} likes | {r["comments"]:,} comments | {r["engagement_rate"]}% eng.')
        lines.append(f'    URL: {r["url"]}')
        lines.append(f'    Posted: {r["posted"]} | Duration: {r["duration"]}s')
        lines.append('')
    avg_views = sum(r['views'] for r in reels) // len(reels)
    lines.append(f'Average views: {avg_views:,}')
    lines.append(f'Top reel: Reel {reels_sorted[0]["index"]} — {reels_sorted[0]["views"]:,} views')
    lines.append('')

    # Hook patterns
    lines.append('')
    lines.append('INSTAGRAM HOOK PATTERNS (first 20 words of each transcript):')
    lines.append('-' * 50)
    for r in reels:
        hook = ' '.join(r['transcript'].split()[:20])
        lines.append(f'Reel {r["index"]} ({r["views"]:,} views):')
        lines.append(f'  "{hook}..."')
        lines.append('')

    # Full transcript per reel
    lines.append('')
    lines.append('INSTAGRAM FULL REEL DETAILS:')
    lines.append('=' * 70)
    for r in reels:
        lines.append(f'REEL {r["index"]} — {r["url"]}')
        lines.append(f'Stats: {r["views"]:,} views | {r["likes"]:,} likes | {r["comments"]:,} comments | {r["engagement_rate"]}% eng.')
        lines.append(f'Posted: {r["posted"]} | Duration: {r["duration"]}s')
        lines.append(f'Caption: {r["caption"]}')
        lines.append(f'Transcript: {r["transcript"]}')
        lines.append('-' * 70)
        lines.append('')
else:
    lines.append('(No Instagram data in this report)')
    lines.append('')

# ── SECTION 3: REDDIT INSIGHTS ──────────────────────────────────────
lines.append('')
lines.append('SECTION 3: REDDIT — PAIN POINTS & HOT TOPICS')
lines.append('-' * 70)
if rd_posts:
    lines.append(f'Top {min(len(rd_posts),15)} posts by upvotes:')
    lines.append('')
    for i, post in enumerate(rd_posts[:15], 1):
        lines.append(f'POST {i} — {post["upvotes"]:,} upvotes | r/{post["subreddit"]}')
        lines.append(f'  Title: {post["title"]}')
        if post['body']:
            lines.append(f'  Body:  {post["body"][:300]}')
        lines.append('')

    if rd_comments:
        lines.append('Top Comments (pain points & opinions):')
        lines.append('-' * 50)
        for i, c in enumerate(rd_comments[:10], 1):
            lines.append(f'COMMENT {i} (score: {c["score"]}) u/{c["author"]}:')
            lines.append(f'  {c["text"]}')
            lines.append('')

    # Reddit topic summary
    rd_text = ' '.join(p['title'] + ' ' + p['body'] for p in rd_posts)
    rd_topics = detect_topics(rd_text)
    if rd_topics:
        lines.append('Reddit Top Topics:')
        for topic, count in rd_topics[:6]:
            lines.append(f'  - {topic} ({count} signals)')
    lines.append('')
else:
    lines.append('(No Reddit data in this report)')
    lines.append('')

# ── SECTION 4: TWITTER INSIGHTS ─────────────────────────────────────
lines.append('')
lines.append('SECTION 4: TWITTER/X — VIRAL ANGLES & TRENDING CONVERSATIONS')
lines.append('-' * 70)
if tw_tweets:
    lines.append(f'Top {min(len(tw_tweets),15)} tweets by engagement:')
    lines.append('')
    for i, t in enumerate(tw_tweets[:15], 1):
        lines.append(f'TWEET {i} — @{t["username"]} | {t["likes"]:,} likes | {t["retweets"]:,} RT | {t["views"]:,} views')
        lines.append(f'  {t["text"]}')
        lines.append('')

    tw_text = ' '.join(t['text'] for t in tw_tweets)
    tw_topics = detect_topics(tw_text)
    if tw_topics:
        lines.append('Twitter Top Topics:')
        for topic, count in tw_topics[:6]:
            lines.append(f'  - {topic} ({count} signals)')
    lines.append('')
else:
    lines.append('(No Twitter data in this report)')
    lines.append('')

# ── SECTION 5: KEY TAKEAWAYS FOR SCRIPT ─────────────────────────────
lines.append('')
lines.append('SECTION 5: KEY TAKEAWAYS — WHAT TO BASE YOUR SCRIPT ON')
lines.append('=' * 70)

if reels and reels_sorted:
    lines.append(f'Top Instagram angle:  Reel {reels_sorted[0]["index"]} — {reels_sorted[0]["views"]:,} views')
    hook_words = reels_sorted[0]["transcript"].split()[:15]
    lines.append(f'  Hook that worked:   "{" ".join(hook_words)}..."')
    lines.append('')

if rd_posts:
    lines.append(f'Top Reddit pain point: "{rd_posts[0]["title"]}"')
    lines.append(f'  ({rd_posts[0]["upvotes"]:,} upvotes — people clearly care about this)')
    lines.append('')

if tw_tweets:
    lines.append(f'Top Twitter angle: @{tw_tweets[0]["username"]} — {tw_tweets[0]["likes"]:,} likes')
    lines.append(f'  "{tw_tweets[0]["text"][:200]}"')
    lines.append('')

if cross_topics:
    lines.append(f'Winning topic across all platforms: {cross_topics[0][0]}')
    lines.append(f'  Sub-topics: {" | ".join([t[0] for t in cross_topics[1:4]])}')
lines.append('')
lines.append('Use this for Step 3 → Script writing will pull from all platforms above.')
lines.append('')

# ─── SAVE OUTPUT ────────────────────────────────────────────────────
base = os.path.splitext(os.path.basename(txt_path))[0]
out_filename = f'{base}_ANALYSIS.txt'
out_path = os.path.join(os.path.dirname(txt_path), out_filename)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(chr(10).join(lines))

print()
print(f'Analysis saved to: {out_path}')
print(f'OUTPUT_FILE={out_path}')
print()
print('QUICK SUMMARY:')
if reels:    print(f'  Instagram top reel: {reels_sorted[0]["views"]:,} views')
if rd_posts: print(f'  Reddit top post: "{rd_posts[0]["title"][:60]}"')
if tw_tweets:print(f'  Twitter top tweet: {tw_tweets[0]["likes"]:,} likes by @{tw_tweets[0]["username"]}')
if cross_topics: print(f'  Cross-platform winning topic: {cross_topics[0][0]}')
