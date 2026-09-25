# Phase 24: Schema & Coverage Expansion

## Status: 📅 PLANNED

## Objective
Expand schema markup on existing pages and run batch generation for programmatic content.

## Tasks
- [ ] Add HowTo schema to tactical guide posts (when content has step-by-step format)
- [ ] Add VideoObject schema when YouTube embeds detected in post content
- [ ] Create `scripts/generate-programmatic-seo.ts`:
  - Batch seed comparisons from existing post tags/players
  - Generate player data from post mentions
  - Generate comparison slugs from team/player pairings
- [ ] Update `app/sitemap.ts` to include:
  - `/vs/[slug]` comparison pages
  - `/players/[slug]` player pages
  - `/premier-league/`, etc. league hubs

## Dependencies
- Comparison pages from Phase 22 ✅
- League/player hubs from Phase 23

## Success Criteria
- Sitemap includes all new page types
- Schema validates in Google Rich Results Test
- Batch generator can seed 100+ pages
