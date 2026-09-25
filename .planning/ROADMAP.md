# Roadmap

## Milestone 1: MBA-Ready Traction Engine (Archived)

**Goal:** Transform from an impressive side project into a product with verifiable traction (email subscribers and page views) within 90 days.

| Phase | Status | Focus | Success Criteria |
|-------|--------|-------|------------------|
| [Phase 0](./phases/00-critical-gap-fixes/) | ✅ Done | P0 Fixes | Newsletter error handling, cron health tracking, legacy API cleanup |
| [Phase 1](./phases/01-instigator-campaign-1/) | ⏸️ Deferred | Content Engine | Ship the Madrid Scapegoat campaign |
| [Phase 2](./phases/02-gate-transfer-dossiers/) | ✅ Done | Funnel Capture | Transfer dossiers gated behind email capture, fully tested |
| [Phase 3](./phases/03-admin-metrics-dashboard/) | ✅ Done | Measurement | Admin metrics dashboard visualizing subscriber growth & views |
| [Phase 4](./phases/04-critical-path-tests/) | ➡️ Carried to M2 | Stability | Superseded by Phase 6 + Phase 9 |
| [Phase 5](./phases/05-hit-rate-tracker/) | ⏸️ Deferred | Credibility | Public Hit Rate tracker live on homepage |

---

## Milestone 2: Platform Hardening & Distribution Engine (Archived)

**Goal:** Fix the engineering foundation, optimize mobile UX, and expand programmatic SEO — all toward the 2,500-subscriber target.

| Phase | Status | Sprint | Focus | Success Criteria |
|-------|--------|--------|-------|------------------|
| [Phase 6](./phases/06-infra-cleanup/) | ✅ Done | Sprint 1 | Infrastructure Cleanup | Root dir cleaned, env consolidated |
| [Phase 7](./phases/07-typescript-fix/) | ✅ Done | Sprint 1 | TypeScript Error Fix | 0 TS errors, build passes |
| [Phase 8](./phases/08-seo-quick-wins/) | ✅ Done | Sprint 1 | SEO Quick Wins | FAQ schema, sitemap expanded, llms.txt |
| [Phase 9](./phases/09-critical-path-tests/) | ✅ Done | Sprint 1 | Critical Path Tests | 10-15 new tests, CI pipeline |
| [Phase 12](./phases/12-mobile-reading-ux/) | ✅ Done | Sprint 2 | Mobile Reading UX | Mobile typography, progress bar |
| [Phase 13](./phases/13-cms-modularization/) | ✅ Done | Sprint 3 | CMS Modularization | AdminPage, StoryEditor split |
| [Phase 16](./phases/16-core-web-vitals/) | ✅ Done | Sprint 4 | Core Web Vitals | Lazy loading, Lighthouse 90+ |

---

## Milestone 3: SEO Growth Engine (Active)

**Goal:** Scale from ~500 impressions to 200k impressions / 50k clicks through coverage expansion, position improvement, and click capture optimization. Build the engineering infrastructure that turns the SEO growth playbook into an automated, measurable system.

**Three Growth Levers:**
1. **Coverage** → more indexed pages targeting real queries
2. **Position** → move existing pages from page 2-3 into top 5
3. **Click Capture** → titles, metas, rich results, brand searches

| Phase | Status | Sprint | Focus | Requirements | Success Criteria |
|-------|--------|--------|-------|--------------|------------------|
| Phase 17 | 🔄 In Progress | Sprint 1 | Foundation Hardening | FR-1.1–1.2 | Bing verification, WebP/AVIF image config |
| Phase 18 | 🔄 In Progress | Sprint 1 | IndexNow + Schema | FR-1.3–1.5 | IndexNow auto-ping on publish, schema generators lib, RSS verified |
| Phase 19 | 🔄 In Progress | Sprint 2 | SEO Title Engine | FR-2.1, FR-2.4 | Title utilities lib, title optimizer admin page |
| Phase 20 | 🔄 In Progress | Sprint 2 | GSC Integration | FR-2.2–2.3 | GSC API client, striking-distance dashboard |
| Phase 21 | 🔄 In Progress | Sprint 2 | Content Calendar | FR-2.5 | Publishing cadence tracker, intent distribution view |
| Phase 22 | 📅 Planned | Sprint 3 | Comparison Pages | FR-3.1–3.2 | VS page template, comparison data model + CRUD |
| Phase 23 | 📅 Planned | Sprint 3 | League & Player Hubs | FR-3.3–3.5 | League hub pages, player analysis pages, 20 managers |
| Phase 24 | 📅 Planned | Sprint 3 | Schema & Coverage | FR-3.6–3.8 | Batch generator, HowTo/Video schema, sitemap update |
| Phase 25 | 📅 Planned | Sprint 4 | Content Refresh System | FR-4.1–4.2 | Post model SEO fields, refresh tracker admin page |
| Phase 26 | 📅 Planned | Sprint 4 | Internal Link Engine | FR-4.3–4.4 | Link scorer, enhanced suggestions in editor |
| Phase 27 | 📅 Planned | Sprint 4 | SEO Reporting | FR-4.5–4.6 | Weekly metrics email, vercel.json cron |

### Dependencies
```
Phase 17 ──→ Phase 18 (foundation before indexing)
Phase 18 ──→ Phase 24 (schema lib before schema expansion)

Phase 19 ──→ Phase 25 (title utils before refresh tracker)
Phase 20 ──→ Phase 25 (GSC data feeds refresh queue)
Phase 20 ──→ Phase 27 (GSC data feeds weekly report)

Phase 22 ──→ Phase 23 (comparison template before league/player pages)
Phase 23 ──→ Phase 24 (pages exist before sitemap/batch generation)

Phase 25 ──→ Phase 26 (post model fields before link scorer)
```

### Phase Grouping (Parallelizable)
```
┌─ Sprint 1 ─────────────────────────────┐
│  Phase 17 ──→ Phase 18                 │  Foundation + IndexNow
└────────────────────────────────────────┘

┌─ Sprint 2 ─────────────────────────────┐
│  Phase 19 (titles)    ── parallel ──   │
│  Phase 20 (GSC)       ── parallel ──   │  Quick Win Tools
│  Phase 21 (calendar)                   │
└────────────────────────────────────────┘

┌─ Sprint 3 ─────────────────────────────┐
│  Phase 22 ──→ Phase 23 ──→ Phase 24   │  Coverage Expansion
└────────────────────────────────────────┘

┌─ Sprint 4 ─────────────────────────────┐
│  Phase 25 ──→ Phase 26                 │
│  Phase 27 (parallel with 25-26)        │  Compound & Track
└────────────────────────────────────────┘
```

---
*Updated: 2026-09-25 — Milestone 3 kickoff (SEO Growth Engine)*
