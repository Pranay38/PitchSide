---
name: content-scraper
description: Football content intelligence scraper for Instagram Reels, YouTube Shorts, and Twitter/X. Scrapes competitor accounts and keyword-targeted content in the football/soccer niche, extracts video transcripts via OpenAI Whisper, and outputs a viral content leaderboard sorted by views with engagement rate analysis. Targets Premier League, Champions League, La Liga, Serie A, Bundesliga, and football tactics/culture content.
---

# Football Content Scraper

Multi-platform content intelligence tool for the football/soccer niche. Scrapes Instagram Reels, YouTube Shorts, and Twitter/X posts from competitor accounts and keyword searches, transcribes video audio via OpenAI Whisper, and generates a viral content leaderboard.

## Prerequisites

- `.env` file in project root with:
  - `APIFY_TOKEN` — Apify API token ([get one here](https://console.apify.com/account/integrations))
  - `OPENAI_API_KEY` — OpenAI API key for Whisper transcription ([get one here](https://platform.openai.com/api-keys))
- Node.js 20.6+ (for native `--env-file` support)
- `ffmpeg` installed locally (for audio extraction: `brew install ffmpeg`)

## Configuration

### Niche & Keywords

This skill is pre-configured for football/soccer content. The keyword list is defined in `config.json` and includes:

```
"Premier League", "Champions League", "UCL", "La Liga", "Serie A",
"Bundesliga", "Real Madrid", "Barcelona", "Inter Milan", "AC Milan",
"football tactics", "transfer news", "set pieces", "football culture",
"match ratings", "tactical analysis", "football thread"
```

### Competitor Accounts

The following accounts are tracked across platforms:

| Handle | Platform(s) |
|--------|------------|
| `@onemufc` | Instagram, Twitter/X |
| `@talkfootballhd` | Instagram, YouTube, Twitter/X |
| `@markaroni` | Instagram, YouTube |
| `@divyansh` | Instagram, YouTube |
| `@yjr` | Instagram, YouTube |
| `@TifoFootball` | Instagram, YouTube, Twitter/X |
| `@TheAthleticFC` | Instagram, Twitter/X |
| `@Squawka` | Instagram, Twitter/X |
| `@OptaJoe` | Twitter/X |
| `@footballdaily` | Instagram, YouTube, Twitter/X |

### Viral Thresholds

A post is flagged with 🔥 **VIRAL** if:
- Engagement Rate (ER) > **5%**, OR
- Views > **100,000**

## Workflow

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 1: Verify prerequisites and load config
- [ ] Step 2: Scrape Instagram Reels
- [ ] Step 3: Scrape YouTube Shorts
- [ ] Step 4: Scrape Twitter/X posts
- [ ] Step 5: Transcribe video content with Whisper
- [ ] Step 6: Merge, compute metrics, and generate output
- [ ] Step 7: Present results and offer follow-ups
```

---

### Step 1: Verify Prerequisites and Load Config

Before running any scrapes, verify the environment:

```bash
node --env-file=.env ${SKILL_ROOT}/scripts/verify_env.js
```

This checks for:
- `APIFY_TOKEN` in .env
- `OPENAI_API_KEY` in .env
- `ffmpeg` availability
- Node.js version compatibility

If any check fails, help the user fix the issue before proceeding.

Load the configuration:

```bash
cat ${SKILL_ROOT}/config.json
```

The config contains all keywords, competitor handles, platform mappings, and viral thresholds. You can modify `config.json` directly to add/remove accounts or keywords.

---

### Step 2: Scrape Instagram Reels

Use the Apify Instagram Reel Scraper to collect Reels from competitor accounts.

**For each competitor Instagram handle**, run:

```bash
node --env-file=.env ${SKILL_ROOT}/../apify-ultimate-scraper/reference/scripts/run_actor.js \
  --actor "apify/instagram-reel-scraper" \
  --input '{"usernames": ["HANDLE"], "resultsLimit": 30}' \
  --output "${SKILL_ROOT}/output/raw/instagram_HANDLE.json" \
  --format json
```

**For keyword-based discovery**, run:

```bash
node --env-file=.env ${SKILL_ROOT}/../apify-ultimate-scraper/reference/scripts/run_actor.js \
  --actor "apify/instagram-hashtag-scraper" \
  --input '{"hashtags": ["premierleague", "championsleague", "footballtactics", "transfernews", "laliga", "seriea"], "resultsLimit": 50}' \
  --output "${SKILL_ROOT}/output/raw/instagram_hashtags.json" \
  --format json
```

After scraping, normalize the data with:

```bash
node --env-file=.env ${SKILL_ROOT}/scripts/normalize_instagram.js \
  --input-dir "${SKILL_ROOT}/output/raw" \
  --output "${SKILL_ROOT}/output/normalized/instagram.json" \
  --days 7
```

This extracts: `hook_text`, `caption`, `video_url`, `views`, `likes`, `comments`, `post_date`, `username`, `engagement_rate`.

---

### Step 3: Scrape YouTube Shorts

Use the Apify YouTube Shorts Scraper for competitor channels.

**For each competitor YouTube channel**, run:

```bash
node --env-file=.env ${SKILL_ROOT}/../apify-ultimate-scraper/reference/scripts/run_actor.js \
  --actor "streamers/youtube-shorts-scraper" \
  --input '{"channelUrls": ["https://youtube.com/@HANDLE"], "maxResults": 30, "sortBy": "date"}' \
  --output "${SKILL_ROOT}/output/raw/youtube_HANDLE.json" \
  --format json
```

**For keyword-based discovery**, run:

```bash
node --env-file=.env ${SKILL_ROOT}/../apify-ultimate-scraper/reference/scripts/run_actor.js \
  --actor "streamers/youtube-shorts-scraper" \
  --input '{"searchQueries": ["Premier League", "Champions League", "football tactics", "transfer news", "tactical analysis"], "maxResults": 50, "sortBy": "date"}' \
  --output "${SKILL_ROOT}/output/raw/youtube_keywords.json" \
  --format json
```

Normalize with:

```bash
node --env-file=.env ${SKILL_ROOT}/scripts/normalize_youtube.js \
  --input-dir "${SKILL_ROOT}/output/raw" \
  --output "${SKILL_ROOT}/output/normalized/youtube.json" \
  --days 7
```

---

### Step 4: Scrape Twitter/X Posts

Use the Apify Twitter Scraper for competitor accounts and keyword searches.

**For each competitor Twitter handle**, run:

```bash
node --env-file=.env ${SKILL_ROOT}/../apify-ultimate-scraper/reference/scripts/run_actor.js \
  --actor "apidojo/tweet-scraper" \
  --input '{"handles": ["HANDLE"], "maxItems": 50, "sort": "Latest"}' \
  --output "${SKILL_ROOT}/output/raw/twitter_HANDLE.json" \
  --format json
```

**For keyword-based discovery**, run:

```bash
node --env-file=.env ${SKILL_ROOT}/../apify-ultimate-scraper/reference/scripts/run_actor.js \
  --actor "apidojo/tweet-scraper" \
  --input '{"searchTerms": ["Premier League", "Champions League UCL", "football tactics", "transfer news thread", "tactical analysis"], "maxItems": 100, "sort": "Top"}' \
  --output "${SKILL_ROOT}/output/raw/twitter_keywords.json" \
  --format json
```

Normalize with:

```bash
node --env-file=.env ${SKILL_ROOT}/scripts/normalize_twitter.js \
  --input-dir "${SKILL_ROOT}/output/raw" \
  --output "${SKILL_ROOT}/output/normalized/twitter.json" \
  --days 7
```

---

### Step 5: Transcribe Video Content with Whisper

For all Instagram Reels and YouTube Shorts with video URLs, extract audio and transcribe using OpenAI Whisper.

```bash
node --env-file=.env ${SKILL_ROOT}/scripts/transcribe_videos.js \
  --input "${SKILL_ROOT}/output/normalized/instagram.json" \
  --input "${SKILL_ROOT}/output/normalized/youtube.json" \
  --output "${SKILL_ROOT}/output/transcripts.json" \
  --max-concurrent 3
```

This script:
1. Downloads each video URL to a temp file
2. Extracts audio using `ffmpeg` (converts to mp3)
3. Sends audio to OpenAI Whisper API (`whisper-1` model)
4. Attaches transcript text to each post record
5. Cleans up temp files

**Note**: Twitter/X posts are text-based so transcription is skipped — the tweet text itself serves as the "transcript".

**Cost Warning**: Each Whisper transcription costs ~$0.006/min of audio. For a typical run of ~50 videos averaging 30s each, expect ~$0.15 in Whisper costs.

---

### Step 6: Merge, Compute Metrics, and Generate Output

Merge all normalized data, compute engagement rates, apply viral flags, and generate the final leaderboard:

```bash
node --env-file=.env ${SKILL_ROOT}/scripts/generate_leaderboard.js \
  --instagram "${SKILL_ROOT}/output/normalized/instagram.json" \
  --youtube "${SKILL_ROOT}/output/normalized/youtube.json" \
  --twitter "${SKILL_ROOT}/output/normalized/twitter.json" \
  --transcripts "${SKILL_ROOT}/output/transcripts.json" \
  --output "${SKILL_ROOT}/output/leaderboard.csv" \
  --viral-er 5 \
  --viral-views 100000
```

**Output columns** (sorted by views, highest first):

| Column | Description |
|--------|-------------|
| `rank` | Position in leaderboard |
| `viral_tag` | 🔥 VIRAL if ER > 5% or views > 100K |
| `platform` | Instagram / YouTube / Twitter |
| `content_format` | Reel / Short / Tweet / Thread |
| `account` | @handle of the creator |
| `hook_text` | First line / opening hook of the content |
| `full_caption` | Complete caption or tweet text |
| `transcript` | Whisper-transcribed audio (video) or tweet text |
| `views` | Total view count |
| `likes` | Total likes |
| `comments` | Total comments |
| `engagement_rate` | (likes + comments) / views × 100 |
| `post_date` | Date of publication |
| `post_url` | Direct link to the content |

The output is saved as both:
- **CSV** at `output/leaderboard.csv` — for spreadsheet analysis
- **JSON** at `output/leaderboard.json` — for programmatic use

---

### Step 7: Present Results and Offer Follow-ups

After generating the leaderboard, present the results to the user:

1. **Summary stats**: Total posts scraped, breakdown by platform, number of viral posts
2. **Top 10 leaderboard**: Show the top 10 posts as a formatted table
3. **Viral posts**: Highlight all 🔥 VIRAL posts separately
4. **Insights**: Note patterns in viral content (hooks, topics, formats)

**Suggested follow-up workflows:**

| Analysis | Description |
|----------|-------------|
| **Hook analysis** | Extract and categorize the opening hooks from viral content |
| **Content calendar** | Use viral topics to plan your own content calendar |
| **Transcript mining** | Search transcripts for specific topics (e.g., "set pieces") |
| **Trend tracking** | Run weekly to track which accounts are growing fastest |
| **Repurpose ideas** | Identify viral formats to adapt for your own PitchSide blog |

---

## Quick Run (All Steps)

To run the entire pipeline in one shot:

```bash
node --env-file=.env ${SKILL_ROOT}/scripts/run_full_pipeline.js
```

This executes Steps 2–6 sequentially and outputs the final leaderboard.

---

## Error Handling

| Error | Solution |
|-------|----------|
| `APIFY_TOKEN not found` | Add `APIFY_TOKEN=your_token` to `.env` |
| `OPENAI_API_KEY not found` | Add `OPENAI_API_KEY=your_key` to `.env` |
| `ffmpeg not found` | Install with `brew install ffmpeg` |
| `Actor not found` | Check Actor ID — run `search_actors.js` to find alternatives |
| `Run FAILED` | Check Apify console link in error output for details |
| `Whisper rate limit` | Reduce `--max-concurrent` to 1 and retry |
| `No results for handle` | The account may have a different handle on that platform — check manually |

## File Structure

```
content-scraper/
├── SKILL.md                          # This file
├── config.json                       # Keywords, accounts, thresholds
├── scripts/
│   ├── verify_env.js                 # Environment checker
│   ├── normalize_instagram.js        # Instagram data normalizer
│   ├── normalize_youtube.js          # YouTube data normalizer
│   ├── normalize_twitter.js          # Twitter data normalizer
│   ├── transcribe_videos.js          # Whisper transcription pipeline
│   ├── generate_leaderboard.js       # Merge + rank + viral tagging
│   └── run_full_pipeline.js          # Full pipeline runner
└── output/
    ├── raw/                          # Raw Apify output (per-platform, per-handle)
    ├── normalized/                   # Cleaned and filtered (last 7 days)
    ├── transcripts.json              # Whisper transcriptions
    ├── leaderboard.csv               # Final leaderboard (CSV)
    └── leaderboard.json              # Final leaderboard (JSON)
```
