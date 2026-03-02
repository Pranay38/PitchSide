
  # Football Blog Platform MVP

  This is a code bundle for Football Blog Platform MVP. The original project is available at https://www.figma.com/design/XOjQ38iyRocBiiy1XUt0TW/Football-Blog-Platform-MVP.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Web-Scraped Transfer Cache

  The transfer ticker and season transfer APIs now read from `public/data/transfers_scraped.json` first, with `public/data/transfers.json` as fallback.

  ### Generate cache locally

  1. Install scraper dependencies:
     `pip install -r scripts/requirements-transfers.txt`
  2. Run scraper:
     `python scripts/scrape_transfermarkt_transfers.py`
  3. Optional fallback-only run (no network):
     `python scripts/scrape_transfermarkt_transfers.py --no-network`

  ### Automated daily refresh

  A GitHub Actions workflow is included at `.github/workflows/update-transfer-cache.yml`.

  - Schedule: daily at `03:15 UTC`
  - Trigger: also supports manual `workflow_dispatch`
  - Output updated: `public/data/transfers_scraped.json`

## Fan Pulse Daily ML Cache

Fan Pulse supports a daily precomputed cache generated from hot posts and top comments in `r/soccer`.

- Script: `scripts/generate_fan_pulse_cache.py`
- Output: `public/data/fan_pulse_cache.json`
- Workflow: `.github/workflows/update-fan-pulse-cache.yml`

### Generate cache locally

1. Install pipeline dependencies:
   `pip install -r scripts/requirements-fan-pulse.txt`
2. Install spaCy English model:
   `python -m spacy download en_core_web_sm`
3. Run generator:
   `python scripts/generate_fan_pulse_cache.py`

Optional credentials for higher Reddit reliability (recommended for GitHub Actions):

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`

If credentials are not provided, the script automatically falls back to Reddit public JSON endpoints.

### Automated daily refresh

The GitHub Actions workflow:

- Schedule: daily at `03:45 UTC`
- Trigger: also supports manual `workflow_dispatch`
- Output updated: `public/data/fan_pulse_cache.json`

Runtime behavior:

- `/api/fan-pulse` reads the daily cache first.
- If the cache file is missing or that topic is unavailable, it falls back to live fetching.
  
