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

## Milestone 2: Platform Hardening & Distribution Engine

**Goal:** Fix the engineering foundation, build automated social content distribution, optimize mobile UX, and expand programmatic SEO — all toward the 2,500-subscriber target.

| Phase | Status | Sprint | Focus | Requirements | Success Criteria |
|-------|--------|--------|-------|--------------|------------------|
| [Phase 6](./phases/06-infra-cleanup/) | 📅 Planned | Sprint 1 | Infrastructure Cleanup | FR-2 | Root dir cleaned, env consolidated, headers deduplicated, CI pipeline live |
| [Phase 7](./phases/07-typescript-fix/) | 📅 Planned | Sprint 1 | TypeScript Error Fix | FR-1.1–1.3 | 0 TS errors, `ignoreBuildErrors` removed, `npm run build` passes |
| [Phase 8](./phases/08-seo-quick-wins/) | 📅 Planned | Sprint 1 | SEO Quick Wins | FR-3 | FAQ schema on articles, sitemap expanded, llms.txt enhanced |
| [Phase 9](./phases/09-critical-path-tests/) | 📅 Planned | Sprint 1 | Critical Path Tests | FR-1.4–1.5 | 10-15 new tests, CI pipeline runs on PR |
| [Phase 12](./phases/12-mobile-reading-ux/) | ✅ Done | Sprint 2 | Mobile Reading UX | FR-6 | Mobile typography, progress bar, sticky CTA, swipe nav |
| [Phase 13](./phases/13-cms-modularization/) | ✅ Done | Sprint 3 | CMS Modularization | FR-7 | AdminPage, StoryEditor, RichTextEditor split into modules |
| [Phase 16](./phases/16-core-web-vitals/) | ✅ Done | Sprint 4 | Core Web Vitals | FR-10 | Lazy loading, dynamic imports, Lighthouse mobile 90+ |

### Dependencies
```
Phase 6 ──→ Phase 7 ──→ Phase 8 ──→ Phase 9

Phase 12 (independent, mobile-only)  CI pipeline gates all subsequent phases
Phase 16 (last — requires profiling data)
```

---
*Updated: 2026-09-11 — Milestone 2 kickoff*
