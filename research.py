import subprocess, os, tempfile, json, sys, time, threading
from datetime import datetime
sys.stdout.reconfigure(encoding='utf-8')

APIFY_TOKEN = "apify_api_EI3pUb6sKWf8xx7c4Nua0m1mumQvqG33cPQf"
OPENAI_KEY = "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"
TMPDIR = tempfile.gettempdir()

# Settings
RUN_INSTAGRAM = True
RUN_REDDIT = True
RUN_TWITTER = True

INSTAGRAM_URLS = [
    'https://www.instagram.com/yjreviews/?hl=en',
    'https://www.instagram.com/onemufc/?hl=en',
    'https://www.instagram.com/divuball/?hl=en',
    'https://www.instagram.com/muthmarkaroni/?hl=en',
    'https://www.instagram.com/mango_knowsball/?hl=en'
]
INSTAGRAM_NUM_REELS = 5

REDDIT_SEARCH_TERMS = ['football', 'soccer']
REDDIT_MAX_POSTS = 15
REDDIT_MAX_COMMENTS = 10

TWITTER_SEARCH_TERMS = ['transfer', 'football', 'ucl']
TWITTER_MAX_ITEMS = 100
TWITTER_SORT = 'Latest + Top'

results = {}
errors = {}
lock = threading.Lock()

def run_instagram_single(url):
    try:
        print(f'[Instagram] Starting Apify scrape for {url}...')
        r = subprocess.run([
            'curl','-s','-X','POST',
            f'https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/runs?token={APIFY_TOKEN}',
            '-H','Content-Type: application/json',
            '-d', json.dumps({
                'directUrls': [url],
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
            out_path = os.path.join(TMPDIR, f'ig_reel_{url.split("/")[3]}_{idx}.mp4')
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
            print(f'[Instagram] Reel {idx} done for {username} — {item.get("videoPlayCount",0):,} views')

        return {'username': username, 'reels': reel_results}
    except Exception as e:
        print(f'[Instagram] ERROR for {url}: {e}')
        return {'username': url, 'error': str(e)}

def run_instagram():
    all_ig = []
    ig_errors = []
    
    threads = []
    results_list = [None] * len(INSTAGRAM_URLS)
    
    def worker(i, url):
        results_list[i] = run_instagram_single(url)
        
    for i, url in enumerate(INSTAGRAM_URLS):
        t = threading.Thread(target=worker, args=(i, url))
        t.start()
        threads.append(t)
        
    for t in threads:
        t.join()
        
    for res in results_list:
        if 'error' in res:
            ig_errors.append(f"{res['username']}: {res['error']}")
        else:
            all_ig.append(res)
            
    with lock:
        if all_ig:
            results['instagram'] = all_ig
        if ig_errors:
            errors['instagram'] = "; ".join(ig_errors)
    print(f'[Instagram] Done! {len(all_ig)} profiles scraped.')

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


threads = []
if RUN_INSTAGRAM: threads.append(threading.Thread(target=run_instagram))
if RUN_REDDIT:    threads.append(threading.Thread(target=run_reddit))
if RUN_TWITTER:   threads.append(threading.Thread(target=run_twitter))

print(f'>>> Launching {len(threads)} platform(s) in parallel...')
for t in threads: t.start()
for t in threads: t.join()

print(f'>>> All platforms done! Building combined report...')

lines = []
lines.append('COMPETITOR RESEARCH — MASTER REPORT')
lines.append(f'Platforms: {" | ".join([p.upper() for p in results.keys()])}')
lines.append(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
lines.append('=' * 70)
lines.append('')

if 'instagram' in results:
    for ig in results['instagram']:
        lines.append('━' * 70)
        lines.append(f'PLATFORM: INSTAGRAM — @{ig["username"]}')
        lines.append('━' * 70)
        reels_sorted = sorted(ig['reels'], key=lambda x: x['views'], reverse=True)
        for r in reels_sorted:
            lines.append(f'REEL {r["index"]} | Views: {r["views"]:,} | Likes: {r["likes"]:,} | Comments: {r["comments"]:,}')
            lines.append(f'URL: {r["url"]} | Posted: {r["timestamp"]} | Duration: {r["duration"]}s')
            lines.append(f'Caption: {r["caption"]}')
            lines.append(f'Transcript: {r["transcript"]}')
            lines.append('')
        lines.append('')

if 'reddit' in results:
    rd = results['reddit']
    lines.append('━' * 70)
    lines.append(f'PLATFORM: REDDIT — Search: {rd["search_terms"]}')
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

if 'twitter' in results:
    tw = results['twitter']
    lines.append('━' * 70)
    lines.append(f'PLATFORM: TWITTER/X — Search: {tw["search_terms"]}')
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

if errors:
    lines.append('ERRORS:')
    for platform, err in errors.items():
        lines.append(f'  {platform}: {err}')
    lines.append('')

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
    if platform == 'instagram': print(f'  Instagram: {len(data)} profiles')
    elif platform == 'reddit': print(f'  Reddit: {len(data["posts"])} posts, {len(data["comments"])} comments')
    elif platform == 'twitter': print(f'  Twitter: {len(data["tweets"])} tweets')
print(f'OUTPUT_FILE={out_path}')
