# Phase 20: GSC Integration

## Status: 🔄 IN PROGRESS

## Objective
Connect Google Search Console data to the platform for striking-distance analysis and performance tracking.

## Tasks
- [ ] Create `lib/gsc-client.ts`:
  - Dual-mode: Google API (service account) OR CSV import fallback
  - `getStrikingDistanceQueries()` — positions 8-20, sorted by impressions
  - `getLowCTRPages()` — positions 3-10 with below-average CTR
  - `getQueryDistribution()` — count by position bucket
  - `getBrandedVsNonBranded()` — split by brand name variations
  - `getTopGainersLosers()` — period comparison
  - `parseGSCExport(csv)` — standard CSV format parser
- [ ] Create SEO dashboard layout `app/pitchside-manage-x7k9/seo-dashboard/layout.tsx`:
  - Sidebar nav: Dashboard, Title Optimizer, Content Calendar, Refresh Queue
  - Dark admin theme
- [ ] Create `app/pitchside-manage-x7k9/seo-dashboard/page.tsx`:
  - KPI cards: Impressions, Clicks, CTR, Position, Indexed Pages (with WoW deltas)
  - Striking-distance table (pos 8-20) — sortable, color-coded
  - CTR opportunities table (pos 3-10, low CTR)
  - Position distribution bar chart
  - CSV upload fallback area
- [ ] Update `.env.example` with GSC env vars

## Dependencies
- None (independent)

## Success Criteria
- Dashboard loads with CSV import
- If API credentials set, auto-fetches from GSC
- Striking-distance table highlights best opportunities
- Position distribution shows clear picture of ranking health
