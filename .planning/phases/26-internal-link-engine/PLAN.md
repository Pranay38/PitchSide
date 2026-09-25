# Phase 26: Internal Link Engine

## Status: 📅 PLANNED

## Objective
Automate internal linking strategy — score pages by link authority, detect orphans, and suggest contextual links.

## Tasks
- [ ] Create `lib/internal-link-scorer.ts`:
  - Calculate link authority score per post (inbound + outbound + age + impressions)
  - Detect orphan pages (no inbound internal links)
  - Suggest link targets based on topic/tag overlap
  - Rank suggestions by authority of source page
- [ ] Enhance `src/app/components/InternalLinkSuggestion.tsx`:
  - Display scorer data in post editor sidebar
  - Show "this post has 0 inbound links — link from these high-authority pages"
  - Suggest specific anchor text using target keyword

## Dependencies
- Post model fields from Phase 25
- GSC data from Phase 20 (impressions feed into authority score)

## Success Criteria
- Orphan pages identified across all published content
- Link suggestions are contextually relevant
- Editor shows actionable suggestions while writing
