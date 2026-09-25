# Phase 25: Content Refresh System

## Status: 📅 PLANNED

## Objective
Build the "highest ROI activity" per the playbook — a system to track content freshness and prioritize refreshes.

## Tasks
- [ ] Add `lastSEORefresh` (Date) and `seoNotes` (string) fields to post model/schema
- [ ] Create `app/pitchside-manage-x7k9/seo-dashboard/refresh-queue/page.tsx`:
  - Posts sorted by staleness (days since last update)
  - Flag posts older than 6 weeks that still have impressions
  - Position trend (rising/falling) for each post
  - One-click "mark as refreshed" updating `updatedAt`
  - Refresh history log
- [ ] API endpoint to update `lastSEORefresh` field

## Dependencies
- GSC data from Phase 20 (for position trends)
- Title utils from Phase 19 (for showing title quality)

## Success Criteria
- Refresh queue shows posts needing attention
- Marking as refreshed updates the timestamp
- Staleness scoring is accurate
