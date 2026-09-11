# The Touchline Dribble

## What This Is

The Touchline Dribble is a 46K-LOC Next.js football editorial platform with live data integrations, a custom CMS, transfer reliability scoring, and an "Instigator" growth strategy. It needs to transition from an impressive side project into a product with verifiable traction for MBA admission.

## Core Value

Weaponized tactical football knowledge that drives viral engagement and converts readers into email subscribers.

## Requirements

### Validated

- [x] Custom CMS for football editorial content
- [x] Transfer reliability scoring
- [x] Live football data integrations
- [x] Newsletter engine (subscribe, welcome email, weekly digest)
- [x] OG image generation API
- [x] Admin panel with tabs
- [x] Transfer dossier pages (email-gated)
- [x] PostHog & Vercel Analytics integration
- [x] Admin metrics dashboard (subscriber growth & views)
- [x] Voting gateway modal (email capture on debates/predictions)
- [x] Magazine-style editorial email templates
- [x] Edge rate limiting on subscriber endpoint
- [x] Zero-CLS font loading (next/font/google)
- [x] Email preferences & A/B subject testing

### Active (Milestone 2)

- [ ] Fix 29 TypeScript errors and re-enable type checking
- [ ] Add 10-15 critical path tests (Vitest + Playwright)
- [ ] Build Viral Social Engine (quote cards, Twitter threads, carousels)
- [ ] Build Content Syndication pipeline (Reddit, Substack, Medium)
- [ ] Optimize mobile reading experience (mobile-only, desktop untouched)
- [ ] Break monolithic CMS files (AdminPage, StoryEditor, RichTextEditor)
- [ ] SEO quick wins (FAQ schema, sitemap expansion, llms.txt)
- [ ] Programmatic SEO expansion (player vs player, formation hubs)
- [ ] AI content assistant (outlines, internal links, social copy)
- [ ] Core Web Vitals optimization
- [ ] Clean root directory and add CI pipeline

### Out of Scope

- Multi-author support — (solo author focus for now)
- Payment/paywall integration — (sticking to email-gating for MBA timeline)
- Mobile app — (web platform is sufficient)
- Real-time features (WebSockets, live match commentary) — (too complex for current phase)
- Google AdSense — (rejected to preserve editorial prestige)
- Lead magnet funnel — (user rejected; using distribution-first growth instead)

## Context

- **MBA Trajectory:** Need verifiable traction in the next 3 months (Target: 2,500+ subscribers).
- **Architecture:** Next.js 15 App Router, MongoDB Atlas, Clerk Auth, Vercel Edge, Upstash Redis.
- **Email Pipeline:** Resend Batch API with A/B testing and preference management.
- **Build Issue:** `ignoreBuildErrors: true` masking 29 TypeScript errors — must fix in Phase 6.
- **Growth Strategy:** Distribution-first (viral social content + syndication) with existing VotingGatewayModal for conversion.

## Constraints

- **Timeline**: 90 days to ship core growth engine and prove traction.
- **Architecture**: Stick to Next.js + MongoDB.
- **UI/UX**: Needs to match the existing "brutalist" high-authority tactical brand identity.
- **Mobile changes only**: UI/UX improvements scoped exclusively to mobile — desktop layout untouched.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid Approach | Content drives traffic, platform catches leads | ✅ Active |
| Email Gating | Necessary for lead capture before implementing paywalls | ✅ Active |
| No AdSense | Preserve editorial prestige and high-end brand feel | ✅ Decided (M1) |
| No Lead Magnet Funnel | User preference — distribution-first growth over gated content | ✅ Decided (M2) |
| Viral Social Engine | Auto-generate shareable content from articles for distribution | ✅ Decided (M2) |
| Content Syndication | Cross-post to Reddit/Substack/Medium with canonical links | ✅ Decided (M2) |
| Mobile-Only UX Changes | Desktop layout untouched — optimize only mobile reading experience | ✅ Decided (M2) |
| Fix TS Before Features | Re-enable type checking as P0 before any feature work | ✅ Decided (M2) |

---
*Last updated: 2026-09-11 — Milestone 2 kickoff (Platform Hardening & Distribution Engine)*
