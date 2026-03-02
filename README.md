
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
  
