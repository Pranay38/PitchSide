---
name: content-validator
description: Processes raw scraped content, applies engagement scoring (Views/ER/Comments), uses AI to cluster topics, and outputs a strategic content planning report with actionable recommendations for a football blog.
---

# Content Validator

This skill analyzes raw social media engagement data scraped by `content-scraper`, filtering out poor performers, grading the remainder using a weighted composite score, clustering the topics via OpenAI, and ranking the best ideas for the next week of content creation.

## Requirements
- Node.js 20+
- The `content-scraper` must have run recently and generated `output/leaderboard.json`
- `OPENAI_API_KEY` must be set in the project `.env` file

## Usage

To generate the next content validation report:

```bash
node --env-file=.env .agents/skills/content-validator/scripts/validate_content.js
```

## Logic
1. **Filtering**: Removes any post under 10k views, under 2% Engagement Rate, or older than 30 days.
2. **Scoring**: Applies a composite score:
   - Views (40% weight): High signal > 100k views
   - Engagement Rate (35% weight): Viral > 5% ER
   - Comment Volume (25% weight)
3. **Clustering**: Sends caption/hook text to OpenAI to assign semantic topic clusters (e.g., "UCL tactical breakdowns").
4. **Ranking & History**: Reads historical topic performance to flag sustained trends, and outputs the final recommendation logic.

## Output
The script outputs a markdown file at `.agents/skills/content-validator/output/validation_report.md` containing the actionable strategy.
