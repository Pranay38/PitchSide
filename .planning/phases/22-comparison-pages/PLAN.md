# Phase 22: Comparison Pages

## Status: 📅 PLANNED

## Objective
Build scalable player-vs-player, team-vs-team, and formation-vs-formation comparison pages for programmatic SEO coverage.

## Tasks
- [ ] Create `data/comparisons.json` — seed with 20-30 high-intent comparisons
- [ ] Create `app/vs/[slug]/page.tsx` — full comparison template:
  - `generateMetadata` with "[A] vs [B]: Tactical Comparison 2026" pattern
  - JSON-LD with ItemList schema
  - Head-to-head stats table
  - Tactical analysis sections
  - Internal links to related articles
  - Breadcrumb schema
- [ ] Create `app/api/comparisons/route.ts` — CRUD for comparison data
- [ ] Add comparison routes to sitemap

## Dependencies
- Schema generators from Phase 18 ✅

## Success Criteria
- Comparison pages render with rich schema
- Each page has genuine analytical content (not thin)
- Pages appear in sitemap.xml
