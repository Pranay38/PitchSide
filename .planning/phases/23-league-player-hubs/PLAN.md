# Phase 23: League & Player Hubs

## Status: 📅 PLANNED

## Objective
Create league-specific hub pages and player analysis templates for ~500-1000 new programmatic pages.

## Tasks
- [ ] Create league hub pages for big 5 leagues:
  - `/premier-league/`, `/la-liga/`, `/bundesliga/`, `/serie-a/`, `/ligue-1/`
  - Auto-aggregate posts tagged with each league
  - League table widget, recent match analyses, top stories
  - JSON-LD with SportsOrganization schema
- [ ] Create `app/players/[slug]/page.tsx` — player analysis template:
  - Player stats, recent form, tactical role analysis
  - Related articles mentioning the player
  - JSON-LD with Person + SportsTeam schema
- [ ] Create `data/players.json` — seed with 50-100 top players
- [ ] Expand `data/manager_pressure.json` from 2 → 20 managers (big 5 leagues)
- [ ] Add all new routes to sitemap

## Dependencies
- Comparison template from Phase 22

## Success Criteria
- 5 league hub pages with auto-aggregated content
- 50+ player analysis pages
- 20 manager pressure pages
- All pages have proper metadata, schema, and canonical URLs
