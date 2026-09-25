# Phase 27: SEO Reporting

## Status: 📅 PLANNED

## Objective
Automated weekly SEO scoreboard — the playbook's "What to Track Weekly" delivered to your inbox.

## Tasks
- [ ] Create `app/api/seo-weekly-report/route.ts`:
  - Cron-triggered (Monday 9am UTC)
  - Pull from GSC API: impressions, clicks, CTR, position distribution
  - Compare with previous week (WoW deltas)
  - Format as HTML email: KPI table, top gainers/losers, action items
  - Send via existing Resend/Nodemailer integration
- [ ] Add cron to `vercel.json`:
  ```json
  { "path": "/api/seo-weekly-report", "schedule": "0 9 * * 1" }
  ```

## Dependencies
- GSC client from Phase 20

## Success Criteria
- Weekly email arrives Monday morning
- Contains the 5 KPIs from the playbook
- Gainers/losers highlight what to double down on
