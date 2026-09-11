# State

## Current Position
- **Milestone:** 2 — Platform Hardening & Distribution Engine
- **Phase:** 6
- **Phase Name:** Infrastructure Cleanup
- **Status:** planned
- **Started:** 2026-09-11

## Decisions
- [2026-04-30] `.env.vercel.prod` verified NOT committed — `.gitignore` line 11 excludes it, zero git history
- [2026-04-30] `/api/subscribers` listing endpoint verified PROTECTED — `requireAuth()` check on line 266
- [2026-04-30] Email gate unlock mechanism: keep existing hybrid approach (hashed cookie + server validation)
- [2026-04-30] Hit Rate: hide widget until ≥10 predictions resolved
- [2026-09-11] Lead magnet funnel REJECTED — user prefers distribution-first growth (viral social + syndication)
- [2026-09-11] UI/UX changes scoped to MOBILE ONLY — desktop layout untouched
- [2026-09-11] No Google AdSense — preserve editorial brand prestige
- [2026-09-11] Phase execution order: Infra → TS Fix → SEO Quick Wins → Tests → Social Engine → Syndication → Mobile UX → CMS Split → Programmatic SEO → AI Assistant → CWV

## Blockers
(none)
