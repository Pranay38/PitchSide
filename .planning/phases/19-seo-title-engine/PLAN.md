# Phase 19: SEO Title Engine

## Status: 🔄 IN PROGRESS

## Objective
Build the title/meta optimization tooling that enables the "3% → 10% CTR" lever from the growth playbook.

## Tasks
- [ ] Create `lib/seo-title-utils.ts` with:
  - `generateClickTitle(base, options)` — keyword-first, year, bracket hooks
  - `validateTitle(title)` — length, keyword position, number/year/hook detection
  - `generateMetaDescription(content, keyword)` — promise-the-answer format, 155 chars
  - `suggestTitleImprovements(title)` — actionable improvement suggestions
- [ ] Create `app/pitchside-manage-x7k9/seo-dashboard/title-optimizer/page.tsx`:
  - Fetch all published posts
  - Display title with char count, validation results, suggestions
  - Color coding: green/yellow/red
  - Inline editing capability
  - Filter/sort by validation score, date, issues
  - Batch operations (add year, generate meta descriptions)

## Dependencies
- None (independent)

## Success Criteria
- Title validator catches titles >60 chars, missing years, missing hooks
- Admin can view all post titles with quality scores
- Batch "add year" operation works
